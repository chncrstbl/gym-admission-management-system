import db from '../config/db.js';
import { logActivity } from '../utils/helpers.js';

// 1. GET ALL PAYMENTS
export const getPayments = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.id, p.ref_no, CONCAT(m.first_name, ' ', m.last_name) as member_name, p.amount, p.payment_method, p.payment_date, p.status 
            FROM payments p
            LEFT JOIN members m ON p.member_id = m.id
            ORDER BY p.payment_date DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. GET DASHBOARD STATS
export const getStats = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const [revThisYear] = await db.query("SELECT SUM(amount) as total FROM payments WHERE status IN ('Paid', 'Completed') AND YEAR(payment_date) = ?", [currentYear]);
        const [revLastYear] = await db.query("SELECT SUM(amount) as total FROM payments WHERE status IN ('Paid', 'Completed') AND YEAR(payment_date) = ?", [currentYear - 1]);
        
        const thisYearTotal = revThisYear[0].total || 0;
        const lastYearTotal = revLastYear[0].total || 0;
        
        let growth = lastYearTotal > 0 ? ((thisYearTotal - lastYearTotal) / lastYearTotal) * 100 : (thisYearTotal > 0 ? 100 : 0);
        const growthFormatted = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;

        const [outstanding] = await db.query("SELECT SUM(amount) as total, COUNT(*) as count FROM payments WHERE status = 'Overdue'");
        const [active] = await db.query("SELECT COUNT(*) as count FROM members WHERE status = 'Active'");
        const [newThisMonth] = await db.query("SELECT COUNT(*) as count FROM members WHERE status = 'Active' AND MONTH(joined) = MONTH(CURRENT_DATE()) AND YEAR(joined) = YEAR(CURRENT_DATE())");

        res.json([
            { title: "Total Revenue", value: thisYearTotal, subValue: `${growthFormatted} vs last year`, isPositive: growth >= 0 },
            { title: "Outstanding Invoices", value: outstanding[0].total || 0, subValue: `${outstanding[0].count} Invoices overdue`, isPositive: false },
            { title: "Active Members", value: active[0].count, subValue: `+${newThisMonth[0].count} this month`, isPositive: true }
        ]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. RECORD NEW PAYMENT
export const recordPayment = async (req, res) => {
    const memberId = Number(req.body?.memberId);
    const amount = Number(req.body?.amount);
    const method = typeof req.body?.method === 'string' ? req.body.method.trim() : '';

    if (!Number.isSafeInteger(memberId) || memberId <= 0 ||
        !Number.isFinite(amount) || amount <= 0 || amount > 1000000 ||
        !method || method.length > 40) {
        return res.status(400).json({ error: 'Provide a valid member, positive payment amount, and payment method.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [members] = await connection.query(
            `SELECT id, first_name, last_name, image, status
             FROM members WHERE id = ? AND status != 'Deleted' LIMIT 1 FOR UPDATE`,
            [memberId]
        );
        if (!members.length) {
            await connection.rollback();
            return res.status(404).json({ error: 'Member not found.' });
        }

        const [result] = await connection.query(
            'INSERT INTO payments (member_id, amount, payment_method, payment_date, status) VALUES (?, ?, ?, NOW(), "Completed")',
            [memberId, amount, method]
        );

        // Only known membership-plan prices grant/extend membership access.
        const plansByAmount = {
            50: { role: 'Daily', days: 1 },
            500: { role: 'Half Month', days: 15 },
            1000: { role: 'Monthly', days: 30 }
        };
        const plan = plansByAmount[amount];
        if (plan) {
            const days = plan.days; // Internal constant, never provided by the request.
            await connection.query(
                `UPDATE members
                 SET role = ?, status = 'Active',
                     end_date = DATE_ADD(
                         CASE WHEN end_date IS NULL OR end_date < NOW() THEN NOW() ELSE end_date END,
                         INTERVAL ${days} DAY
                     )
                 WHERE id = ?`,
                [plan.role, memberId]
            );
        }

        await connection.commit();

        const member = members[0];
        try {
            await logActivity(
                `${member.first_name} ${member.last_name} payment recorded (Invoice #${result.insertId})`,
                'payment',
                member.image
            );
        } catch (logError) {
            console.error('Payment recorded but activity logging failed:', logError);
        }

        return res.status(201).json({
            success: true,
            message: plan ? 'Payment recorded and membership extended.' : 'Payment recorded.',
            paymentId: result.insertId
        });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Record payment error:', err);
        return res.status(500).json({ error: 'Failed to record payment.' });
    } finally {
        connection?.release();
    }
};

// 4. UPDATE PAYMENT STATUS
export const updatePaymentStatus = async (req, res) => {
    const paymentId = Number(req.params.id);
    const status = typeof req.body?.status === 'string' ? req.body.status.trim() : '';
    const allowedStatuses = new Set(['Paid', 'Completed', 'Pending', 'Overdue', 'Void', 'Unsuccessful']);

    if (!Number.isSafeInteger(paymentId) || paymentId <= 0 || !allowedStatuses.has(status)) {
        return res.status(400).json({ error: 'Provide a valid invoice ID and payment status.' });
    }

    let connection;
    let activityDetails = null;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [payments] = await connection.query(
            'SELECT id, member_id, amount, status, ref_no FROM payments WHERE id = ? LIMIT 1 FOR UPDATE',
            [paymentId]
        );
        if (!payments.length) {
            await connection.rollback();
            return res.status(404).json({ error: 'Payment not found.' });
        }

        const payment = payments[0];
        const previousStatus = payment.status;

        // Do not allow a completed payment to be silently changed back to unpaid.
        if (['Paid', 'Completed'].includes(previousStatus) && status !== previousStatus &&
            !(['Paid', 'Completed'].includes(status))) {
            await connection.rollback();
            return res.status(409).json({ error: 'A completed payment cannot be downgraded or voided here. Use a separate verified refund/correction workflow.' });
        }

        // Member portal renewal requests are pending until a staff member confirms receipt.
        // The reference contains a server-generated plan code; the posted amount is never trusted.
        let renewalPlan = null;
        if (['Pending', 'Overdue', 'Unsuccessful'].includes(previousStatus) && ['Paid', 'Completed'].includes(status) &&
            typeof payment.ref_no === 'string' && payment.ref_no.startsWith('REN-')) {
            const match = /^REN-([DHM])-([A-F0-9]{8})$/i.exec(payment.ref_no);
            const plansByCode = {
                D: { role: 'Daily', days: 1, amount: 50 },
                H: { role: 'Half Month', days: 15, amount: 500 },
                M: { role: 'Monthly', days: 30, amount: 1000 }
            };
            renewalPlan = match ? plansByCode[match[1].toUpperCase()] : null;

            if (!renewalPlan || Number(payment.amount) !== renewalPlan.amount) {
                await connection.rollback();
                return res.status(409).json({ error: 'Renewal invoice plan or amount is invalid; payment status was not changed.' });
            }

            const [members] = await connection.query(
                "SELECT id, first_name, last_name, image FROM members WHERE id = ? AND status != 'Deleted' LIMIT 1 FOR UPDATE",
                [payment.member_id]
            );
            if (!members.length) {
                await connection.rollback();
                return res.status(404).json({ error: 'The member for this renewal no longer exists.' });
            }

            const days = renewalPlan.days; // Internal plan constant, not user-controlled input.
            await connection.query(
                `UPDATE members
                 SET role = ?, status = 'Active',
                     end_date = DATE_ADD(
                         CASE WHEN end_date IS NULL OR end_date < NOW() THEN NOW() ELSE end_date END,
                         INTERVAL ${days} DAY
                     )
                 WHERE id = ?`,
                [renewalPlan.role, payment.member_id]
            );
            activityDetails = {
                member: members[0],
                description: `${members[0].first_name} ${members[0].last_name} renewal verified (${renewalPlan.role})`
            };
        }

        await connection.query('UPDATE payments SET status = ? WHERE id = ?', [status, paymentId]);
        await connection.commit();

        try {
            const description = activityDetails
                ? activityDetails.description
                : `Invoice #${paymentId} marked as ${status}`;
            await logActivity(description, activityDetails ? 'payment' : 'edit', activityDetails?.member?.image || null);
        } catch (logError) {
            console.error('Payment status updated but activity logging failed:', logError);
        }

        return res.json({
            success: true,
            message: renewalPlan ? 'Payment verified and membership renewed.' : 'Payment status updated.',
            membershipActivated: Boolean(renewalPlan)
        });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Update payment status error:', err);
        return res.status(500).json({ error: 'Could not update payment status.' });
    } finally {
        connection?.release();
    }
};

// 5. DELETE PAYMENT
export const deletePayment = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM payments WHERE id = ?', [id]);
        res.json({ message: "Payment deleted" });
    } catch {
        res.status(500).json({ error: "Delete failed" });
    }
};

// 6. GENERATE REPORT
export const getRevenueReport = async (req, res) => {
    const { period, date } = req.query;
    try {
        let query = `
            SELECT p.id, p.ref_no, CONCAT(m.first_name, ' ', m.last_name) as member_name, 
                   m.email as member_email, m.contact_number as member_phone, m.role as member_role,
                   p.amount, p.payment_method, p.status, p.payment_date 
            FROM payments p
            LEFT JOIN members m ON p.member_id = m.id
            WHERE p.status IN ('Paid', 'Completed', 'Void') 
        `;
        const params = [];
        const selectedDate = date ? new Date(date) : new Date();

        if (period === 'day') { query += " AND DATE(payment_date) = DATE(?)"; params.push(selectedDate); }
        else if (period === 'week') { query += " AND payment_date BETWEEN DATE_SUB(?, INTERVAL 7 DAY) AND DATE_ADD(?, INTERVAL 1 DAY)"; params.push(selectedDate, selectedDate); }
        else if (period === 'month') { query += " AND MONTH(payment_date) = MONTH(?) AND YEAR(payment_date) = YEAR(?)"; params.push(selectedDate, selectedDate); }
        else if (period === 'year') { query += " AND YEAR(payment_date) = YEAR(?)"; params.push(selectedDate); }

        query += " ORDER BY p.payment_date DESC";
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 7. GET ANALYTICS
export const getAnalytics = async (req, res) => {
    try {
        const [roles] = await db.query(`SELECT role as name, COUNT(*) as value FROM members WHERE status != 'Deleted' GROUP BY role`);
        const [trends] = await db.query(`
            SELECT DATE_FORMAT(joined, '%b') as name, COUNT(*) as members
            FROM members 
            WHERE joined >= DATE_SUB(NOW(), INTERVAL 6 MONTH) AND status != 'Deleted'
            GROUP BY DATE_FORMAT(joined, '%Y-%m'), DATE_FORMAT(joined, '%b') 
            ORDER BY DATE_FORMAT(joined, '%Y-%m') ASC
        `);
        res.json({ roles, trends });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};