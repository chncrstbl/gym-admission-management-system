import db from '../config/db.js';

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

