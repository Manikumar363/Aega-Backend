import express from 'express';
import { getUniversityContent, updateUniversityContent } from '../controllers/universityCmsController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

// GET is public
router.get('/', getUniversityContent);

// PUT is restricted to administrators
router.put('/', requireAuth, requireAdminRole, updateUniversityContent);

export default router;
