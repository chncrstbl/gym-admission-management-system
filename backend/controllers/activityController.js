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
    // Resolve the member's name and image from the database instead of trusting
    // optional client fields that may be missing (and produce "undefined member").
    const { memberId } = req.body || {};
    if (!memberId) {
        return res.status(400).json({ error: "Missing member ID" });
    }

    try {
        const [rows] = await db.query(
            "SELECT id, first_name, last_name, status, image FROM members WHERE id = ? AND status != 'Deleted' LIMIT 1",
            [memberId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Member not found" });
        }

        const member = rows[0];
        if (member.status === 'Inactive') {
            return res.status(403).json({ error: "This membership is inactive" });
        }

        const memberName = `${member.first_name || ''} ${member.last_name || ''}`.trim();
        if (!memberName) {
            return res.status(422).json({ error: "Member name is unavailable" });
        }

        await logActivity(`${memberName} checked in at the gym`, 'check-in', member.image);
        return res.json({
            success: true,
            message: "Check-in recorded",
            memberName
        });
    } catch (err) {
        console.error("Check-in Error:", err);
        return res.status(500).json({ error: "Failed to process check-in" });
    }
};