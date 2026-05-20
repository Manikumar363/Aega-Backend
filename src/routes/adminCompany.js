import express from 'express';
import { getCompanies, getCompanyByIdForAdmin } from '../controllers/companyController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, requireAdminRole, getCompanies);
router.get('/:companyId', requireAuth, requireAdminRole, getCompanyByIdForAdmin);

export default router;