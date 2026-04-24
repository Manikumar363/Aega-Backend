import express from 'express';
import { getMyAgentProfile, updateMyAgentProfile } from '../controllers/userController.js';
import { requireAuth, requireAgentRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', requireAuth, requireAgentRole, getMyAgentProfile);
router.put('/me', requireAuth, requireAgentRole, updateMyAgentProfile);

export default router;