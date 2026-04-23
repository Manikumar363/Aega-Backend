import express from 'express';
import { getCdpCourses } from '../controllers/cdpController.js';
import { requireAuth, requireAgentRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, requireAgentRole, getCdpCourses);

export default router;
