import { Router } from 'express';
import prisma from '../config/prisma.js';
import { verifyAuth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Configure multer for QR code uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/gateways');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'qr-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Middleware to check admin
const isAdmin = async (req, res, next) => {
  try {
    // First check if isAdmin is already set by auth middleware
    if (req.user?.isAdmin) {
      return next();
    }
    
    // Otherwise check database
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isAdmin: true }
    });
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ error: 'Failed to verify admin status' });
  }
};

// GET /api/v1/gateways - Get all payment gateways (public for users)
router.get('/', verifyAuth, async (req, res) => {
  try {
    const gateways = await prisma.paymentGateway.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        network: true,
        walletAddress: true,
        qrCodeUrl: true,
        instructions: true,
        displayOrder: true,
        isActive: true
      }
    });

    res.json({ success: true, gateways });
  } catch (error) {
    console.error('Get gateways error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/gateways/admin - Get all gateways (admin only)
router.get('/admin', verifyAuth, isAdmin, async (req, res) => {
  try {
    const gateways = await prisma.paymentGateway.findMany({
      orderBy: { displayOrder: 'asc' }
    });

    res.json({ success: true, gateways });
  } catch (error) {
    console.error('Get admin gateways error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/gateways - Create new gateway (admin only)
router.post('/', verifyAuth, isAdmin, upload.single('qrCode'), async (req, res) => {
  try {
    const {
      name,
      type,
      walletAddress,
      network,
      accountEmail,
      accountId,
      instructions,
      minAmount,
      maxAmount,
      processingTime,
      displayOrder,
      isActive
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const gatewayData = {
      name,
      type,
      isActive: isActive === 'true' || isActive === true,
      displayOrder: displayOrder ? parseInt(displayOrder) : 0
    };

    // Add crypto-specific fields
    if (type === 'CRYPTO') {
      if (walletAddress) gatewayData.walletAddress = walletAddress;
      if (network) gatewayData.network = network;
      if (req.file) {
        gatewayData.qrCodePath = `/uploads/gateways/${req.file.filename}`;
      }
    }

    // Add PayPal/other fields
    if (type === 'PAYPAL' || type === 'OTHER') {
      if (accountEmail) gatewayData.accountEmail = accountEmail;
      if (accountId) gatewayData.accountId = accountId;
    }

    // Add optional fields
    if (instructions) gatewayData.instructions = instructions;
    if (minAmount) gatewayData.minAmount = parseFloat(minAmount);
    if (maxAmount) gatewayData.maxAmount = parseFloat(maxAmount);
    if (processingTime) gatewayData.processingTime = processingTime;

    const gateway = await prisma.paymentGateway.create({
      data: gatewayData
    });

    res.json({ success: true, gateway });
  } catch (error) {
    console.error('Create gateway error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/v1/gateways/:id - Update gateway (admin only)
router.put('/:id', verifyAuth, isAdmin, upload.single('qrCode'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      walletAddress,
      network,
      accountEmail,
      accountId,
      instructions,
      minAmount,
      maxAmount,
      processingTime,
      displayOrder,
      isActive
    } = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
    if (displayOrder !== undefined) updateData.displayOrder = parseInt(displayOrder);

    // Update crypto fields
    if (type === 'CRYPTO') {
      if (walletAddress !== undefined) updateData.walletAddress = walletAddress || null;
      if (network !== undefined) updateData.network = network || null;
      if (req.file) {
        updateData.qrCodePath = `/uploads/gateways/${req.file.filename}`;
      }
    }

    // Update PayPal/other fields
    if (type === 'PAYPAL' || type === 'OTHER') {
      if (accountEmail !== undefined) updateData.accountEmail = accountEmail || null;
      if (accountId !== undefined) updateData.accountId = accountId || null;
    }

    // Update optional fields
    if (instructions !== undefined) updateData.instructions = instructions || null;
    if (minAmount !== undefined) updateData.minAmount = minAmount ? parseFloat(minAmount) : null;
    if (maxAmount !== undefined) updateData.maxAmount = maxAmount ? parseFloat(maxAmount) : null;
    if (processingTime !== undefined) updateData.processingTime = processingTime || null;

    const gateway = await prisma.paymentGateway.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, gateway });
  } catch (error) {
    console.error('Update gateway error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/v1/gateways/:id - Delete gateway (admin only)
router.delete('/:id', verifyAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.paymentGateway.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Gateway deleted successfully' });
  } catch (error) {
    console.error('Delete gateway error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
