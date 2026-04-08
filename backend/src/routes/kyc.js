import express from 'express';
import prisma from '../config/prisma.js';
import { verifyAuth } from '../middleware/auth.js';
import { uploadKYCDocuments } from '../middleware/kycUpload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();


// Get user's KYC status and documents
// GET /api/v1/kyc/status
router.get('/status', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        kycStatus: true,
        kycRejectionReason: true,
        kycSubmittedAt: true,
        kycReviewedAt: true,
        isBusinessAccount: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const documents = await prisma.kYCDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Group documents by category
    const documentsByCategory = documents.reduce((acc, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = [];
      }
      acc[doc.category].push({
        id: doc.id,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        status: doc.status,
        reviewNotes: doc.reviewNotes,
        createdAt: doc.createdAt
      });
      return acc;
    }, {});

    return res.json({
      kycStatus: user.kycStatus,
      rejectionReason: user.kycRejectionReason,
      submittedAt: user.kycSubmittedAt,
      reviewedAt: user.kycReviewedAt,
      isBusinessAccount: user.isBusinessAccount,
      documents: documentsByCategory,
      totalDocuments: documents.length
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    return res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

// Upload KYC documents
// POST /api/v1/kyc/upload
router.post('/upload', uploadLimiter, verifyAuth, uploadKYCDocuments, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category, documentType, description } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (!category) {
      return res.status(400).json({ error: 'Document category is required' });
    }

    // Valid categories
    const validCategories = [
      'GOVERNMENT_ID', 'PROOF_OF_ADDRESS', 'TAX_ID', 'SELFIE',
      'BUSINESS_REGISTRATION', 'BUSINESS_TAX', 'BUSINESS_ADDRESS',
      'REPRESENTATIVE_ID', 'OTHER'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid document category' });
    }

    // Create document records
    const uploadedDocs = await Promise.all(
      req.files.map(async (file) => {
        return await prisma.KYCDocument.create({
          data: {
            userId,
            category,
            documentType: documentType || null,
            filePath: file.path,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            description: description || null,
            status: 'PENDING'
          }
        });
      })
    );

    return res.json({
      message: 'Documents uploaded successfully',
      documents: uploadedDocs
    });
  } catch (error) {
    console.error('Upload KYC documents error:', error);
    return res.status(500).json({ error: 'Failed to upload documents' });
  }
});

// Get user's uploaded documents
// GET /api/v1/kyc/documents
router.get('/documents', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const documents = await prisma.KYCDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ documents });
  } catch (error) {
    console.error('Get KYC documents error:', error);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Delete a document (only if KYC not yet submitted)
// DELETE /api/v1/kyc/documents/:documentId
router.delete('/documents/:documentId', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;

    // Check user's KYC status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true }
    });

    if (user.kycStatus === 'PENDING' || user.kycStatus === 'VERIFIED') {
      return res.status(400).json({ 
        error: 'Cannot delete documents after submission. Please contact support.' 
      });
    }

    // Find and delete document
    const document = await prisma.KYCDocument.findFirst({
      where: { 
        id: documentId,
        userId 
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete from database
    await prisma.KYCDocument.delete({
      where: { id: documentId }
    });

    return res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete KYC document error:', error);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Submit KYC for review
// POST /api/v1/kyc/submit
router.post('/submit', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if user has uploaded documents
    const documentCount = await prisma.KYCDocument.count({
      where: { userId }
    });

    if (documentCount === 0) {
      return res.status(400).json({ 
        error: 'Please upload at least one document before submitting' 
      });
    }

    // Get user info to check account type
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        isBusinessAccount: true,
        kycStatus: true 
      }
    });

    if (user.kycStatus === 'PENDING') {
      return res.status(400).json({ 
        error: 'KYC submission is already under review' 
      });
    }

    if (user.kycStatus === 'VERIFIED') {
      return res.status(400).json({ 
        error: 'KYC is already verified' 
      });
    }

    // Check minimum required documents
    const documents = await prisma.KYCDocument.findMany({
      where: { userId },
      select: { category: true }
    });

    const categories = [...new Set(documents.map(d => d.category))];

    if (user.isBusinessAccount) {
      // Business accounts need at least: Business Registration, Business Tax, Representative ID
      const requiredCategories = ['BUSINESS_REGISTRATION', 'REPRESENTATIVE_ID'];
      const hasRequired = requiredCategories.every(cat => categories.includes(cat));
      
      if (!hasRequired) {
        return res.status(400).json({ 
          error: 'Business accounts must upload: Business Registration and Representative ID documents' 
        });
      }
    } else {
      // Personal accounts need at least: Government ID, Proof of Address
      const requiredCategories = ['GOVERNMENT_ID'];
      const hasRequired = requiredCategories.every(cat => categories.includes(cat));
      
      if (!hasRequired) {
        return res.status(400).json({ 
          error: 'Personal accounts must upload at least a Government ID document' 
        });
      }
    }

    // Update user KYC status to PENDING
    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: 'PENDING',
        kycSubmittedAt: new Date()
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'kyc',
        title: 'KYC Submitted for Review',
        message: 'Your KYC documents have been submitted and are under review. You will be notified once the review is complete.',
        metadata: {
          submittedAt: new Date().toISOString(),
          documentCount
        }
      }
    });

    return res.json({ 
      success: true,
      message: 'KYC submitted successfully for review',
      status: 'PENDING'
    });
  } catch (error) {
    console.error('Submit KYC error:', error);
    return res.status(500).json({ error: 'Failed to submit KYC' });
  }
});

export default router;
