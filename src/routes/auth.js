import express from 'express';
import { loginUser, loginAdmin, signupUser } from '../controllers/userController.js';

const router = express.Router();

router.post('/signup', signupUser);
router.post('/login', loginUser);
router.post('/admin/login', loginAdmin);

export default router;