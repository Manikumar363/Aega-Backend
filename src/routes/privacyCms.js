import express from 'express';
import { getPrivacyContent, updatePrivacyContent } from '../controllers/privacyCmsController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPrivacyContent);
router.put('/', requireAuth, requireAdminRole, updatePrivacyContent);

export default router;
