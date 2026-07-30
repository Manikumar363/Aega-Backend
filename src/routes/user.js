import express from 'express';
import { getUsers, createUser, getMe, updateMe } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getUsers);
router.post('/', createUser);
router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, updateMe);

export default router;
