import express from 'express';
import { uploadPublicFile, uploadPublicFiles } from '../controllers/uploadController.js';
import { uploadSingleImage, uploadMultipleImages } from '../middleware/publicUpload.js';

const router = express.Router();

router.post('/public', uploadSingleImage, uploadPublicFile);
router.post('/public/multiple', uploadMultipleImages, uploadPublicFiles);

export default router;
