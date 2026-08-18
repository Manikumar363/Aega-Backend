import express from 'express';
import { getCategories, getCategoryById } from '../controllers/adminAuditController.js';

const router = express.Router();

// GET is public
router.get('/', getCategories);
router.get('/:id', getCategoryById);

export default router;
