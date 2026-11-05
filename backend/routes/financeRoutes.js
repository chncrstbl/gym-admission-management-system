import express from 'express';
import { getStats, getPayments, recordPayment, updatePaymentStatus, deletePayment, getRevenueReport } from '../controllers/financeController.js';
import { verifyAdminToken, requireTrustedClientHeader } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect each finance endpoint individually. This router is mounted at /api,
// so router.use(verifyAdminToken) would incorrectly intercept /login and other
// unrelated routes registered after this router.
router.get('/stats', verifyAdminToken, getStats);
router.get('/payments', verifyAdminToken, getPayments);
router.post('/payments', verifyAdminToken, requireTrustedClientHeader, recordPayment);
router.put('/payments/:id', verifyAdminToken, requireTrustedClientHeader, updatePaymentStatus);
router.delete('/payments/:id', verifyAdminToken, requireTrustedClientHeader, deletePayment);
router.get('/reports/revenue', verifyAdminToken, getRevenueReport);

export default router;
