import db from '../config/db.js';

// ROUTE 1: LOGIN
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM admins WHERE username = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: "User not found" });

        const admin = users[0];
        if (password === admin.password_hash) {
            await db.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);
            res.json({ success: true, message: "Login successful", user: { id: admin.id, username: admin.username } });
        } else {
            res.status(401).json({ error: "Invalid password" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server login error" });
    }
};