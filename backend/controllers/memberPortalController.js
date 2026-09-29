import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import db from '../config/db.js';

const plans = {
    daily: { role: 'Daily', amount: 50, days: 1 },
    half_month: { role: 'Half Month', amount: 500, days: 15 },
    monthly: { role: 'Monthly', amount: 1000, days: 30 }
};

export const getMemberPayments = async (req, res) => {
    try {
        const [payments] = await db.query(
            `SELECT id, ref_no, amount, payment_method, payment_date, status
                FROM payments WHERE member_id = ? ORDER BY payment_date DESC`,
            [req.user.id]
        );
        res.json({ success: true, data: payments });
    } catch (err) {
        console.error('Fetch member payments error:', err);
        res.status(500).json({ success: false, message: 'Could not load payment history.' });
    }
};

export const renewMemberPlan = async (req, res) => {
    const plan = plans[req.body.planId];
    const methods = { gcash: 'GCash', maya: 'Maya', cash: 'Cash' };
    const method = methods[req.body.paymentMethod];
    if (!plan || !method) {
        return res.status(400).json({ success: false, message: 'Choose a valid plan and payment method.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [members] = await connection.query(
            'SELECT first_name, last_name, image, end_date FROM members WHERE id = ? AND status != \'Deleted\' FOR UPDATE',
            [req.user.id]
        );
        if (!members.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Member not found.' });
        }

        const now = new Date();
        const priorExpiry = members[0].end_date ? new Date(members[0].end_date) : null;
        const startsFrom = priorExpiry && priorExpiry > now ? priorExpiry : now;
        const newExpiry = new Date(startsFrom);
        newExpiry.setDate(newExpiry.getDate() + plan.days);
        const reference = `INV-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;

        await connection.query(
            `UPDATE members SET role = ?, status = 'Active', end_date = ? WHERE id = ?`,
            [plan.role, newExpiry, req.user.id]
        );
        const [paymentResult] = await connection.query(
            `INSERT INTO payments (member_id, amount, payment_method, payment_date, status, ref_no)
                VALUES (?, ?, ?, NOW(), 'Completed', ?)`,
            [req.user.id, plan.amount, method, reference]
        );
        const memberName = [members[0].first_name, members[0].last_name].filter(Boolean).join(' ') || 'Member';
        await connection.query(
            `INSERT INTO activity_logs (description, action_type, time, image)
                VALUES (?, 'payment', NOW(), ?)`,
            [`${memberName} renewed ${plan.role} plan (Invoice ${reference}) via ${method}`, members[0].image || null]
        );
        await connection.commit();

        res.status(201).json({
            success: true,
            data: {
                id: paymentResult.insertId,
                refNo: reference,
                date: new Date().toISOString(),
                plan: plan.role,
                amount: plan.amount,
                method,
                status: 'Completed',
                endDate: newExpiry
            }
        });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Member plan renewal error:', err);
        res.status(500).json({ success: false, message: 'Could not save membership renewal.' });
    } finally {
        connection?.release();
    }
};

export const getMemberVisits = async (req, res) => {
    try {
        const [visits] = await db.query(
            `SELECT id, check_in_time, check_out_time, terminal, method, status
                FROM attendance WHERE member_id = ? ORDER BY check_in_time DESC`,
            [req.user.id]
        );
        const [stats] = await db.query(
            `SELECT COUNT(*) AS totalVisits,
                SUM(YEAR(check_in_time) = YEAR(CURRENT_DATE()) AND MONTH(check_in_time) = MONTH(CURRENT_DATE())) AS monthlyVisits,
                SUM(YEAR(check_in_time) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND MONTH(check_in_time) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))) AS previousMonthlyVisits,
                AVG(CASE WHEN check_out_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, check_in_time, check_out_time) END) AS averageMinutes
                FROM attendance WHERE member_id = ?`,
            [req.user.id]
        );
        res.json({ success: true, data: { visits, stats: stats[0] } });
    } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.json({
                success: true,
                data: {
                    visits: [],
                    stats: { totalVisits: 0, monthlyVisits: 0, previousMonthlyVisits: 0, averageMinutes: null },
                    attendanceAvailable: false
                }
            });
        }
        console.error('Fetch member visits error:', err);
        res.status(500).json({ success: false, message: 'Could not load attendance history.' });
    }
};

export const getMemberProgress = async (req, res) => {
    try {
        let measurements = [];
        let goals = [];
        let monthlyVisits = 0;
        const availability = { measurements: true, goals: true, attendance: true };

        try {
            const [rows] = await db.query(
                'SELECT id, measured_at, weight_kg, body_fat_percent, muscle_mass_kg, notes FROM member_measurements WHERE member_id = ? ORDER BY measured_at DESC',
                [req.user.id]
            );
            measurements = rows;
        } catch (err) {
            if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
            availability.measurements = false;
        }

        try {
            const [rows] = await db.query(
                'SELECT id, metric, target_value, unit FROM member_goals WHERE member_id = ? ORDER BY metric',
                [req.user.id]
            );
            goals = rows;
        } catch (err) {
            if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
            availability.goals = false;
        }

        try {
            const [rows] = await db.query(
                `SELECT COUNT(*) AS monthlyVisits FROM attendance WHERE member_id = ?
                    AND YEAR(check_in_time) = YEAR(CURRENT_DATE()) AND MONTH(check_in_time) = MONTH(CURRENT_DATE())`,
                [req.user.id]
            );
            monthlyVisits = rows[0].monthlyVisits;
        } catch (err) {
            if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
            availability.attendance = false;
        }

        res.json({ success: true, data: { measurements, goals, monthlyVisits, availability } });
    } catch (err) {
        console.error('Fetch member progress error:', err);
        res.status(500).json({ success: false, message: 'Could not load fitness progress.' });
    }
};

export const addMemberMeasurement = async (req, res) => {
    const { weight, bodyFat, muscleMass, notes } = req.body;
    const values = [weight, bodyFat, muscleMass];
    if (values.some((value) => value !== null && value !== undefined && (!Number.isFinite(Number(value)) || Number(value) <= 0)) ||
        values.every((value) => value === null || value === undefined || value === '')) {
        return res.status(400).json({ success: false, message: 'Enter at least one valid positive measurement.' });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO member_measurements (member_id, measured_at, weight_kg, body_fat_percent, muscle_mass_kg, notes)
                VALUES (?, NOW(), ?, ?, ?, ?)`,
            [req.user.id, weight || null, bodyFat || null, muscleMass || null, notes?.trim() || null]
        );
        res.status(201).json({ success: true, data: { id: result.insertId } });
    } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.status(503).json({ success: false, message: 'Fitness measurement storage is not installed. Apply backend/member-portal-schema.sql.' });
        }
        console.error('Save member measurement error:', err);
        res.status(500).json({ success: false, message: 'Could not save the measurement.' });
    }
};

export const saveMemberGoal = async (req, res) => {
    const allowedMetrics = { weight: 'kg', body_fat: '%', muscle_mass: 'kg', monthly_visits: 'sessions' };
    const { metric, target } = req.body;
    if (!allowedMetrics[metric] || !Number.isFinite(Number(target)) || Number(target) <= 0) {
        return res.status(400).json({ success: false, message: 'Choose a valid goal and positive target.' });
    }

    try {
        await db.query(
            `INSERT INTO member_goals (member_id, metric, target_value, unit) VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE target_value = VALUES(target_value), unit = VALUES(unit)`,
            [req.user.id, metric, target, allowedMetrics[metric]]
        );
        res.json({ success: true });
    } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.status(503).json({ success: false, message: 'Fitness goal storage is not installed. Apply backend/member-portal-schema.sql.' });
        }
        console.error('Save member goal error:', err);
        res.status(500).json({ success: false, message: 'Could not save the goal.' });
    }
};

export const getMemberSettings = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT email_receipts, sms_alerts, promotions, attendance_logs FROM member_settings WHERE member_id = ?',
            [req.user.id]
        );
        res.json({
            success: true,
            storageAvailable: true,
            data: rows[0] || { email_receipts: 1, sms_alerts: 1, promotions: 0, attendance_logs: 1 }
        });
    } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.json({
                success: true,
                storageAvailable: false,
                data: { email_receipts: 1, sms_alerts: 1, promotions: 0, attendance_logs: 1 }
            });
        }
        console.error('Fetch member settings error:', err);
        res.status(500).json({ success: false, message: 'Could not load member settings.' });
    }
};

export const saveMemberSettings = async (req, res) => {
    const { emailReceipts, smsAlerts, promotions, attendanceLogs } = req.body;
    try {
        await db.query(
            `INSERT INTO member_settings (member_id, email_receipts, sms_alerts, promotions, attendance_logs)
                VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE
                email_receipts = VALUES(email_receipts), sms_alerts = VALUES(sms_alerts),
                promotions = VALUES(promotions), attendance_logs = VALUES(attendance_logs)`,
            [req.user.id, Boolean(emailReceipts), Boolean(smsAlerts), Boolean(promotions), Boolean(attendanceLogs)]
        );
        res.json({ success: true });
    } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.status(503).json({ success: false, message: 'Member settings storage is not installed. Apply backend/member-portal-schema.sql.' });
        }
        console.error('Save member settings error:', err);
        res.status(500).json({ success: false, message: 'Could not save member settings.' });
    }
};

export const saveMemberProfile = async (req, res) => {
    const {
        firstName,
        lastName,
        dob,
        gender,
        email,
        contactNumber,
        address,
        emergencyContactName,
        emergencyContactPhone
    } = req.body;
    if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
        return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        await connection.query(
            `UPDATE members SET first_name = ?, last_name = ?, dob = ?, gender = ?, email = ?,
                contact_number = ?, address = ?, emergency_contact_name = ?, emergency_contact_phone = ?
                WHERE id = ?`,
            [
                firstName?.trim() || null,
                lastName?.trim() || null,
                dob || null,
                gender?.trim() || null,
                email.trim(),
                contactNumber?.trim() || null,
                address?.trim() || null,
                emergencyContactName?.trim() || null,
                emergencyContactPhone?.trim() || null,
                req.user.id
            ]
        );
        await connection.query('UPDATE users SET email = ? WHERE id = ?', [email.trim(), req.user.userId]);
        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        if (connection) await connection.rollback();
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'That email address is already in use.' });
        }
        console.error('Save member profile error:', err);
        res.status(500).json({ success: false, message: 'Could not save account details.' });
    } finally {
        connection?.release();
    }
};

export const changeMemberPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    try {
        const [users] = await db.query('SELECT id, password FROM users WHERE id = ?', [req.user.userId]);
        if (!users.length || !await bcrypt.compare(currentPassword || '', users[0].password)) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [passwordHash, req.user.userId]);
        res.json({ success: true });
    } catch (err) {
        console.error('Change member password error:', err);
        res.status(500).json({ success: false, message: 'Could not update password.' });
    }
};