import express from 'express';
import { createStudent, deleteStudent, getStudentById, getStudents, updateStudent, addPreference, getPreferences, updatePreference, deletePreference, reorderPreferences } from '../controllers/studentController.js';
import { requireAuth, requireAgentRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, requireAgentRole, createStudent);
router.get('/', requireAuth, getStudents);
router.get('/:studentId', requireAuth, getStudentById);
router.put('/:studentId', requireAuth, updateStudent);
router.delete('/:studentId', requireAuth, deleteStudent);

// University Preferences Routes
router.post('/:studentId/preferences', requireAuth, addPreference);
router.get('/:studentId/preferences', requireAuth, getPreferences);
router.put('/:studentId/preferences/reorder', requireAuth, reorderPreferences);
router.put('/:studentId/preferences/:preferenceId', requireAuth, updatePreference);
router.delete('/:studentId/preferences/:preferenceId', requireAuth, deletePreference);

export default router;