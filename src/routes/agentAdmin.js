import express from 'express';
import {
	createAgent,
	deleteAgent,
	getAgentById,
	getAgents,
	createUniversityRequest,
	getMyUniversityRequests,
	getMyUniversityRequestById,
	deleteMyUniversityRequest,
	updateAgent
} from '../controllers/agentController.js';
import { requireAuth, requireAgentManagementPermission, requireAgentRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, requireAgentRole, requireAgentManagementPermission('addAgent'), createAgent);
router.post('/universities', requireAuth, requireAgentRole, requireAgentManagementPermission('assignUni'), createUniversityRequest);
router.get('/universities', requireAuth, requireAgentRole, getMyUniversityRequests);
router.get('/universities/:requestId', requireAuth, requireAgentRole, getMyUniversityRequestById);
router.delete('/universities/:requestId', requireAuth, requireAgentRole, deleteMyUniversityRequest);
router.get('/', requireAuth, requireAgentRole, getAgents);
router.get('/:agentId', requireAuth, requireAgentRole, getAgentById);
router.put('/:agentId', requireAuth, requireAgentRole, requireAgentManagementPermission('editAgent'), updateAgent);
router.delete('/:agentId', requireAuth, requireAgentRole, requireAgentManagementPermission('removeAgent'), deleteAgent);

export default router;