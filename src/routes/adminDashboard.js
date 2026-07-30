import express from 'express';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';
import { getAdminDashboardStats, searchEverything } from '../controllers/adminDashboardController.js';

const router = express.Router();

router.get('/stats', requireAuth, requireAdminRole, getAdminDashboardStats);
router.get('/search', requireAuth, requireAdminRole, searchEverything);

export default router;
