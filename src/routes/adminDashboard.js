import express from 'express';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';
import { getAdminDashboardStats } from '../controllers/adminDashboardController.js';

const router = express.Router();

router.get('/stats', requireAuth, requireAdminRole, getAdminDashboardStats);

export default router;
