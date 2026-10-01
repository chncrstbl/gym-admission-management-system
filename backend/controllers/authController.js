import db from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import process from 'node:process';

// Unified Login Handler (Conditional Fallback without a frontend toggle)
export const login = async (req, res) => {
    const { email, password } = req.body;
    console.log("--> Login attempt received for:", email);

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password.' })
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        console.log("--> Users found in DB:", users.length);

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("--> Password match result:", isMatch);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const [members] = await db.query(
            'SELECT * FROM members WHERE email = ? AND status != ?',
            [email, 'Deleted']
        )

        const isMember = members.length > 0
        const memberData = isMember ? members[0] : null

        const tokenPayload = {
            id: isMember ? memberData.id : user.id,
            userId: user.id,
            email: user.email,
            role: isMember ? 'member' : 'admin'
        }

        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('token', token, {
            httpOnly: true, 
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });
        
        if (isMember) {
            return res.json({ 
                success: true, 
                userType: 'member', 
                user: { 
                    id: memberData.id, 
                    name: memberData.email, 
                    email: memberData.unique_id, 
                    role: 'member' 
                } 
            });
        } else {
            return res.json({
                success: true,
                userType: 'admin',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: 'admin'
                }
            })
        }

    } catch (err) {
        console.error("Login controller error:", err);
        return res.status(500).json({ success: false, message: 'Internal server error during login.' });
    }
};

// Secure Token-Isolated Member Profile Retrieval Route
export const getMemberProfile = async (req, res) => {
    try {
        // req.user is set by authMiddleware from the JWT token
        const memberId = req.user?.id;
        const memberEmail = req.user?.email;

        if (!memberId && !memberEmail) {
            return res.status(401).json({ success: false, message: 'Unauthorized session.' });
        }

        // Query by ID first, fallback to email to match users <-> members
        const [rows] = await db.query(
                `SELECT id, unique_id, first_name, last_name, email, contact_number, 
                    address, role, status, image, qr_code, joined AS start_date, end_date, 
                    emergency_contact_name, emergency_contact_phone, dob, gender
                FROM members 
                WHERE id = ? OR email = ? 
                LIMIT 1`,
            [memberId, memberEmail]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Member profile not found in database.' });
        }

        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Fetch profile error:', err);
        return res.status(500).json({ success: false, message: 'Database error fetching profile.' });
    }
};

export const getMemberDashboard = async (req, res) => {
    try {
        const memberId = req.user?.id;
        const memberEmail = req.user?.email;

        if (!memberId && !memberEmail) {
            return res.status(401).json({ success: false, message: 'Unauthorized session.' });
        }

        // 1. Fetch Member Profile
        const [members] = await db.query(
            `SELECT id, unique_id, first_name, last_name, email, role, status, image, joined AS start_date, end_date 
                FROM members 
                WHERE id = ? OR email = ? 
                LIMIT 1`,
            [memberId, memberEmail]
        );

        if (members.length === 0) {
            return res.status(404).json({ success: false, message: 'Member profile not found.' });
        }

        const member = members[0];

        let todayCheckIn = null;
        let monthlySessions = 0;
        let recentVisits = [];
        let attendanceAvailable = true;
        try {
            const [todayLogs] = await db.query(
                `SELECT id, check_in_time, check_out_time, terminal, method, status
                    FROM attendance
                    WHERE member_id = ? AND DATE(check_in_time) = CURDATE()
                    ORDER BY check_in_time DESC
                    LIMIT 1`,
                [member.id]
            );
            const [monthlyCount] = await db.query(
                `SELECT COUNT(*) AS total FROM attendance
                    WHERE member_id = ? AND MONTH(check_in_time) = MONTH(CURRENT_DATE())
                    AND YEAR(check_in_time) = YEAR(CURRENT_DATE())`,
                [member.id]
            );
            const [visitRows] = await db.query(
                `SELECT id, check_in_time, check_out_time, terminal, method, status
                    FROM attendance WHERE member_id = ? ORDER BY check_in_time DESC LIMIT 5`,
                [member.id]
            );
            todayCheckIn = todayLogs[0] || null;
            monthlySessions = monthlyCount[0]?.total || 0;
            recentVisits = visitRows;
        } catch (err) {
            if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
            attendanceAvailable = false;
        }

        // 5. Fetch Active Announcements (Safe query if table exists)
        let announcements = [];
        try {
            const [announcementRows] = await db.query(
                `SELECT id, title, content, category, created_at 
                    FROM announcements 
                    ORDER BY created_at DESC 
                    LIMIT 3`
            );
            announcements = announcementRows;
        } catch {
            announcements = [];
        }

        return res.json({
            success: true,
            data: {
                member,
                todayCheckIn,
                monthlySessions,
                recentVisits,
                attendanceAvailable,
                announcements
            }
        });

    } catch (err) {
        console.error('Fetch dashboard error:', err);
        return res.status(500).json({ success: false, message: 'Server database error.' });
    }
};