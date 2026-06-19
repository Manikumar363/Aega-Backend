import express from 'express';
import {
  createComplaint,
  getComplaints,
  replyToComplaint,
  getTargetComplaints,
  raiseTargetComplaint
} from '../controllers/complaintController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/public', createComplaint);
router.get('/admin', requireAuth, requireAdminRole, getComplaints);
router.get('/admin/target', requireAuth, requireAdminRole, getTargetComplaints);
router.post('/admin/raise', requireAuth, requireAdminRole, raiseTargetComplaint);
router.post('/admin/:complaintId/reply', requireAuth, requireAdminRole, replyToComplaint);

export default router;