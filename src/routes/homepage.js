import express from 'express';
import { getHomepageContent, updateHomepageContent } from '../controllers/homepageController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

// GET is public for front-facing marketing pages
router.get('/', getHomepageContent);

// PUT is restricted to administrators
router.put('/', requireAuth, requireAdminRole, updateHomepageContent);

export default router;
