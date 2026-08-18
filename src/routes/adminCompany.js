import express from 'express';
import { getCompanies, getCompanyByIdForAdmin, adminUpdateCompany, adminDeleteCompany, adminCreateCompany } from '../controllers/companyController.js';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, requireAdminRole, getCompanies);
router.post('/', requireAuth, requireAdminRole, adminCreateCompany);
router.get('/:companyId', requireAuth, requireAdminRole, getCompanyByIdForAdmin);
router.put('/:companyId', requireAuth, requireAdminRole, adminUpdateCompany);
router.delete('/:companyId', requireAuth, requireAdminRole, adminDeleteCompany);

export default router;