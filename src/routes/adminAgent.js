import express from 'express';
import { getAllAgentsForAdmin, getAgentByIdForAdmin } from '../controllers/agentController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, requireAdminRole, getAllAgentsForAdmin);
router.get('/:agentId', requireAuth, requireAdminRole, getAgentByIdForAdmin);

export default router;