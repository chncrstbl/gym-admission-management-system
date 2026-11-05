import jwt from 'jsonwebtoken';
import process from 'node:process';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const verifyToken = (req, res, next) => {
    const token = req.cookies?.token || req.cookies?.memberToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Access Denied: No token provided." });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        if ((verified.userType || verified.role) !== 'member') {
            return res.status(403).json({ success: false, message: "Access Denied: Member portal only." });
        }
        req.user = verified;
        next();
    } catch {
        res.status(401).json({ success: false, message: "Access Denied: Invalid or expired token." });
    }
};

export const verifyAdminToken = (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access Denied: No token provided.' });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        // Staff accounts are explicitly supported by the login flow and use the
        // same operational dashboard. Reject missing/unknown roles by default.
        if (!['admin', 'staff'].includes(verified.role)) {
            return res.status(403).json({ success: false, message: 'Administrative access required.' });
        }
        req.user = verified;
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Access Denied: Invalid or expired token.' });
    }
};