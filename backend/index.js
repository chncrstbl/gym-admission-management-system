import express from 'express';
import process from 'node:process';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import memberRoutes from './routes/memberRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import authRoutes from './routes/authRoutes.js';
import memberPortalRoutes from './routes/memberPortalRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';

dotenv.config();

const app = express();

const allowedOrigins = [
    'http://localhost:5173',
    'https://gym-admission-management-system.vercel.app'
]

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
}));

app.use(express.json());
app.use(cookieParser());

app.set('trust proxy', 1);

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    message: { success: false, message: 'Too many login attempts from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV !== 'production',
});

app.use('/api/login', loginLimiter);

// Routes
app.use('/api', memberRoutes);
app.use('/api', financeRoutes);
app.use('/api', activityRoutes);
app.use('/api', equipmentRoutes);
app.use('/api', authRoutes); 
app.use('/api', memberPortalRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});