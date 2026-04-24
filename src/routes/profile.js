import express from 'express';
import { changeMyPassword, getMyAgentProfile, updateMyAgentProfile } from '../controllers/userController.js';
import { requireAuth, requireAgentRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', requireAuth, requireAgentRole, getMyAgentProfile);
router.put('/me', requireAuth, requireAgentRole, updateMyAgentProfile);
router.get('/me/:userId', requireAuth, requireAgentRole, getMyAgentProfile);
router.put('/me/:userId', requireAuth, requireAgentRole, updateMyAgentProfile);
router.put('/reset-password', requireAuth, requireAgentRole, changeMyPassword);

export default router;