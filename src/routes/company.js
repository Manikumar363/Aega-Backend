import express from 'express';
import {
	createCompany,
	getCompanies,
	getCompanyOverview,
	updateCompanyPerformance
} from '../controllers/companyController.js';
import { requireAuth, requireAgentRole, requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, requireAgentRole, createCompany);
router.get('/', requireAuth, getCompanies);
router.get('/:companyId/overview', requireAuth, getCompanyOverview);
router.put('/:companyId/performance', requireAuth, requireAdminRole, updateCompanyPerformance);

export default router;