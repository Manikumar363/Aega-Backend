import express from 'express';
import { createComplaint, getComplaints } from '../controllers/complaintController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/public', createComplaint);
router.get('/admin', requireAuth, requireAdminRole, getComplaints);

export default router;