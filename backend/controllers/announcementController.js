import db from '../config/db.js';

export const getAnnouncements = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, title, content, category, created_at FROM announcements ORDER BY created_at DESC LIMIT 20'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Fetch announcements error:', err);
        res.status(500).json({ success: false, message: 'Could not load announcements.' });
    }
};

export const createAnnouncement = async (req, res) => {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    const category = typeof req.body.category === 'string' ? req.body.category.trim() : '';

    if (!title || !content) {
        return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }
    if (title.length > 255 || category.length > 100) {
        return res.status(400).json({ success: false, message: 'Announcement text is too long.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO announcements (title, content, category) VALUES (?, ?, ?)',
            [title, content, category || null]
        );
        const [rows] = await db.query(
            'SELECT id, title, content, category, created_at FROM announcements WHERE id = ?',
            [result.insertId]
        );
        res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Create announcement error:', err);
        res.status(500).json({ success: false, message: 'Could not create announcement.' });
    }
};