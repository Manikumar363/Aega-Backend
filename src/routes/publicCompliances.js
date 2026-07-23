import express from 'express';
import { getCategories } from '../controllers/adminAuditController.js';

const router = express.Router();

// GET is public
router.get('/', getCategories);

export default router;
