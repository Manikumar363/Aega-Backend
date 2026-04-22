import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import userRoutes from './routes/user.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import passwordRoutes from './routes/password.js';
import { createTestUser } from './controllers/userController.js';

dotenv.config();

const app = express();
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await createTestUser();
});
