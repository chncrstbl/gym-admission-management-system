import jwt from 'jsonwebtoken';
import process from 'node:process';
import db from '../config/db.js';

// The application validates JWT_SECRET at startup. Never use a known fallback secret.
const JWT_SECRET = process.env.JWT_SECRET;

const readToken = (req) =>
    req.cookies?.token ||
    req.cookies?.memberToken ||
    req.headers.authorization?.split(' ')[1];

const verifyJwt = (req, res) => {
    const token = readToken(req);
    if (!token) {
        res.status(401).json({ success: false, message: 'Access denied: no token provided.' });
        return null;
    }

    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        res.status(401).json({ success: false, message: 'Access denied: invalid or expired token.' });
        return null;
    }
};

export const verifyToken = async (req, res, next) => {
    const verified = verifyJwt(req, res);
    if (!verified) return;

    if ((verified.userType || verified.role) !== 'member') {
        return res.status(403).json({ success: false, message: 'Member portal access required.' });
    }

    try {
        // Re-check the database so deleted members cannot keep using a stale JWT.
        const [members] = await db.query(
            "SELECT id FROM members WHERE id = ? AND status != 'Deleted' LIMIT 1",
            [verified.id]
        );
        if (members.length === 0) {
            return res.status(401).json({ success: false, message: 'Member account is no longer available.' });
        }

        req.user = verified;
        return next();
    } catch (err) {
        console.error('Member authorization database check failed:', err);
        return res.status(503).json({ success: false, message: 'Authorization service is temporarily unavailable.' });
    }
};

export const verifyAdminToken = async (req, res, next) => {
    const verified = verifyJwt(req, res);
    if (!verified) return;

    // Staff accounts are explicitly supported by the login flow and use the
    // operational dashboard. Every other role is denied.
    if (!['admin', 'staff'].includes(verified.role)) {
        return res.status(403).json({ success: false, message: 'Administrative access required.' });
    }

    try {
        // A valid signed token is not enough if the account was deleted or demoted.
        const [users] = await db.query(
            'SELECT id, role FROM users WHERE id = ? LIMIT 1',
            [verified.id]
        );
        if (users.length === 0 || users[0].role !== verified.role) {
            return res.status(401).json({ success: false, message: 'Administrative account is no longer available.' });
        }

        req.user = verified;
        return next();
    } catch (err) {
        console.error('Admin authorization database check failed:', err);
        return res.status(503).json({ success: false, message: 'Authorization service is temporarily unavailable.' });
    }
};
