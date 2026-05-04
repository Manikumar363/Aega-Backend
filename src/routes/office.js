import express from 'express';
import { requireAuth, requireAgentRole } from '../middleware/auth.js';
import {
  createOffice,
  getOffices,
  getOfficeById,
  updateOffice,
  deleteOffice,
  addEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
} from '../controllers/officeController.js';

const router = express.Router();

// Offices
router.post('/', requireAuth, requireAgentRole, createOffice);
router.get('/', requireAuth, getOffices);
router.get('/:officeId', requireAuth, getOfficeById);
router.put('/:officeId', requireAuth, updateOffice);
router.delete('/:officeId', requireAuth, deleteOffice);

// Employees under office
router.post('/:officeId/employees', requireAuth, addEmployee);
router.get('/:officeId/employees', requireAuth, getEmployees);
router.get('/:officeId/employees/:employeeId', requireAuth, getEmployeeById);
router.put('/:officeId/employees/:employeeId', requireAuth, updateEmployee);
router.delete('/:officeId/employees/:employeeId', requireAuth, deleteEmployee);

export default router;
