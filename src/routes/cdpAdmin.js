import express from 'express';
import {
  createCdpCourse,
  deleteCdpCourse,
  getCdpCourseById,
  getCdpCourses,
  updateCdpCourse
} from '../controllers/cdpController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, requireAdminRole, getCdpCourses);
router.post('/', requireAuth, requireAdminRole, createCdpCourse);
router.get('/:courseId', requireAuth, requireAdminRole, getCdpCourseById);
router.put('/:courseId', requireAuth, requireAdminRole, updateCdpCourse);
router.delete('/:courseId', requireAuth, requireAdminRole, deleteCdpCourse);

export default router;