import express from 'express';
import {
  acceptLeaveRequest,
  createLeaveRequest,
  getMyLeaveRequests,
  getTeamLeaveRequests,
  rejectLeaveRequest
} from '../controllers/leaveController.js';
import { requireAuth, requireAgentRole, requireAgentOrAdminRole, requireCounsellorRole } from '../middleware/auth.js';

const router = express.Router();

// Counsellor submits leave request
router.post('/', requireAuth, requireCounsellorRole, createLeaveRequest);

// Counsellor views own requests
router.get('/me', requireAuth, requireCounsellorRole, getMyLeaveRequests);

// Parent agent / admin views all requests from their counsellors
router.get('/team', requireAuth, requireAgentOrAdminRole, getTeamLeaveRequests);

// Parent agent / admin reviews a request
router.put('/:leaveId/accept', requireAuth, requireAgentOrAdminRole, acceptLeaveRequest);
router.put('/:leaveId/reject', requireAuth, requireAgentOrAdminRole, rejectLeaveRequest);

export default router;
