import express from 'express'
import helmet from 'helmet'
import process from 'node:process'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import { globalApiLimiter } from './middleware/rateLimiter.js'
import { initCronJobs } from './jobs/cronJobs.js'

import memberRoutes from './routes/memberRoutes.js'
import financeRoutes from './routes/financeRoutes.js'
import activityRoutes from './routes/activityRoutes.js'
import authRoutes from './routes/authRoutes.js'
import memberPortalRoutes from './routes/memberPortalRoutes.js'
import equipmentRoutes from './routes/equipmentRoutes.js'
import announcementRoutes from './routes/announcementRoutes.js'
import { getAnalytics, getMemberStats } from './controllers/memberController.js'

dotenv.config()

const app = express()

const allowedOrigins = [
    'http://localhost:5173',
    'https://gym-admission-management-system.vercel.app'
]

// Handle CORS before other middleware so OPTIONS preflight responses include
// the required headers even when the requested API route returns an error.
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
}

app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))

app.disable('x-powered-by')
app.use(helmet())

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

app.set('trust proxy', 1)

app.use('/api/login', globalApiLimiter)


// Lightweight endpoint to verify that the deployed API service is responding.
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'gym-admission-management-system-api'
    })
})

// Routes
app.use('/api/members', memberRoutes)
app.use('/api/member-stats', getMemberStats)
app.use('/api/analytics', getAnalytics)
app.use('/api', financeRoutes)
app.use('/api', activityRoutes)
app.use('/api', equipmentRoutes)
app.use('/api', authRoutes)
app.use('/api', memberPortalRoutes)
app.use('/api', announcementRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    initCronJobs()
});