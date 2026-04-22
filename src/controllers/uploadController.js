import { v4 as uuidv4 } from 'uuid';
import {
  uploadToAntryk,
  sanitizeFileName,
  getMissingAntrykEnv,
  buildPublicUrl,
  formatUploadProviderError,
  antrykConfig
} from '../utils/antrykUpload.js';

export const uploadPublicFile = async (req, res) => {
  try {
    const missingEnv = getMissingAntrykEnv();
    if (missingEnv.length > 0) {
      return res.status(500).json({
        success: false,
        message: `Missing upload configuration: ${missingEnv.join(', ')}`
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const folder = req.body.folder || 'uploads';
    const key = `${folder}/${uuidv4()}_${sanitizeFileName(req.file.originalname)}`;

    const uploadResult = await uploadToAntryk(req.file, key);
    const publicUrl = buildPublicUrl(uploadResult.key);

    return res.status(200).json({
      success: true,
      files: [{ key: uploadResult.key, url: publicUrl }]
    });
  } catch (error) {
    const cfg = antrykConfig();
    const detailedMessage = formatUploadProviderError(error);
    console.error('Public upload error:', detailedMessage, {
      uploadUrl: cfg.uploadUrl,
      bucket: cfg.bucket
    });
    return res.status(500).json({
      success: false,
      message: detailedMessage,
      context: { uploadUrl: cfg.uploadUrl, bucket: cfg.bucket }
    });
  }
};

export const uploadPublicFiles = async (req, res) => {
  try {
    const missingEnv = getMissingAntrykEnv();
    if (missingEnv.length > 0) {
      return res.status(500).json({
        success: false,
        message: `Missing upload configuration: ${missingEnv.join(', ')}`
      });
    }

    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const folder = req.body.folder || 'uploads';
    const uploadResults = [];

    for (const file of files) {
      const key = `${folder}/${uuidv4()}_${sanitizeFileName(file.originalname)}`;
      const uploadResult = await uploadToAntryk(file, key);
      uploadResults.push({ key: uploadResult.key, url: buildPublicUrl(uploadResult.key) });
    }

    return res.status(200).json({ success: true, files: uploadResults });
  } catch (error) {
    const cfg = antrykConfig();
    const detailedMessage = formatUploadProviderError(error);
    console.error('Multiple upload error:', detailedMessage, {
      uploadUrl: cfg.uploadUrl,
      bucket: cfg.bucket
    });
    return res.status(500).json({
      success: false,
      message: detailedMessage,
      context: { uploadUrl: cfg.uploadUrl, bucket: cfg.bucket }
    });
  }
};
