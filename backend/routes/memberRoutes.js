import express from 'express';
import { getMembers, addMember, getMemberStats, deleteMember, updateMember, getAnalytics, processQRCheckIn } from '../controllers/memberController.js';
import { createMemberLimiter } from '../middleware/rateLimiter.js';
import { verifyAdminToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// These routes mutate or disclose operational data and must never be public.
router.use(verifyAdminToken);

router.get('/', getMembers);
router.post('/', createMemberLimiter, addMember);
router.put('/:id', updateMember);
router.delete('/:id', deleteMember);

router.get('/analytics', getAnalytics);
router.get('/stats', getMemberStats);
router.post('/check-in', processQRCheckIn);

export default router;