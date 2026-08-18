import express from 'express';
import { submitContactInquiry } from '../controllers/supportController.js';

const router = express.Router();

router.post('/contact', submitContactInquiry);

export default router;
