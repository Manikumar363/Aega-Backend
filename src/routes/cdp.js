import express from 'express';
import { getCdpCourses } from '../controllers/cdpController.js';
import {
  enrollCourse,
  getMyEnrolledCourses,
  getCourseProgress,
  updateCourseProgress,
  getCourseProgressStats
} from '../controllers/courseEnrollmentController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// List all available courses (public for authenticated users)
router.get('/', requireAuth, getCdpCourses);

// Enroll in a course
router.post('/:courseId/enroll', requireAuth, enrollCourse);

// Get all enrolled courses for authenticated user
router.get('/me/enrolled', requireAuth, getMyEnrolledCourses);

// Get course progress statistics
router.get('/me/stats', requireAuth, getCourseProgressStats);

// Get specific course progress
router.get('/progress/:progressId', requireAuth, getCourseProgress);

// Update course progress with certificate
router.put('/progress/:progressId', requireAuth, updateCourseProgress);

export default router;
