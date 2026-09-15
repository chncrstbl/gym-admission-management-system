import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes Import
import memberRoutes from './routes/memberRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import authRoutes from './routes/authRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', memberRoutes);
app.use('/api', financeRoutes);
app.use('/api', activityRoutes);
app.use('/api', equipmentRoutes);
app.use('/api', authRoutes); 

const PORT = process.env.PORT || 5000; app.listen(PORT);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});