import express from 'express';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';
import { getAdminDashboardStats, searchEverything } from '../controllers/adminDashboardController.js';

const router = express.Router();

router.get('/stats', requireAuth, getAdminDashboardStats);
router.get('/search', requireAuth, searchEverything);

export default router;
