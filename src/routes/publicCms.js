import express from 'express';
import { getPublicContent, updatePublicContent } from '../controllers/publicCmsController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

// GET is public
router.get('/', getPublicContent);

// PUT is restricted to administrators
router.put('/', requireAuth, requireAdminRole, updatePublicContent);

export default router;
