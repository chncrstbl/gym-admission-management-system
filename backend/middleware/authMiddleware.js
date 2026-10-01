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
        if (verified.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required.' });
        }
        req.user = verified;
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Access Denied: Invalid or expired token.' });
    }
};