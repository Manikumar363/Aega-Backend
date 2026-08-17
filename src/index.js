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
import leaveRoutes from './routes/leave.js';
import adminAgentRoutes from './routes/adminAgent.js';
import adminCompanyRoutes from './routes/adminCompany.js';
import adminStudentRoutes from './routes/adminStudent.js';
import adminUniversityRoutes from './routes/adminUniversity.js';
import universityRequestRoutes from './routes/universityRequest.js';
import adminAuditRoutes from './routes/adminAudit.js';
import adminDashboardRoutes from './routes/adminDashboard.js';
import homepageRoutes from './routes/homepage.js';
import aboutRoutes from './routes/about.js';
import membersRoutes from './routes/members.js';
import universityCmsRoutes from './routes/universityCms.js';
import publicCmsRoutes from './routes/publicCms.js';
import publicCompliancesRoutes from './routes/publicCompliances.js';
import privacyRoutes from './routes/privacyCms.js';
import termsRoutes from './routes/termsCms.js';
import subscriptionRoutes from './routes/subscription.js';
import flywireRoutes from './routes/flywire.js';
import stripeRoutes from './routes/stripe.js';
import { createAdminUser, createTestUser } from './controllers/userController.js';

dotenv.config();

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4000,http://localhost:3000, http://localhost:5173')
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

// Request/Response logging middleware for agent-management to debug score mismatches
app.use((req, res, next) => {
  if (req.path === '/api/agent-management' || req.path === '/api/admin/agent-management') {
    const originalJson = res.json;
    res.json = function (body) {
      console.log(`[LOGGER] Response for ${req.method} ${req.path}:`, JSON.stringify(body, null, 2));
      return originalJson.apply(this, arguments);
    };
  }
  next();
});

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
app.use('/api/admin/agent-management', adminAgentRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin/students', adminStudentRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/offices', officeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/admin/companies', adminCompanyRoutes);
app.use('/api/admin/universities', adminUniversityRoutes);
app.use('/api/university-requests', universityRequestRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/audits', adminAuditRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/university-cms', universityCmsRoutes);
app.use('/api/public-cms', publicCmsRoutes);
app.use('/api/public-compliances', publicCompliancesRoutes);
app.use('/api/privacy-cms', privacyRoutes);
app.use('/api/terms-cms', termsRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/flywire', flywireRoutes);
app.use('/api/stripe', stripeRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await createTestUser();
  await createAdminUser();
});
