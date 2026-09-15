import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const getLocalMySQLDate = (dateObj) => {
    const offset = dateObj.getTimezoneOffset() * 60000;
    const localDate = new Date(dateObj.getTime() - offset);
    return localDate.toISOString().slice(0, 19).replace('T', ' ');
};

    //ROUTE 1: GET MEMBERS
app.get('/api/members', async (req, res) => {
    try {
        await db.query(`UPDATE members SET status = 'Expired' WHERE end_date < NOW() AND status = 'Active'`);
        
        const [rows] = await db.query('SELECT * FROM members ORDER BY joined DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

    //ROUTE 2: ADD MEMBER
app.post('/api/members', async (req, res) => {
    const { name, email, role, image } = req.body;
    console.log("Received Role:", role); 

    const joined = new Date();
    const endDate = new Date(joined.getTime()); 
    
    const safeRole = role ? role.trim() : "Daily";

    switch (safeRole) {
        case 'Daily':
            endDate.setDate(endDate.getDate() + 1);
            break;
        case 'Half Month':
            endDate.setDate(endDate.getDate() + 15);
            break;
        case 'Monthly':
            endDate.setMonth(endDate.getMonth() + 1); 
            break;
        default:
            endDate.setDate(endDate.getDate() + 1);
            break;
    }

    const status = 'Active';

    try {
        const joinedSQL = getLocalMySQLDate(joined);
        const endSQL = getLocalMySQLDate(endDate);

        const query = 'INSERT INTO members (name, email, role, status, joined, end_date, image) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const [result] = await db.query(query, [name, email, role, status, joinedSQL, endSQL, image]);
        
        res.status(201).json({ id: result.insertId, message: "Member added" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add member" });
    }
});

    //ROUTE 3: STATS
app.get('/api/stats', async (req, res) => {
    try {
        const [totalRes] = await db.query('SELECT COUNT(*) as count FROM members');
        const [activeRes] = await db.query("SELECT COUNT(*) as count FROM members WHERE status = 'Active'");
        const [expiringRes] = await db.query("SELECT COUNT(*) as count FROM members WHERE end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)");

        const stats = [
            { 
                title: "Total Members", 
                value: totalRes[0].count, 
                icon_name: "Users", 
                trend: "Total registered", 
                trend_color: "text-blue-500" 
            },
            { 
                title: "Active Members", 
                value: activeRes[0].count, 
                icon_name: "CheckCircle", 
                trend: "Currently active", 
                trend_color: "text-green-500" 
            },
            { 
                title: "Expiring Soon", 
                value: expiringRes[0].count, 
                icon_name: "AlertTriangle", 
                trend: "Next 7 Days", 
                trend_color: "text-red-500" 
            },
            { 
                title: "Daily Visitors", 
                value: "12", 
                icon_name: "Activity", 
                trend: "+2 today", 
                trend_color: "text-orange-500" 
            }
        ];

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

    //ROUTE 4: RECENT ACTIVITY
app.get('/api/activity', async (req, res) => {
        try {
            const [rows] = await db.query('SELECT name, joined, image FROM members ORDER BY joined DESC LIMIT 5');
            
            const activity = rows.map(member => ({
                id: member.id,
                name: member.name,
                action: "registered as a new member",
                time: member.joined,
                image: member.image,
                initials: member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            }));

            res.json(activity);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to fetch activity" });
        }
});

app.listen(5000, () => console.log('Unified Admin Server running on port 5000'));