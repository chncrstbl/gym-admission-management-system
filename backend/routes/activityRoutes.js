import express from 'express';
import { getActivity, checkInMember } from '../controllers/activityController.js';

const router = express.Router();

router.get('/activity', getActivity);
router.post('/checkin', checkInMember);

export default router;