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

// Require both auth and admin role for all endpoints in this router
router.use(requireAuth, requireAdminRole);

// Audit Check / Submission routes (placed before category paths to avoid parameter conflicts)
router.post('/checks/submit', submitAuditCheck);
router.get('/checks/list', getAuditChecks);
router.get('/checks/summary', getEntityAuditSummary);
router.get('/checks/:checkId', getAuditCheckById);
router.get('/compliances/summary', getEntityComplianceSummary);
router.get('/compliances/status', getEntityComplianceStatus);

// Category Management
router.post('/', createCategory);
router.get('/', getCategories);
router.get('/:auditId', getCategoryById);
router.put('/:auditId', updateCategory);
router.delete('/:auditId', deleteCategory);

// Criteria Management under Category
router.post('/:auditId/criteria', addCriterion);
router.put('/:auditId/criteria/:criterionId', updateCriterion);
router.delete('/:auditId/criteria/:criterionId', deleteCriterion);

export default router;
