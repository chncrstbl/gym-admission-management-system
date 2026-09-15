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
    const { memberId, amount, method } = req.body;
    try {
        await db.query('INSERT INTO payments (member_id, amount, payment_method, payment_date, status) VALUES (?, ?, ?, NOW(), "Completed")', [memberId, amount, method]);
        await db.query("UPDATE members SET status = 'Active' WHERE id = ?", [memberId]);

        const [rows] = await db.query('SELECT first_name, last_name, image FROM members WHERE id = ?', [memberId]);
        if (rows.length > 0) {
            await logActivity(`${rows[0].first_name} ${rows[0].last_name} paid ₱${amount} (Account Activated)`, 'payment', rows[0].image);
        }
        res.json({ success: true, message: "Payment recorded & Member Activated" });
    } catch (err) {
        res.status(500).json({ error: "Failed to record payment" });
    }
};

// 4. UPDATE PAYMENT STATUS
export const updatePaymentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.query('UPDATE payments SET status = ? WHERE id = ?', [status, id]);
        const [rows] = await db.query(`SELECT p.id, m.first_name, m.last_name, m.image FROM payments p LEFT JOIN members m ON p.member_id = m.id WHERE p.id = ?`, [id]);
        if (rows.length > 0) {
            await logActivity(`Invoice #${id} marked as ${status}`, 'edit', rows[0].image);
        }
        res.json({ message: "Status updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. DELETE PAYMENT
export const deletePayment = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM payments WHERE id = ?', [id]);
        res.json({ message: "Payment deleted" });
    } catch (err) {
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