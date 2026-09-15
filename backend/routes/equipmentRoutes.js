import express from 'express';
import { getEquipment, addEquipment, updateEquipment, deleteEquipment } from '../controllers/equipmentController.js';

const router = express.Router();

// Since index.js mounts this at '/api', we define the '/equipment' path here
router.get('/equipment', getEquipment);
router.post('/equipment', addEquipment);
router.put('/equipment/:id', updateEquipment);
router.delete('/equipment/:id', deleteEquipment);

export default router;