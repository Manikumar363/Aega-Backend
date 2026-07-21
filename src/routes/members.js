import express from 'express';
import { getMembersContent, updateMembersContent } from '../controllers/membersController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

// GET is public
router.get('/', getMembersContent);

// PUT is restricted to administrators
router.put('/', requireAuth, requireAdminRole, updateMembersContent);

export default router;
