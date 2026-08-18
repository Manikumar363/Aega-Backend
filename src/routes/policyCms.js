import express from 'express';
import { getPolicyContent, updatePolicyContent } from '../controllers/policyCmsController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

// GET is public for marketing website
router.get('/', getPolicyContent);

// PUT is restricted to administrators
router.put('/', requireAuth, requireAdminRole, updatePolicyContent);

export default router;
