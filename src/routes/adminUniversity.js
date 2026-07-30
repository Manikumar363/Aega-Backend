import express from 'express';
import {
  adminListUniversities,
  adminGetUniversityById,
  adminAcceptUniversity,
  adminRejectUniversity,
  adminUpdateUniversity,
  deleteUniversity
} from '../controllers/universityController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, requireAdminRole, adminListUniversities);
router.get('/:universityId', requireAuth, requireAdminRole, adminGetUniversityById);
router.put('/:universityId/accept', requireAuth, requireAdminRole, adminAcceptUniversity);
router.put('/:universityId/reject', requireAuth, requireAdminRole, adminRejectUniversity);
router.put('/:universityId', requireAuth, requireAdminRole, adminUpdateUniversity);
router.delete('/:universityId', requireAuth, requireAdminRole, deleteUniversity);

export default router;
