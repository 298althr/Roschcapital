import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const ensureUploadDir = (userId) => {
  const uploadDir = path.join(process.cwd(), 'uploads', 'profiles', userId);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.userId || 'temp';
    const uploadDir = ensureUploadDir(userId);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF) are allowed'));
  }
};

// Create multer upload instance
export const profilePhotoUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024 // 1MB limit
  }
}).single('profilePhoto');
