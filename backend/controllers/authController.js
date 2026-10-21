import db from '../config/db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import process from 'node:process'
import crypto from 'crypto'

// Enforce strict environment variable validation at startup
if (!process.env.JWT_SECRET) {
    console.error('FATAL CONFIG ERROR: JWT_SECRET environment variable is missing.')
    process.exit(1)
}

// Unified Login Handler
export const login = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password.' })
    }

    try {
        const cleanEmail = email.trim().toLowerCase()

        // 1. Fetch user credentials (using * prevents SQL crash if role column is pending migration)
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?', 
            [cleanEmail]
        )

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' })
        }

        const user = users[0]

        // 2. Verify password with bcrypt
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' })
        }

        // 3. Check for matching active membership profile
        const [members] = await db.query(
            'SELECT * FROM members WHERE email = ? AND status != ?',
            [cleanEmail, 'Deleted']
        )

        const isMember = members.length > 0
        const memberData = isMember ? members[0] : null

        // Determine role: prioritize DB role column, fallback safely based on profile presence
        const assignedRole = user.role || (isMember ? 'member' : 'admin')

        let tokenPayload = null
        let responseUser = null
        let userType = assignedRole

        if (assignedRole === 'admin' || assignedRole === 'staff') {
            tokenPayload = {
                id: user.id,
                userId: user.id,
                email: user.email,
                role: assignedRole
            }

            responseUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: assignedRole
            }
        } else {
            // Must have an active member record to log in as a member
            if (!memberData) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied: No active membership profile associated with this account.' 
                })
            }

            userType = 'member'

            tokenPayload = {
                id: memberData.id,
                userId: user.id,
                email: user.email,
                role: 'member'
            }

            responseUser = {
                id: memberData.id,
                name: `${memberData.first_name} ${memberData.last_name}`.trim(),
                email: memberData.email,
                unique_id: memberData.unique_id,
                role: 'member'
            }
        }

        // 4. Sign token using validated secret
        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        )

        const isProduction = process.env.NODE_ENV === 'production'
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        })

        return res.json({
            success: true,
            userType,
            user: responseUser
        })

    } catch (err) {
        console.error('Login processing error:', err)
        return res.status(500).json({ success: false, message: 'Internal server error during login.' })
    }
}

// Secure Token-Isolated Member Profile Retrieval Route
export const getMemberProfile = async (req, res) => {
    try {
        const memberId = req.user?.id
        const memberEmail = req.user?.email

        if (!memberId && !memberEmail) {
            return res.status(401).json({ success: false, message: 'Unauthorized session.' })
        }

        const [rows] = await db.query(
            `SELECT id, unique_id, first_name, last_name, email, contact_number, 
                    address, role, status, image, qr_code, joined AS start_date, end_date, 
                    emergency_contact_name, emergency_contact_phone, dob, gender
             FROM members 
             WHERE id = ? OR email = ? 
             LIMIT 1`,
            [memberId, memberEmail]
        )

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Member profile not found in database.' })
        }

        return res.json({ success: true, data: rows[0] })
    } catch (err) {
        console.error('Fetch profile error:', err)
        return res.status(500).json({ success: false, message: 'Database error fetching profile.' })
    }
}

export const getDynamicQRToken = async (req, res) => {
    try {
        // 1. Extract identifier from query or all common JWT payload structures
        const queryUniqueId = req.query.uniqueId
        const memberId = req.user?.id || req.user?.userId || req.userId || req.user?.memberId || (typeof req.user === 'number' || typeof req.user === 'string' ? req.user : null)
        const memberEmail = req.user?.email || req.user?.user?.email || req.email

        let rows = []

        // 2. Query member profile
        if (queryUniqueId) {
            [rows] = await db.query(
                "SELECT unique_id, status FROM members WHERE unique_id = ? AND status != 'Deleted' LIMIT 1",
                [queryUniqueId]
            )
        } else if (memberId || memberEmail) {
            [rows] = await db.query(
                "SELECT unique_id, status FROM members WHERE id = ? OR email = ? LIMIT 1",
                [memberId || null, memberEmail || null]
            )
        } else {
            return res.status(401).json({ success: false, message: 'Unauthorized session.' })
        }

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Member profile not found.' })
        }

        const member = rows[0]
        const timestamp = Date.now()
        const secret = process.env.JWT_SECRET || 'gams-qr-signing-key'

        // 3. Generate HMAC-SHA256 signature
        const signature = crypto
            .createHmac('sha256', secret)
            .update(`${member.unique_id}:${timestamp}`)
            .digest('hex')

        const token = `GAMS:SIGN:${member.unique_id}:${timestamp}:${signature}`

        return res.json({
            success: true,
            token,
            expiresIn: 60,
            status: member.status
        })
    } catch (err) {
        console.error('Failed generating dynamic QR token:', err)
        return res.status(500).json({ success: false, message: 'Server error generating QR pass.' })
    }
}

export const getMemberDashboard = async (req, res) => {
    try {
        const memberId = req.user?.id
        const memberEmail = req.user?.email

        if (!memberId && !memberEmail) {
            return res.status(401).json({ success: false, message: 'Unauthorized session.' })
        }

        const [members] = await db.query(
            `SELECT id, unique_id, first_name, last_name, email, role, status, image, joined AS start_date, end_date 
             FROM members 
             WHERE id = ? OR email = ? 
             LIMIT 1`,
            [memberId, memberEmail]
        )

        if (members.length === 0) {
            return res.status(404).json({ success: false, message: 'Member profile not found.' })
        }

        const member = members[0]

        let todayCheckIn = null
        let monthlySessions = 0
        let recentVisits = []
        let attendanceAvailable = true

        try {
            const [todayLogs] = await db.query(
                `SELECT id, check_in_time, check_out_time, terminal, method, status
                 FROM attendance
                 WHERE member_id = ? AND DATE(check_in_time) = CURDATE()
                 ORDER BY check_in_time DESC
                 LIMIT 1`,
                [member.id]
            )
            const [monthlyCount] = await db.query(
                `SELECT COUNT(*) AS total FROM attendance
                 WHERE member_id = ? AND MONTH(check_in_time) = MONTH(CURRENT_DATE())
                 AND YEAR(check_in_time) = YEAR(CURRENT_DATE())`,
                [member.id]
            )
            const [visitRows] = await db.query(
                `SELECT id, check_in_time, check_out_time, terminal, method, status
                 FROM attendance WHERE member_id = ? ORDER BY check_in_time DESC LIMIT 5`,
                [member.id]
            )
            todayCheckIn = todayLogs[0] || null
            monthlySessions = monthlyCount[0]?.total || 0
            recentVisits = visitRows
        } catch (err) {
            if (err.code !== 'ER_NO_SUCH_TABLE') throw err
            attendanceAvailable = false
        }

        let announcements = []
        try {
            const [announcementRows] = await db.query(
                `SELECT id, title, content, category, created_at 
                 FROM announcements 
                 ORDER BY created_at DESC 
                 LIMIT 3`
            )
            announcements = announcementRows
        } catch {
            announcements = []
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
        })

    } catch (err) {
        console.error('Fetch dashboard error:', err)
        return res.status(500).json({ success: false, message: 'Server database error.' })
    }
}