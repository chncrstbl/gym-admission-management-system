import express from 'express';
import { createAnnouncement, getAnnouncements } from '../controllers/announcementController.js';
import { verifyAdminToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/announcements', verifyAdminToken, getAnnouncements);
router.post('/announcements', verifyAdminToken, createAnnouncement);

export default router;