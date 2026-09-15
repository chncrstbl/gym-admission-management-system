import db from '../config/db.js';
import { logActivity } from '../utils/helpers.js';

// ROUTE 1: GET ACTIVITY
export const getActivity = async (req, res) => {
    try {
        const limit = req.query.limit;
        let query = 'SELECT * FROM activity_logs ORDER BY time DESC';
        if (limit !== 'all') query += ' LIMIT 5';

        const [rows] = await db.query(query);
        const activity = rows.map(log => ({
            id: log.id,
            name: log.description, 
            action: log.action_type, 
            time: log.time,
            image: log.image
        }));
        res.json(activity);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch activity" });
    }
};

// ROUTE 2: CHECK IN
export const checkInMember = async (req, res) => {
    const { memberId, memberName, memberImage } = req.body;
    if (!req.body || !memberId) return res.status(400).json({ error: "Missing member data" });

    try {
        await logActivity(`${memberName} checked in at the gym`, 'check-in', memberImage);
        res.json({ success: true, message: "Check-in recorded" });
    } catch (err) {
        console.error("Check-in Error:", err);
        res.status(500).json({ error: "Failed to process check-in" });
    }
};