import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import userRoutes from './routes/user.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import passwordRoutes from './routes/password.js';
import profileRoutes from './routes/profile.js';
import companyRoutes from './routes/company.js';
import cdpRoutes from './routes/cdp.js';
import cdpAdminRoutes from './routes/cdpAdmin.js';
import agentAdminRoutes from './routes/agentAdmin.js';
import complaintRoutes from './routes/complaint.js';
import studentRoutes from './routes/student.js';
import universityRoutes from './routes/university.js';
import officeRoutes from './routes/office.js';
import { createAdminUser, createTestUser } from './controllers/userController.js';

dotenv.config();

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4000,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Optional fallback for common hosted frontends when CORS_ORIGINS is not set yet.
  if (origin.endsWith('.onrender.com') || origin.endsWith('.vercel.app')) {
    return true;
  }

  return false;
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.resolve('uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aega', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/cdp-courses', cdpRoutes);
app.use('/api/admin/cdp-courses', cdpAdminRoutes);
app.use('/api/agent-management', agentAdminRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/offices', officeRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await createTestUser();
  await createAdminUser();
});
