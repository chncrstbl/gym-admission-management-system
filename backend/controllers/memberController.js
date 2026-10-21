/* eslint-disable no-undef */
import db from '../config/db.js'
import { logActivity, getLocalMySQLDate } from '../utils/helpers.js'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

// HELPER: AUTO-EXPIRE MEMBERS
// const updateExpiredMembers = async () => {
//     try {
//         await db.query(`
//             UPDATE members 
//             SET status = 'Inactive' 
//             WHERE end_date < CURDATE() AND status = 'Active'
//         `)
//     } catch (err) {
//         console.error("Failed to auto-expire members:", err)
//     }
// }

// PAYMENT: SLEEP FUNCTION
// const simulateBankDelay = () => new Promise(resolve => setTimeout(resolve, 2000))

// ROUTE 1: GET MEMBERS
export const getMembers = async (req, res) => {
    try {
        // await updateExpiredMembers() 
        const rawPage = parseInt(req.query.page, 10)
        const rawLimit = parseInt(req.query.limit, 10)

        const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1
        const limit = !isNaN(rawLimit) && rawLimit > 0 ? Math.min(100, Math.max(1, rawLimit)) : 10
        const offset = (page - 1) * limit

        const search = (req.query.search || '').trim()

        let query = "SELECT * FROM members WHERE status != 'Deleted'"
        let countQuery = "SELECT COUNT(*) as total FROM members WHERE status != 'Deleted'"
        let params = []

        if (search) {
            const searchSQL = ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR unique_id LIKE ?)`
            query += searchSQL
            countQuery += searchSQL
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
        }

        query += ' ORDER BY joined DESC LIMIT ? OFFSET ?'
        const queryParams = [...params, limit, offset]

        const [members] = await db.query(query, queryParams)
        const [countResult] = await db.query(countQuery, params)
        const total = countResult[0]?.total || 0
        
        res.json({
            data: members,
            pagination: {
                total, 
                page, 
                limit, 
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (err) {
        console.error("Failed to fetch members:", err)
        return res.status(500).json({ error: "Failed to fetch members" })
    }
}

// ROUTE 2: ADD MEMBER
export const addMember = async (req, res) => {
    const { 
        firstName, 
        lastName, 
        dob, 
        gender, 
        email, 
        password,
        contactNumber, 
        address, 
        emergencyContactName, 
        emergencyContactPhone, 
        role, 
        image, 
        paymentMethod 
    } = req.body

    // 1. Validation
    if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: "First name, last name, and email are required." })
    }

    if (!password || password.trim().length < 6) {
        return res.status(400).json({ error: "Password is required and must be at least 6 characters." })
    }

    const cleanEmail = email.trim().toLowerCase()
    const fullName = `${firstName.trim()} ${lastName.trim()}`

    // 2. Uniqueness check across users and members
    try {
        const [existingUser] = await db.query("SELECT id FROM users WHERE email = ?", [cleanEmail])
        const [existingMember] = await db.query("SELECT id FROM members WHERE email = ? AND status != 'Deleted'", [cleanEmail])

        if (existingUser.length > 0 || existingMember.length > 0) {
            return res.status(409).json({ error: "An account with this email already exists." })
        }
    } catch (err) {
        console.error("Email uniqueness verification error:", err)
        return res.status(500).json({ error: "Failed to verify email availability." })
    }

    let finalImage = image
    if (!finalImage) {
        finalImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff`
    }

    const safeRole = role ? role.trim() : "Standard"
    let price = 50 
    let daysToAdd = 1

    if (safeRole === 'Half Month') { price = 500 ; daysToAdd = 15 }
    else if (safeRole === 'Monthly') { price = 1000 ; daysToAdd = 30 }

    const joined = new Date()
    const endDate = new Date(joined)
    endDate.setDate(endDate.getDate() + daysToAdd)
    const status = 'Active'

    const connection = await db.getConnection()

    try {
        // await simulateBankDelay()

        // 3. Hash password using bcrypt
        const hashedPassword = await bcrypt.hash(password.trim(), 10)

        const refNo = `INV-${Math.floor(100000 + Math.random() * 900000)}`
        const joinedSQL = getLocalMySQLDate(joined)
        const endSQL = getLocalMySQLDate(endDate)
        const memberUniqueID = Math.floor(10000 + Math.random() * 90000).toString()

        await connection.beginTransaction()

        // 4. Insert into `users` table
        await connection.query(
            "INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, 'member', NOW())",
            [fullName, cleanEmail, hashedPassword]
        )

        // 5. Insert into `members` table (saving the hashed password)
        const [result] = await connection.query(
            `INSERT INTO members 
            (unique_id, first_name, last_name, dob, gender, email, password, contact_number, address, emergency_contact_name, emergency_contact_phone, role, status, joined, end_date, image, qr_code) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [
                memberUniqueID,
                firstName.trim(), 
                lastName.trim(), 
                dob || null, 
                gender || null, 
                cleanEmail, 
                hashedPassword,
                contactNumber || null, 
                address || null, 
                emergencyContactName || null, 
                emergencyContactPhone || null, 
                safeRole, 
                status, 
                joinedSQL, 
                endSQL, 
                finalImage,
                memberUniqueID // 17th value for qr_code
            ] 
        );
        const newMemberId = result.insertId;
        
        // 6. Payment insertion
        const methodToSave = paymentMethod || 'Cash' 
        await connection.query(
            "INSERT INTO payments (member_id, amount, payment_method, payment_date, status, ref_no) VALUES (?, ?, ?, NOW(), 'Completed', ?)",
            [newMemberId, price, methodToSave, refNo] 
        )
        await connection.commit()
        
        await logActivity(`${fullName} joined via ${methodToSave} (Ref: ${refNo})`, 'add', finalImage) 
        
        return res.status(201).json({
            id: newMemberId, 
            unique_id: memberUniqueID, 
            message: "Payment Verified & Member Added" 
        })
    
    } catch (err) {
        await connection.rollback()

        if (err.code === 'ER_DUP_ENTRY' && !err.sqlMessage?.includes(cleanEmail)) {
            return addMember(req, res) 
        }

        console.error("DATABASE ERROR in addMember:", err) 
        return res.status(500).json({ error: "Failed to process member registration transaction." })
    } finally {
        connection.release()
    }
}

// ROUTE 3: MEMBER STATS
export const getMemberStats = async (req, res) => {
    try {
        // await updateExpiredMembers()

        const [totalRes] = await db.query("SELECT COUNT(*) as count FROM members WHERE status != 'Deleted'")
        const [activeRes] = await db.query("SELECT COUNT(*) as count FROM members WHERE status = 'Active'")
        const [expiringRes] = await db.query("SELECT COUNT(*) as count FROM members WHERE end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY) AND status != 'Deleted'")
        const [todayRes] = await db.query("SELECT COUNT(*) as count FROM members WHERE DATE(joined) = CURDATE() AND status != 'Deleted'")
        
        return res.json({
            total: totalRes[0].count || 0,
            active: activeRes[0].count || 0,
            expiring: expiringRes[0].count || 0,
            newToday: todayRes[0].count || 0
        })
    } catch (err) {
        console.error("Failed to fetch member stats:", err)
        return res.status(500).json({ error: "Failed to fetch member stats" })
    }
}

// ROUTE 4: DELETE MEMBER (Atomic Transaction for users & members cleanup)
export const deleteMember = async (req, res) => {
    const { id } = req.params
    const connection = await db.getConnection()

    try {
        const [rows] = await connection.query('SELECT first_name, last_name, email, image FROM members WHERE id = ?', [id])
        if (rows.length === 0) {
            return res.status(404).json({ error: "Member not found" })
        }
        
        const member = rows[0]

        await connection.beginTransaction()

        await connection.query("DELETE FROM users WHERE email = ?", [member.email])

        await connection.query("UPDATE payments SET status = 'Void' WHERE member_id = ?", [id])

        await connection.query(
            "UPDATE members SET status = 'Deleted', email = CONCAT('del_', ?, '_', email) WHERE id = ?", 
            [Date.now(), id]
        )

        await connection.commit()

        await logActivity(`${member.first_name} ${member.last_name} was removed (Archived)`, 'delete', member.image)
        return res.json({ message: "Member deleted successfully" })

    } catch (err) {
        await connection.rollback()
        console.error("Delete Transaction Error:", err)
        return res.status(500).json({ error: "Failed to delete member." })
    } finally {
        connection.release()
    }
}

// ROUTE 5: EDIT MEMBER (Atomic Transaction + Email Uniqueness on Update)
export const updateMember = async (req, res) => {
    const { id } = req.params
    const { 
        firstName, 
        lastName, 
        dob, 
        gender, 
        email, 
        contactNumber, 
        address, 
        emergencyContactName, 
        emergencyContactPhone, 
        role, 
        image, 
        recordPayment, 
        paymentMethod 
    } = req.body

    const connection = await db.getConnection()

    try {
        // 1. Fetch current record to verify existence and check for email changes
        const [current] = await connection.query(
            "SELECT id, email, first_name, last_name FROM members WHERE id = ? AND status != 'Deleted'", 
            [id]
        )

        if (current.length === 0) {
            return res.status(404).json({ error: "Member not found" })
        }

        const oldEmail = current[0].email
        const cleanEmail = email ? email.trim().toLowerCase() : oldEmail
        const fullName = `${(firstName || current[0].first_name).trim()} ${(lastName || current[0].last_name).trim()}`

        // 2. Validate email uniqueness if changing email address
        if (cleanEmail !== oldEmail) {
            const [dupUser] = await connection.query("SELECT id FROM users WHERE email = ? AND email != ?", [cleanEmail, oldEmail])
            const [dupMember] = await connection.query("SELECT id FROM members WHERE email = ? AND id != ? AND status != 'Deleted'", [cleanEmail, id])

            if (dupUser.length > 0 || dupMember.length > 0) {
                return res.status(409).json({ error: "The new email address is already in use by another account." })
            }
        }

        // 3. Begin Transaction
        await connection.beginTransaction()

        let updateQuery = `UPDATE members SET first_name=?, last_name=?, dob=?, gender=?, email=?, contact_number=?, address=?, emergency_contact_name=?, emergency_contact_phone=?, role=?, image=?`
        let params = [firstName, lastName, dob || null, gender || null, cleanEmail, contactNumber, address || null, emergencyContactName || null, emergencyContactPhone || null, role, image]
        let price = 50

        if (recordPayment) {
            const effectiveDate = new Date() 
            const newEndDate = new Date(effectiveDate.getTime())
            const safeRole = role ? role.trim() : "Daily"

            if (safeRole === 'Half Month') { newEndDate.setDate(newEndDate.getDate() + 15) ; price = 300 } 
            else if (safeRole === 'Monthly') { newEndDate.setMonth(newEndDate.getMonth() + 1) ; price = 500 } 
            else { newEndDate.setDate(newEndDate.getDate() + 1) }

            const endSQL = getLocalMySQLDate(newEndDate)

            updateQuery += `, end_date=?, status='Active' WHERE id=?`
            params.push(endSQL, id)

            await connection.query(updateQuery, params)
            
            await connection.query(
                "INSERT INTO payments (member_id, amount, payment_method, payment_date, status) VALUES (?, ?, ?, NOW(), 'Completed')", 
                [id, price, paymentMethod || 'Cash']
            )
        } else {
            updateQuery += ` WHERE id=?`
            params.push(id)
            await connection.query(updateQuery, params)
        }

        // 4. Synchronize name and email to `users` table
        await connection.query(
            "UPDATE users SET name = ?, email = ? WHERE email = ?", 
            [fullName, cleanEmail, oldEmail]
        )

        await connection.commit()

        if (recordPayment) {
            await logActivity(`Renewed ${firstName} ${lastName}'s plan (${role || 'Daily'}) - Paid ₱${price || 50}`, 'payment', image)
        } else {
            await logActivity(`Updated details for ${firstName} ${lastName}`, 'edit', image)
        }

        return res.json({ message: "Member updated successfully" })

    } catch (err) {
        await connection.rollback()
        console.error("UPDATE ERROR:", err)
        return res.status(500).json({ error: "Failed to update member." })
    } finally {
        connection.release()
    }
}

// ROUTE 6: PROCESS GLOBAL QR SCANNER CHECK-IN
export const processQRCheckIn = async (req, res) => {
    const qrData = req.body.qrData || req.body.qr_code || req.body.code || req.body.text;

    if (!qrData) {
        return res.status(400).json({ error: "No QR scan data received." })
    }

    try {

        let uniqueId = null

        if(qrData.startsWith('GAMS:SIGN:')) {
            const parts = qrData.split(':')
            if (parts.length === 5) {
                const [ , , extractedId, timestampStr, signature] = parts
                const timestamp = parseInt(timestampStr, 10)

                const now = Date.now()
                if (Math.abs(now - timestamp) > 60 * 1000) {
                    return res.status(403).json({ error: "QR Pass has expired. Please refresh the pass on your screen."})
                }

                const secret = process.env.JWT_SECRET || 'gams-qr-signing-key'
                const expectedSignature = crypto
                    .createHmac('sha256', secret)
                    .update(`${extractedId}:${timestampStr}`)
                    .digest('hex')

                if (signature !== expectedSignature) {
                    return res.status(403).json({ error: "Invalid QR Pass signature." })
                }

                uniqueId = extractedId
        }
    }
    else if (qrData.startsWith('GAMS-MBR-')) {
        uniqueId = qrData.replace('GAMS-MBR-', '')
    } else {
        uniqueId = qrData.trim()
    }

    if(!uniqueId) {
        return res.status(400).json({ error: "Malformed QR token payload." })
    }

    const [members] = await db.query(
        "SELECT id, first_name, last_name, status, image FROM members WHERE unique_id = ? AND status != 'Deleted'", 
        [uniqueId]
    )

    if (members.length === 0) {
        return res.status(404).json({ error: "No active gym profile matches this entry card."})
    }

    const member = members[0]
    if (member.status === 'Inactive') {
        return res.status(403).json({ error: `${member.first_name}'s membership is expired.`})
    }

    await db.query(
        "INSERT INTO attendance (member_id, check_in_time, terminal, method, status) VALUES (?, NOW(), ?, ?, ?)",
        [member.id, 'Main Turnstile', 'QR Scan', 'Approved']
    )

    await logActivity(`${member.first_name} ${member.last_name} checked in via QR Scanner`, 'check-in', member.image)
    return res.status(200).json({ success: true, memberName: `${member.first_name} ${member.last_name}`})
    
} catch (error) {
        console.error("QR Check-In Processing Fault:", error);
        return res.status(500).json({ error: "System failed checking in client credentials." });
    }
}

// ROUTE 7: ANALYTICS (Charts)
export const getAnalytics = async (req, res) => {
    try {
        const [roles] = await db.query(`
            SELECT role as name, COUNT(*) as value 
            FROM members 
            WHERE status != 'Deleted' 
            GROUP BY role
        `)

        const [trends] = await db.query(`
            SELECT DATE_FORMAT(joined, '%b') as name, COUNT(*) as members
            FROM members 
            WHERE joined >= DATE_SUB(NOW(), INTERVAL 6 MONTH) 
            AND status != 'Deleted'
            GROUP BY DATE_FORMAT(joined, '%Y-%m'), DATE_FORMAT(joined, '%b') 
            ORDER BY DATE_FORMAT(joined, '%Y-%m') ASC
        `)

        res.json({ roles, trends })
    } catch (err) {
        console.error("Analytics Error:", err)
        res.status(500).json({ error: "Failed to fetch analytics" })
    }
}