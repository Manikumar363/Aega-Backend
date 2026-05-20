import express from 'express';
import { getStudents, getStudentById } from '../controllers/studentController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, requireAdminRole, getStudents);
router.get('/:studentId', requireAuth, requireAdminRole, getStudentById);

export default router;