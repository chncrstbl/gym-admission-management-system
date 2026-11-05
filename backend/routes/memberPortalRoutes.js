import express from 'express';
import { verifyToken, requireTrustedClientHeader } from '../middleware/authMiddleware.js';
import { getMemberProfile, getDynamicQRToken } from '../controllers/authController.js';
import {
    addMemberMeasurement,
    changeMemberPassword,
    getMemberPayments,
    getMemberProgress,
    getMemberSettings,
    getMemberVisits,
    checkOutMemberVisit,
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
router.post('/portal/membership/renew', requireTrustedClientHeader, renewMemberPlan);
router.get('/portal/visits', getMemberVisits);
router.post('/portal/visits/check-out', requireTrustedClientHeader, checkOutMemberVisit);
router.get('/portal/progress', getMemberProgress);
router.post('/portal/progress/measurements', requireTrustedClientHeader, addMemberMeasurement);
router.put('/portal/progress/goals', requireTrustedClientHeader, saveMemberGoal);
router.get('/portal/settings', getMemberSettings);
router.put('/portal/settings', requireTrustedClientHeader, saveMemberSettings);
router.put('/portal/profile', requireTrustedClientHeader, saveMemberProfile);
router.put('/portal/password', requireTrustedClientHeader, changeMemberPassword);

export default router;