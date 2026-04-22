import express from 'express';
import { requestPasswordReset, verifyOtp, resetPassword } from '../controllers/passwordController.js';

const router = express.Router();

router.post('/request-reset', requestPasswordReset);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

export default router;
