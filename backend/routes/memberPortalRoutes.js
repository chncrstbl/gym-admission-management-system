import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { getMemberProfile, getDynamicQRToken } from '../controllers/authController.js';
import {
    addMemberMeasurement,
    changeMemberPassword,
    getMemberPayments,
    getMemberProgress,
    getMemberSettings,
    getMemberVisits,
    renewMemberPlan,
    saveMemberProfile,
    saveMemberGoal,
    saveMemberSettings
} from '../controllers/memberPortalController.js';

const router = express.Router();

// Existing profile route
router.get('/profile', verifyToken, getMemberProfile);

// Add the dynamic QR token route
router.get('/portal/qr-token', verifyToken, getDynamicQRToken);

router.use('/portal', verifyToken);
router.get('/portal/payments', getMemberPayments);
router.post('/portal/membership/renew', renewMemberPlan);
router.get('/portal/visits', getMemberVisits);
router.get('/portal/progress', getMemberProgress);
router.post('/portal/progress/measurements', addMemberMeasurement);
router.put('/portal/progress/goals', saveMemberGoal);
router.get('/portal/settings', getMemberSettings);
router.put('/portal/settings', saveMemberSettings);
router.put('/portal/profile', saveMemberProfile);
router.put('/portal/password', changeMemberPassword);

export default router;