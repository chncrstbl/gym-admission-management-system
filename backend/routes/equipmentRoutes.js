import express from 'express';
import { getEquipment, addEquipment, updateEquipment, deleteEquipment } from '../controllers/equipmentController.js';
import { verifyAdminToken, requireTrustedClientHeader } from '../middleware/authMiddleware.js';

const router = express.Router();

// Scope authorization to equipment routes. This router shares the /api mount
// with public login routes and member portal routes.
router.get('/equipment', verifyAdminToken, getEquipment);
router.post('/equipment', verifyAdminToken, requireTrustedClientHeader, addEquipment);
router.put('/equipment/:id', verifyAdminToken, requireTrustedClientHeader, updateEquipment);
router.delete('/equipment/:id', verifyAdminToken, requireTrustedClientHeader, deleteEquipment);

export default router;
