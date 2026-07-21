import express from 'express';
import { getAboutContent, updateAboutContent } from '../controllers/aboutController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

// GET is public for front-facing marketing pages
router.get('/', getAboutContent);

// PUT is restricted to administrators
router.put('/', requireAuth, requireAdminRole, updateAboutContent);

export default router;
