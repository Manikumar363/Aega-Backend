import express from 'express';
import {
  createCdpCourse,
  deleteCdpCourse,
  getCdpCourseById,
  getCdpCourses,
  updateCdpCourse
} from '../controllers/cdpController.js';
import { getTargetUserEnrolledCourses } from '../controllers/courseEnrollmentController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, getCdpCourses);
router.post('/', requireAuth, requireAdminRole, createCdpCourse);
router.get('/enrolled', requireAuth, getTargetUserEnrolledCourses);
router.get('/:courseId', requireAuth, getCdpCourseById);
router.put('/:courseId', requireAuth, requireAdminRole, updateCdpCourse);
router.delete('/:courseId', requireAuth, requireAdminRole, deleteCdpCourse);

export default router;