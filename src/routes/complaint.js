import express from 'express';
import {
  createComplaint,
  getComplaints,
  replyToComplaint,
  getTargetComplaints,
  raiseTargetComplaint,
  updateComplaintStatus,
  deleteComplaint
} from '../controllers/complaintController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/public', createComplaint);
router.get('/admin', requireAuth, requireAdminRole, getComplaints);
router.get('/admin/target', requireAuth, requireAdminRole, getTargetComplaints);
router.post('/admin/raise', requireAuth, requireAdminRole, raiseTargetComplaint);
router.post('/admin/:complaintId/reply', requireAuth, requireAdminRole, replyToComplaint);
router.put('/admin/:complaintId/status', requireAuth, requireAdminRole, updateComplaintStatus);
router.delete('/admin/:complaintId', requireAuth, requireAdminRole, deleteComplaint);

export default router;