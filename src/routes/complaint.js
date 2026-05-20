import express from 'express';
import { createComplaint, getComplaints, replyToComplaint } from '../controllers/complaintController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/public', createComplaint);
router.get('/admin', requireAuth, requireAdminRole, getComplaints);
router.post('/admin/:complaintId/reply', requireAuth, requireAdminRole, replyToComplaint);

export default router;