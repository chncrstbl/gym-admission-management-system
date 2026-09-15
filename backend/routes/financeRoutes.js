import express from 'express';
import { getStats, getPayments, recordPayment, updatePaymentStatus, deletePayment, getRevenueReport } from '../controllers/financeController.js';

const router = express.Router();

router.get('/stats', getStats);
router.get('/payments', getPayments);
router.post('/payments', recordPayment);
router.put('/payments/:id', updatePaymentStatus);
router.delete('/payments/:id', deletePayment);
router.get('/reports/revenue', getRevenueReport);

export default router;