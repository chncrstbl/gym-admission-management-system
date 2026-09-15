import express from 'express';
import { getMembers, addMember, getMemberStats, deleteMember, updateMember, getAnalytics, processQRCheckIn } from '../controllers/memberController.js';

const router = express.Router();

router.get('/members', getMembers);
router.post('/members', addMember);
router.get('/member-stats', getMemberStats);
router.delete('/members/:id', deleteMember);
router.put('/members/:id', updateMember);
router.get('/analytics', getAnalytics);

router.post('/checkin/qr', processQRCheckIn);

export default router;