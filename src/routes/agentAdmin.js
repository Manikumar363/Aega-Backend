import express from 'express';
import {
	createAgent,
	deleteAgent,
	getAgentById,
	getAgents,
	updateAgent
} from '../controllers/agentController.js';
import { requireAuth, requireAgentManagementPermission, requireAgentRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, requireAgentRole, requireAgentManagementPermission('addAgent'), createAgent);
router.get('/', requireAuth, requireAgentRole, getAgents);
router.get('/:agentId', requireAuth, requireAgentRole, getAgentById);
router.put('/:agentId', requireAuth, requireAgentRole, requireAgentManagementPermission('editAgent'), updateAgent);
router.delete('/:agentId', requireAuth, requireAgentRole, requireAgentManagementPermission('removeAgent'), deleteAgent);

export default router;