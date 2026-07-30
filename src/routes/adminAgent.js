import express from 'express';
import { getAllAgentsForAdmin, getAgentByIdForAdmin, adminUpdateAgent, adminDeleteAgent } from '../controllers/agentController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, requireAdminRole, getAllAgentsForAdmin);
router.get('/:agentId', requireAuth, requireAdminRole, getAgentByIdForAdmin);
router.put('/:agentId', requireAuth, requireAdminRole, adminUpdateAgent);
router.delete('/:agentId', requireAuth, requireAdminRole, adminDeleteAgent);

export default router;