import express from 'express'
import { login, getMemberProfile, getMemberDashboard, getDynamicQRToken } from '../controllers/authController.js'
import { verifyToken } from '../middleware/authMiddleware.js'
import { loginLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

router.post('/login', loginLimiter, login)

router.get('/portal/qr-token', verifyToken, getDynamicQRToken)

router.get('/portal/profile', verifyToken, getMemberProfile)
router.get('/portal/dashboard', verifyToken, getMemberDashboard)

export default router