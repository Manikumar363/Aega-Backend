import multer from 'multer';

const allowedMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error('Only JPG, JPEG, PNG, WEBP, and PDF files are allowed.'));
    }
    cb(null, true);
  }
});

const handleMulterError = (err, res) => {
  if (!err) return false;
  return res.status(400).json({ success: false, message: err.message || 'File upload failed.' });
};

export const uploadSingleImage = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (handleMulterError(err, res)) return;
    next();
  });
};

export const uploadMultipleImages = (req, res, next) => {
  upload.array('files', 10)(req, res, (err) => {
    if (handleMulterError(err, res)) return;
    next();
  });
};
