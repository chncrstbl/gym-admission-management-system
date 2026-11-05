import express from 'express';
import { getActivity, checkInMember } from '../controllers/activityController.js';
import { verifyAdminToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// These routes mutate or disclose operational data and must never be public.
router.use(verifyAdminToken);

router.get('/activity', getActivity);
router.post('/checkin', checkInMember);

export default router;