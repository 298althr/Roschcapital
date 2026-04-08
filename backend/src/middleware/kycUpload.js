import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure KYC upload directory exists
const ensureKYCDir = (userId) => {
  const dir = path.join(process.cwd(), 'uploads', 'kyc', userId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.userId || req.user?.id || 'temp';
    const uploadDir = ensureKYCDir(userId);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `kyc-${uniqueSuffix}${ext}`);
  }
});

// File filter - only allow specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, GIF, and PDF files are allowed.'), false);
  }
};

// Create multer upload instance
export const kycUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

// Middleware to handle multiple KYC document uploads
export const uploadKYCDocuments = kycUpload.array('documents', 20); // Max 20 files at once

export default kycUpload;
