const path = require('path');
const multer = require('multer');
const fs = require('fs');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

module.exports = function createUploaders(uploadRoot) {
  ensureDir(uploadRoot);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadRoot),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.bin';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    }
  });

  const imageFilter = (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads allowed'));
    }
    cb(null, true);
  };

  const uploadEnrollment = multer({
    storage,
    fileFilter: imageFilter,
    limits: { fileSize: 8 * 1024 * 1024 }
  }).single('screenshot');

  const uploadInternApply = multer();

  return { uploadEnrollment, uploadInternApply };
};
