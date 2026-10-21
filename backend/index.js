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

app.disable('x-powered-by')
app.use(helmet())

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use(express.json())
app.use(cookieParser())

app.set('trust proxy', 1)

app.use('/api/login', globalApiLimiter)

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))


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