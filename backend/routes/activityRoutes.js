import express from 'express';
import { getActivity } from '../controllers/activityController.js';
import { verifyAdminToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Scope authorization to this endpoint because the router is mounted at /api.
// A router-wide guard here would reject unrelated routes such as /login.
router.get('/activity', verifyAdminToken, getActivity);

export default router;
