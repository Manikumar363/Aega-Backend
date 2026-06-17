import express from 'express';
import {
  acceptUniversityRequest,
  createUniversityRequest,
  getMyUniversityRequests,
  getUniversityRequestsForUniversity,
  rejectUniversityRequest
} from '../controllers/agentController.js';
import { requireAuth, requireAgentRole, requireUniversityRole } from '../middleware/auth.js';

const router = express.Router();

// Agent submits a university assignment request
router.post('/', requireAuth, requireAgentRole, createUniversityRequest);

// Agent sees their own submitted requests
router.get('/me', requireAuth, requireAgentRole, getMyUniversityRequests);

// Agent submits a university assignment request

// University sees requests sent to them
router.get('/university', requireAuth, requireUniversityRole, getUniversityRequestsForUniversity);

// University accepts/rejects a request
router.put('/:requestId/accept', requireAuth, requireUniversityRole, acceptUniversityRequest);
router.put('/:requestId/reject', requireAuth, requireUniversityRole, rejectUniversityRequest);

export default router;
