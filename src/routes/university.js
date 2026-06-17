import express from 'express';
import { requireAuth, requireAdminRole, requireUniversityRole } from '../middleware/auth.js';
import {
  listUniversities,
  getUniversityById,
  createUniversity,
  updateUniversity,
  getMyUniversity
} from '../controllers/universityController.js';

const router = express.Router();

// Public: List all active universities (for dropdown when adding student preferences)
router.get('/', listUniversities);

// Auth: University self-service - get my profile
router.get('/me/profile', requireAuth, requireUniversityRole, getMyUniversity);

// Auth: University self-service - create my profile (first time setup)
router.post('/me/profile', requireAuth, requireUniversityRole, createUniversity);

// Auth: Get specific university details
router.get('/:universityId', getUniversityById);

// Auth: University self-service - update my profile
router.put('/:universityId', requireAuth, updateUniversity);

export default router;
