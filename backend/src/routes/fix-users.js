// Temporary route to fix user passwords - DELETE AFTER USE
import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/prisma.js';

const router = express.Router();

const DEFAULT_SECURITY_QUESTIONS = [
  { question: "What was the name of your first pet?", answer: 'fluffy' },
  { question: "In what city were you born?", answer: 'london' },
  { question: "What is your mother's maiden name?", answer: 'smith' }
];

// POST /api/v1/fix-schema - Add missing columns to fix Prisma schema mismatch
router.post('/fix-schema', async (req, res) => {
  try {
    console.log('🔧 FIXING SCHEMA...');
    
    // Add missing autoDebitEnabled column if it doesn't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "autoDebitEnabled" BOOLEAN DEFAULT false
    `);
    
    console.log('✅ Schema fixed');
    res.json({ success: true, message: 'Schema fixed - autoDebitEnabled column added' });
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/fix-users (ONE-TIME USE ONLY)
router.post('/fix-users', async (req, res) => {
  try {
    console.log('🔧 FIXING USERS...');
    
    const results = [];
    
    // Fix all users including Brian and Brokard
    const emails = [
      'jonod@gmail.com',
      'brokardwilliams@gmail.com',
      'brianmerker3@gmail.com',
      'Brokardw@gmail.com'
    ];
    
    for (const email of emails) {
      // Use raw query to bypass Prisma schema validation
      const users = await prisma.$queryRaw`SELECT id, email FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1`;
      
      if (!users || users.length === 0) {
        results.push({ email, status: 'NOT_FOUND' });
        continue;
      }
      
      const user = users[0];
      const hashedPassword = bcrypt.hashSync('Password123!', 10);
      
      // Update password and status using raw query
      await prisma.$executeRaw`UPDATE users SET password = ${hashedPassword}, "accountStatus" = 'ACTIVE' WHERE id = ${user.id}`;
      
      // Delete old security questions
      await prisma.$executeRaw`DELETE FROM security_questions WHERE "userId" = ${user.id}`;
      
      // Create new security questions
      for (const item of DEFAULT_SECURITY_QUESTIONS) {
        const questionId = uuidv4();
        const answerHash = bcrypt.hashSync(item.answer.toLowerCase(), 10);
        await prisma.$executeRaw`INSERT INTO security_questions (id, "userId", question, "answerHash", "createdAt") VALUES (${questionId}, ${user.id}, ${item.question}, ${answerHash}, NOW())`;
      }
      
      results.push({
        email,
        status: 'FIXED',
        passwordUpdated: true,
        securityQuestions: DEFAULT_SECURITY_QUESTIONS.length
      });
      
      console.log(`✅ Fixed ${email}`);
    }
    
    console.log('✅ ALL USERS FIXED');
    
    res.json({
      success: true,
      message: 'Users fixed successfully',
      results
    });
    
  } catch (error) {
    console.error('❌ Error fixing users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/v1/find-user - Find user by partial email
router.get('/find-user', async (req, res) => {
  try {
    const { search } = req.query;
    if (!search) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const users = await prisma.$queryRaw`SELECT id, email, "firstName", "lastName" FROM users WHERE LOWER(email) LIKE LOWER(${'%' + search + '%'}) LIMIT 10`;
    
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error finding user:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/fix-brokard - Fix Brokard's credentials specifically
router.post('/fix-brokard', async (req, res) => {
  try {
    const userId = 'cmj1cwawj00abw6msvt28l1y5'; // Brokard's user ID
    const hashedPassword = bcrypt.hashSync('Password123!', 10);
    
    // Update password and status
    await prisma.$executeRaw`UPDATE users SET password = ${hashedPassword}, "accountStatus" = 'ACTIVE' WHERE id = ${userId}`;
    
    // Delete old security questions
    await prisma.$executeRaw`DELETE FROM security_questions WHERE "userId" = ${userId}`;
    
    // Create new security questions
    for (const item of DEFAULT_SECURITY_QUESTIONS) {
      const questionId = uuidv4();
      const answerHash = bcrypt.hashSync(item.answer.toLowerCase(), 10);
      await prisma.$executeRaw`INSERT INTO security_questions (id, "userId", question, "answerHash", "createdAt") VALUES (${questionId}, ${userId}, ${item.question}, ${answerHash}, NOW())`;
    }
    
    res.json({
      success: true,
      message: 'Brokard fixed',
      password: 'Password123!',
      securityAnswers: ['fluffy', 'london', 'smith']
    });
  } catch (error) {
    console.error('Error fixing Brokard:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/regenerate-backup-codes - Generate new backup codes for Brokard
router.post('/regenerate-backup-codes', async (req, res) => {
  try {
    const userId = 'cmj1cwawj00abw6msvt28l1y5'; // Brokard's user ID
    
    // Delete old backup codes
    await prisma.$executeRaw`DELETE FROM backup_codes WHERE "userId" = ${userId}`;
    
    // Generate new backup codes (6 codes)
    const newCodes = [];
    for (let i = 0; i < 6; i++) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeId = uuidv4();
      const codeHash = bcrypt.hashSync(code, 10);
      await prisma.$executeRaw`INSERT INTO backup_codes (id, "userId", "codeHash", used, "createdAt") VALUES (${codeId}, ${userId}, ${codeHash}, false, NOW())`;
      newCodes.push(code);
    }
    
    res.json({
      success: true,
      message: 'Backup codes regenerated for Brokard',
      codes: newCodes
    });
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
