import express from 'express';
import { getMembers, addMember, getMemberStats, deleteMember, updateMember, getAnalytics, processQRCheckIn, getMemberQRPass } from '../controllers/memberController.js';
import { createMemberLimiter } from '../middleware/rateLimiter.js';
import { verifyAdminToken, requireTrustedClientHeader } from '../middleware/authMiddleware.js';
import { checkInLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// These routes mutate or disclose operational data and must never be public.
router.use(verifyAdminToken);

router.get('/', getMembers);
router.post('/', requireTrustedClientHeader, createMemberLimiter, addMember);
router.put('/:id', requireTrustedClientHeader, updateMember);
router.delete('/:id', requireTrustedClientHeader, deleteMember);

router.get('/analytics', getAnalytics);
router.get('/stats', getMemberStats);
router.get('/:id/qr-pass', getMemberQRPass);
router.post('/check-in', requireTrustedClientHeader, checkInLimiter, processQRCheckIn);

export default router;