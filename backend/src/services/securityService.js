import bcrypt from 'bcryptjs';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma.js';
import { isValidQuestion } from '../constants/securityQuestions.js';

/**
 * Generate 100 unique 6-digit backup codes for a user
 * Returns the codes and a PDF buffer
 */
export const generateBackupCodes = async (userId) => {
  const codes = [];
  const codeHashes = [];
  
  // Generate 100 unique codes
  for (let i = 0; i < 100; i++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    codes.push(code);
    
    // Hash each code before storing
    const hash = await bcrypt.hash(code, 10);
    codeHashes.push({
      userId,
      codeHash: hash,
      used: false
    });
  }
  
  // Store hashed codes in database
  await prisma.backupCode.createMany({
    data: codeHashes
  });
  
  // Get user info for PDF
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, email: true }
  });
  
  // Generate PDF
  const pdfBuffer = await generateBackupCodesPDF(codes, user);
  
  return {
    codes, // Return plain codes for immediate display/download
    pdfBuffer
  };
};

/**
 * Generate PDF document with backup codes
 */
const generateBackupCodesPDF = (codes, user) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    
    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('Rosch Capital Bank', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(18).font('Helvetica').text('Backup Authentication Codes', { align: 'center' });
    doc.moveDown(1);
    
    // User info
    doc.fontSize(12).font('Helvetica-Bold').text('Account Holder:', 50, doc.y);
    doc.font('Helvetica').text(`${user.firstName} ${user.lastName}`, 150, doc.y - 12);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Email:', 50, doc.y);
    doc.font('Helvetica').text(user.email, 150, doc.y - 12);
    doc.moveDown(1);
    
    // Instructions
    doc.fontSize(11).font('Helvetica-Bold').text('IMPORTANT INSTRUCTIONS:', 50, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica')
      .text('• Each code can only be used ONCE', 70, doc.y)
      .text('• Store this document in a secure location', 70, doc.y + 15)
      .text('• You will need a code for:', 70, doc.y + 30)
      .text('  - Logging in from a new device', 90, doc.y + 45)
      .text('  - Making transfers', 90, doc.y + 60)
      .text('  - Password reset', 90, doc.y + 75)
      .text('  - Changing security settings', 90, doc.y + 90);
    
    doc.moveDown(3);
    
    // Backup codes in grid (10 rows × 10 columns)
    doc.fontSize(11).font('Helvetica-Bold').text('YOUR 100 BACKUP CODES:', 50, doc.y);
    doc.moveDown(1);
    
    const startY = doc.y;
    const codeWidth = 50;
    const codeHeight = 20;
    const cols = 10;
    
    codes.forEach((code, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = 50 + (col * codeWidth);
      const y = startY + (row * codeHeight);
      
      doc.fontSize(9).font('Courier').text(code, x, y);
    });
    
    // Footer
    doc.fontSize(8).font('Helvetica-Oblique')
      .text(
        `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
    
    doc.end();
  });
};

/**
 * Verify a backup code for a user
 * Marks the code as used if valid
 * Returns object with { valid, error, alreadyUsed }
 */
export const verifyBackupCode = async (userId, code) => {
  if (!code || code.length !== 6) {
    return { valid: false, error: 'Invalid code format' };
  }
  
  // First check if this code was already used
  const allCodes = await prisma.backupCode.findMany({
    where: { userId }
  });
  
  // Check if code matches any used code
  for (const dbCode of allCodes) {
    const isMatch = await bcrypt.compare(code, dbCode.codeHash);
    if (isMatch) {
      if (dbCode.used) {
        return { valid: false, error: 'Code already used', alreadyUsed: true };
      }
      // Code is valid and not used - mark as used
      await prisma.backupCode.update({
        where: { id: dbCode.id },
        data: {
          used: true,
          usedAt: new Date()
        }
      });
      return { valid: true };
    }
  }
  
  return { valid: false, error: 'Invalid backup code' };
};

/**
 * Mark a backup code as used for a specific action
 */
export const markBackupCodeUsed = async (userId, code, usedFor) => {
  const backupCodes = await prisma.backupCode.findMany({
    where: {
      userId,
      used: false
    }
  });
  
  for (const dbCode of backupCodes) {
    const isValid = await bcrypt.compare(code, dbCode.codeHash);
    
    if (isValid) {
      await prisma.backupCode.update({
        where: { id: dbCode.id },
        data: {
          used: true,
          usedAt: new Date(),
          usedFor
        }
      });
      
      return true;
    }
  }
  
  return false;
};

/**
 * Save security questions and answers for a user
 */
export const saveSecurityQuestions = async (userId, questionsArray) => {
  // Validate input
  if (!Array.isArray(questionsArray) || questionsArray.length !== 3) {
    throw new Error('Must provide exactly 3 security questions');
  }
  
  // Validate each question is from approved pool
  for (const item of questionsArray) {
    if (!isValidQuestion(item.question)) {
      throw new Error(`Invalid security question: ${item.question}`);
    }
    
    if (!item.answer || item.answer.trim().length < 2) {
      throw new Error('Security question answers must be at least 2 characters');
    }
  }
  
  // Delete any existing questions
  await prisma.securityQuestion.deleteMany({
    where: { userId }
  });
  
  // Hash answers and save (case-insensitive)
  const questions = await Promise.all(
    questionsArray.map(async (item) => {
      const answerHash = await bcrypt.hash(item.answer.toLowerCase().trim(), 10);
      return {
        userId,
        question: item.question,
        answerHash
      };
    })
  );
  
  await prisma.securityQuestion.createMany({
    data: questions
  });
  
  return true;
};

/**
 * Verify a security question answer
 */
export const verifySecurityAnswer = async (userId, questionId, answer) => {
  if (!answer || answer.trim().length === 0) {
    return false;
  }
  
  const question = await prisma.securityQuestion.findFirst({
    where: {
      id: questionId,
      userId
    }
  });
  
  if (!question) {
    return false;
  }
  
  // Compare case-insensitive
  const isValid = await bcrypt.compare(answer.toLowerCase().trim(), question.answerHash);
  return isValid;
};

/**
 * Get unused backup codes count for a user
 */
export const getUnusedCodesCount = async (userId) => {
  const count = await prisma.backupCode.count({
    where: {
      userId,
      used: false
    }
  });
  
  return count;
};

/**
 * Regenerate backup codes (invalidates all old codes)
 */
export const regenerateBackupCodes = async (userId) => {
  // Delete all existing codes
  await prisma.backupCode.deleteMany({
    where: { userId }
  });
  
  // Generate new codes
  return await generateBackupCodes(userId);
};
