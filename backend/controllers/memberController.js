import db from '../config/db.js';
import { logActivity, getLocalMySQLDate } from '../utils/helpers.js';
import QRCode from 'qrcode';

// HELPER: AUTO-EXPIRE MEMBERS
const updateExpiredMembers = async () => {
    try {
        await db.query(`
            UPDATE members 
            SET status = 'Inactive' 
            WHERE end_date < CURDATE() AND status = 'Active'
        `);
    } catch (err) {
        console.error("Failed to auto-expire members:", err);
    }
};

// PAYMENT: SLEEP FUNCTION
const simulateBankDelay = () => new Promise(resolve => setTimeout(resolve, 2000));

// ROUTE 1: GET MEMBERS
export const getMembers = async (req, res) => {
    try {
        await updateExpiredMembers(); 

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let query = "SELECT * FROM members WHERE status != 'Deleted'";
        let countQuery = "SELECT COUNT(*) as total FROM members WHERE status != 'Deleted'";
        let params = [];

        if (search) {
            const searchSQL = ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR unique_id LIKE ?)`;
            query += searchSQL;
            countQuery += searchSQL;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY joined DESC LIMIT ? OFFSET ?';
        const queryParams = [...params, limit, offset];

        const [members] = await db.query(query, queryParams);
        const [countResult] = await db.query(countQuery, params);
        
        res.json({
            data: members,
            pagination: { total: countResult[0].total, page, limit, totalPages: Math.ceil(countResult[0].total / limit) }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch members" });
    }
};

// ROUTE 2: ADD MEMBER
export const addMember = async (req, res) => {
    const { firstName, lastName, dob, gender, email, contactNumber, address, emergencyContactName, emergencyContactPhone, role, image, paymentMethod } = req.body;
    
    let finalImage = image;
    if (!finalImage) {
        finalImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=random&color=fff`;
    }

    const safeRole = role ? role.trim() : "Standard";
    let price = 50; 
    let daysToAdd = 1;

    if (safeRole === 'Half Month') { price = 500; daysToAdd = 15; }
    else if (safeRole === 'Monthly') { price = 1000; daysToAdd = 30; }

    const joined = new Date();
    const endDate = new Date(joined);
    endDate.setDate(endDate.getDate() + daysToAdd);
    const status = 'Active'; 

    try {
        await simulateBankDelay();
        const refNo = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
        const joinedSQL = getLocalMySQLDate(joined);
        const endSQL = getLocalMySQLDate(endDate);

        const memberUniqueID = Math.floor(10000 + Math.random() * 90000).toString();

        const [result] = await db.query(
            `INSERT INTO members 
            (unique_id, first_name, last_name, dob, gender, email, contact_number, address, emergency_contact_name, emergency_contact_phone, role, status, joined, end_date, image) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [memberUniqueID, firstName, lastName, dob || null, gender || null, email, contactNumber, address || null, emergencyContactName || null, emergencyContactPhone || null, safeRole, status, joinedSQL, endSQL, finalImage]
        );
        const newMemberId = result.insertId;

        const qrPayload = `GAMS-MBR-${memberUniqueID}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrPayload);
        
        await db.query(`UPDATE members SET qr_code = ? WHERE id = ?`, [qrCodeDataUrl, newMemberId]);

        const methodToSave = paymentMethod || 'Cash';
        await db.query(
            'INSERT INTO payments (member_id, amount, payment_method, payment_date, status, ref_no) VALUES (?, ?, ?, NOW(), "Completed", ?)',
            [newMemberId, price, methodToSave, refNo]
        );
        
        await logActivity(`${firstName} ${lastName} joined via ${methodToSave} (Ref: ${refNo})`, 'add', finalImage);
        
        res.status(201).json({ id: newMemberId, unique_id: memberUniqueID, message: "Payment Verified & Member Added" });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return addMember(req, res);
        console.error("DATABASE ERROR:", err);
        res.status(500).json({ error: "Failed to process transaction" });
    }
};

// ROUTE 3: MEMBER STATS
export const getMemberStats = async (req, res) => {
    try {
        await updateExpiredMembers();

        const [totalRes] = await db.query("SELECT COUNT(*) as count FROM members WHERE status != 'Deleted'");
        const [activeRes] = await db.query("SELECT COUNT(*) as count FROM members WHERE status = 'Active'");
        const [expiringRes] = await db.query("SELECT COUNT(*) as count FROM members WHERE end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY) AND status != 'Deleted'");
        const [todayRes] = await db.query("SELECT COUNT(*) as count FROM members WHERE DATE(joined) = CURDATE() AND status != 'Deleted'");

        res.json({
            total: totalRes[0].count,
            active: activeRes[0].count,
            expiring: expiringRes[0].count,
            newToday: todayRes[0].count
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch member stats" });
    }
};

// ROUTE 4: DELETE MEMBER
export const deleteMember = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT first_name, last_name, email, image FROM members WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Member not found" });
        
        const member = rows[0];

        await db.query("UPDATE payments SET status = 'Void' WHERE member_id = ?", [id]);
        await db.query("UPDATE members SET status = 'Deleted', email = CONCAT('del_', ?, '_', email) WHERE id = ?", [Date.now(), id]);

        await logActivity(`${member.first_name} ${member.last_name} was removed (Archived)`, 'delete', member.image);
        res.json({ message: "Member deleted successfully" });
    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ error: "Failed to delete member" });
    }
};

// ROUTE 5: EDIT MEMBER
export const updateMember = async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, dob, gender, email, contactNumber, address, emergencyContactName, emergencyContactPhone, role, image, recordPayment, paymentMethod } = req.body;

    try {
        let updateQuery = `UPDATE members SET first_name=?, last_name=?, dob=?, gender=?, email=?, contact_number=?, address=?, emergency_contact_name=?, emergency_contact_phone=?, role=?, image=?`;
        let params = [firstName, lastName, dob || null, gender || null, email, contactNumber, address || null, emergencyContactName || null, emergencyContactPhone || null, role, image];

        if (recordPayment) {
            const effectiveDate = new Date(); 
            const newEndDate = new Date(effectiveDate.getTime());
            const safeRole = role ? role.trim() : "Daily";
            let price = 50;

            if (safeRole === 'Half Month') { newEndDate.setDate(newEndDate.getDate() + 15); price = 300; } 
            else if (safeRole === 'Monthly') { newEndDate.setMonth(newEndDate.getMonth() + 1); price = 500; } 
            else { newEndDate.setDate(newEndDate.getDate() + 1); }

            const endSQL = getLocalMySQLDate(newEndDate);

            updateQuery += `, end_date=?, status='Active' WHERE id=?`;
            params.push(endSQL, id);

            await db.query(updateQuery, params);
            
            await db.query('INSERT INTO payments (member_id, amount, payment_method, payment_date, status) VALUES (?, ?, ?, NOW(), "Completed")', [id, price, paymentMethod || 'Cash']);
            await logActivity(`Renewed ${firstName} ${lastName}'s plan (${safeRole}) - Paid ₱${price}`, 'payment', image);
        } else {
            updateQuery += ` WHERE id=?`;
            params.push(id);
            await db.query(updateQuery, params);
            await logActivity(`Updated details for ${firstName} ${lastName}`, 'edit', image);
        }
        res.json({ message: "Member updated successfully" });
    } catch (err) {
        console.error("UPDATE ERROR:", err);
        res.status(500).json({ error: "Failed to update member" });
    }
};

// ROUTE 6: PROCESS GLOBAL QR SCANNER CHECK-IN
export const processQRCheckIn = async (req, res) => {
    const { qrData } = req.body;

    try {
        if (!qrData || !qrData.startsWith('GAMS-MBR-')) {
            return res.status(400).json({ error: "Invalid QR scan format structure." });
        }

        const uniqueId = qrData.replace('GAMS-MBR-', '');
        const [members] = await db.query(
            "SELECT id, first_name, last_name, status, image FROM members WHERE unique_id = ? AND status != 'Deleted'", 
            [uniqueId]
        );

        if (members.length === 0) {
            return res.status(404).json({ error: "No active gym profile matches this entry card." });
        }

        const member = members[0];
        if (member.status === 'Inactive') {
            return res.status(403).json({ error: `${member.first_name}'s membership tier package is currently expired.` });
        }

        await logActivity(`${member.first_name} ${member.last_name} checked in via QR scanner`, 'check-in', member.image);
        res.status(200).json({ success: true, memberName: `${member.first_name} ${member.last_name}` });
    } catch (error) {
        console.error("QR Check-In Processing Fault:", error);
        res.status(500).json({ error: "System failed checking in client credentials." });
    }
};

// ROUTE 7: ANALYTICS (Charts)
export const getAnalytics = async (req, res) => {
    try {
        const [roles] = await db.query(`
            SELECT role as name, COUNT(*) as value 
            FROM members 
            WHERE status != 'Deleted' 
            GROUP BY role
        `);

        const [trends] = await db.query(`
            SELECT DATE_FORMAT(joined, '%b') as name, COUNT(*) as members
            FROM members 
            WHERE joined >= DATE_SUB(NOW(), INTERVAL 6 MONTH) 
            AND status != 'Deleted'
            GROUP BY DATE_FORMAT(joined, '%Y-%m'), DATE_FORMAT(joined, '%b') 
            ORDER BY DATE_FORMAT(joined, '%Y-%m') ASC
        `);

        res.json({ roles, trends });
    } catch (err) {
        console.error("Analytics Error:", err);
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
};