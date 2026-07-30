import express from 'express';
import { getTermsContent, updateTermsContent } from '../controllers/termsCmsController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getTermsContent);
router.put('/', requireAuth, requireAdminRole, updateTermsContent);

export default router;
