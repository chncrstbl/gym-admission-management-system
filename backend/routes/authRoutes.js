import express from 'express';
import { login, getMemberProfile, getMemberDashboard } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/portal/profile', verifyToken, getMemberProfile);
router.get('/portal/dashboard', verifyToken, getMemberDashboard);

export default router;