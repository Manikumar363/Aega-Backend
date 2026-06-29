import express from 'express';
import { requireAuth, requireAdminRole } from '../middleware/auth.js';
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  addCriterion,
  updateCriterion,
  deleteCriterion
} from '../controllers/adminAuditController.js';
import {
  submitAuditCheck,
  getAuditChecks,
  getEntityAuditSummary,
  getAuditCheckById,
  getEntityComplianceSummary,
  getEntityComplianceStatus
} from '../controllers/auditCheckController.js';

const router = express.Router();

// GET routes (accessible by any authenticated user for reading audit details and compliance status)
router.get('/checks/list', requireAuth, getAuditChecks);
router.get('/checks/summary', requireAuth, getEntityAuditSummary);
router.get('/compliances/summary', requireAuth, getEntityComplianceSummary);
router.get('/compliances/status', requireAuth, getEntityComplianceStatus);
router.get('/checks/:checkId', requireAuth, getAuditCheckById);
router.get('/', requireAuth, getCategories);
router.get('/:auditId', requireAuth, getCategoryById);

// POST / PUT / DELETE modification routes (restricted to admins)
router.post('/checks/submit', requireAuth, requireAdminRole, submitAuditCheck);
router.post('/', requireAuth, requireAdminRole, createCategory);
router.put('/:auditId', requireAuth, requireAdminRole, updateCategory);
router.delete('/:auditId', requireAuth, requireAdminRole, deleteCategory);

// Criteria Management under Category
router.post('/:auditId/criteria', requireAuth, requireAdminRole, addCriterion);
router.put('/:auditId/criteria/:criterionId', requireAuth, requireAdminRole, updateCriterion);
router.delete('/:auditId/criteria/:criterionId', requireAuth, requireAdminRole, deleteCriterion);

export default router;
