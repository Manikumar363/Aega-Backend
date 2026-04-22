import fs from 'fs';
import path from 'path';
import multer from 'multer';

const uploadDir = path.resolve('uploads', 'signups');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const safeOriginal = file.originalname.replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${safeOriginal}`);
  }
});

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
]);

const fileFilter = (_, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new Error('Only PDF, JPG, and PNG files are allowed.'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

export const signupUpload = upload.fields([
  { name: 'supportingDocument1', maxCount: 1 },
  { name: 'supportingDocument2', maxCount: 1 }
]);

export const signupUploadAny = upload.any();
