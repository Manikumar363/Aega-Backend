import express from 'express';
import { requireAuth, requireAdminRole, requireUniversityRole } from '../middleware/auth.js';
import {
  listUniversities,
  getUniversityById,
  createUniversity,
  updateUniversity,
  getMyUniversity,
  getUniversityDashboardStats,
  getUniversityAgents,
  addUniversityAgent,
  deleteUniversityAgent
} from '../controllers/universityController.js';
import { deleteMyAccount } from '../controllers/userController.js';

const router = express.Router();

// Public: List all active universities (for dropdown when adding student preferences)
router.get('/', listUniversities);

// Auth: University self-service - get my dashboard stats
router.get('/me/dashboard-stats', requireAuth, requireUniversityRole, getUniversityDashboardStats);

// Auth: University self-service - get my agents list
router.get('/me/agents', requireAuth, requireUniversityRole, getUniversityAgents);

// Auth: University self-service - add a new agent
router.post('/me/agents', requireAuth, requireUniversityRole, addUniversityAgent);

// Auth: University self-service - delete an agent
router.delete('/me/agents/:agentId', requireAuth, requireUniversityRole, deleteUniversityAgent);

// Auth: University self-service - get my profile
router.get('/me/profile', requireAuth, requireUniversityRole, getMyUniversity);

// Auth: University self-service - create my profile (first time setup)
router.post('/me/profile', requireAuth, requireUniversityRole, createUniversity);

// Auth: Get specific university details
router.get('/:universityId', getUniversityById);

// Auth: University self-service - update my profile
router.put('/:universityId', requireAuth, updateUniversity);

// Auth: University self-service - delete my account
router.delete('/me', requireAuth, requireUniversityRole, deleteMyAccount);

export default router;
