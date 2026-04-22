import express from 'express';
import bcrypt from 'bcryptjs';
import config from '../config/app.js';
import { verifyAuth } from '../middleware/auth.js';
import { authLimiter, registerLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';
import { checkAccountLockout, recordFailedAttempt, clearLoginAttempts } from '../middleware/accountLockout.js';
import { sendEmailVerificationCode, verifyEmailCode } from '../services/emailAuthService.js';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserById,
  updateUserProfile,
  changePassword,
  refreshAccessToken,
} from '../services/authService.js';
import {
  generateBackupCodes,
  saveSecurityQuestions,
  verifySecurityAnswer,
  verifyBackupCode,
} from '../services/securityService.js';
import { logAction } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';
import { SECURITY_QUESTIONS } from '../constants/securityQuestions.js';
import { validateRequest, registerSchema, loginSchema } from '../utils/validation.js';
import { profilePhotoUpload } from '../middleware/profilePhotoUpload.js';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma.js';

const router = express.Router();

// Get available security questions
// GET /api/v1/auth/security-questions
router.get('/security-questions', (req, res) => {
  return res.json({ questions: SECURITY_QUESTIONS });
});

// Register a new user with security questions
// POST /api/v1/auth/register
router.post('/register', registerLimiter, async (req, res) => {
  const validation = validateRequest(registerSchema, req.body);
  if (!validation.valid) {
    return res.status(400).json({ errors: validation.errors });
  }

  const { 
    email, 
    password, 
    firstName, 
    lastName, 
    securityQuestions,
    phone,
    dateOfBirth,
    address,
    city,
    state,
    zipCode,
    country,
    nationality,
    governmentIdType,
    governmentIdNumber,
    currency
  } = req.body;

  try {
    // Validate security questions
    if (!securityQuestions || !Array.isArray(securityQuestions) || securityQuestions.length !== 3) {
      return res.status(400).json({ error: 'Must provide exactly 3 security questions' });
    }

    // Register user with additional data
    const result = await registerUser(email, password, firstName, lastName, {
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      address,
      city,
      state,
      zipCode,
      country,
      nationality,
      governmentIdType,
      governmentIdNumber,
      currency: currency || 'USD'
    });
    const userId = result.user.id;

    // Save security questions
    await saveSecurityQuestions(userId, securityQuestions);

    // Generate 100 backup codes
    const { pdfBuffer } = await generateBackupCodes(userId);

    // Save PDF to local storage
    const storageDir = `/app/storage/backup-codes/user_${userId}`;
    const pdfPath = path.join(storageDir, `rosch-backup-codes-${firstName}-${lastName}.pdf`);
    
    fs.mkdirSync(storageDir, { recursive: true });
    fs.writeFileSync(pdfPath, pdfBuffer);

    // Log registration
    await logAction(userId, 'REGISTER', req.ip, req.get('user-agent'), {
      email,
      name: `${firstName} ${lastName}`
    });

    return res.status(201).json({
      message: 'Registration successful. Admin will send your backup codes via email.',
      user: result.user,
      account: result.account,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(400).json({ error: error.message });
  }
});

// Step 1: Verify email and password
// POST /api/v1/auth/login
router.post('/login', authLimiter, checkAccountLockout, async (req, res) => {
  const validation = validateRequest(loginSchema, req.body);
  if (!validation.valid) {
    console.log('❌ Login validation failed:', JSON.stringify(validation.errors, null, 2));
    console.log('📦 Received body:', JSON.stringify(req.body, null, 2));
    return res.status(400).json({ errors: validation.errors });
  }

  const { email, password } = validation.data;

  try {
    // Normalize email to lowercase for case-insensitive lookup
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`🔐 Login attempt for: ${normalizedEmail}`);
    
    // Use case-insensitive search
    const user = await prisma.user.findFirst({ 
      where: { 
        email: { 
          equals: normalizedEmail,
          mode: 'insensitive' 
        } 
      } 
    });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      recordFailedAttempt(email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    console.log(`✅ User found: ${user.email}, ID: ${user.id}`);

    const bcrypt = (await import('bcryptjs')).default;
    const ok = await bcrypt.compare(password, user.password);
    console.log(`🔑 Password comparison result: ${ok}`);
    if (!ok) {
      const attemptResult = recordFailedAttempt(email);
      return res.status(401).json({ 
        error: 'Invalid email or password',
        attemptsRemaining: attemptResult.attemptsRemaining
      });
    }

    // Check if account is SUSPENDED (complete lockout)
    if (user.accountStatus === 'SUSPENDED') {
      await logAction(user.id, 'LOGIN_BLOCKED_SUSPENDED', req.ip, req.get('user-agent'));
      return res.status(403).json({ 
        error: 'Account Suspended',
        message: 'Your account has been suspended and requires physical verification with the bank. Please visit your nearest Rosch Capital Bank branch with valid identification to restore access.',
        suspensionReason: user.suspensionReason || 'Account suspended pending verification',
        accountStatus: 'SUSPENDED',
        contactInfo: {
          phone: '+1 (800) 555-BANK',
          email: 'support@roschcapital.com',
          hours: 'Mon-Fri 9AM-5PM EST'
        }
      });
    }

    // Get user's security questions
    const questions = await prisma.securityQuestion.findMany({
      where: { userId: user.id },
      select: { id: true, question: true }
    });

    // Log login attempt
    await logAction(user.id, 'LOGIN_ATTEMPT', req.ip, req.get('user-agent'));

    // TEMPORARY: If user has no security questions, allow direct login (for unseeded users)
    if (questions.length === 0) {
      console.log(`⚠️ User ${email} has no security questions - allowing direct login`);
      
      const jwt = (await import('jsonwebtoken')).default;
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '30d' } // Increased from 1h to 30d
      );
      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '30d' } // Increased from 7d to 30d
      );

      await logAction(user.id, 'LOGIN_SUCCESS', req.ip, req.get('user-agent'));
      
      // Clear login attempts on successful login
      clearLoginAttempts(email);

      return res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          accountStatus: user.accountStatus,
          kycStatus: user.kycStatus,
          isAdmin: user.isAdmin
        }
      });
    }

    return res.json({
      requiresVerification: true,
      userId: user.id,
      email: user.email,
      securityQuestions: questions,
      verificationMethods: ['email', 'security_question', 'backup_code'],
      loginPreference: user.loginPreference || 'email'
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(401).json({ error: 'Login failed' });
  }
});

// Request email verification code
// POST /api/v1/auth/login/send-email-code
router.post('/login/send-email-code', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await sendEmailVerificationCode(user);

    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to send verification code. Please try another method.' 
      });
    }

    return res.json({
      success: true,
      message: 'Verification code sent to your email',
      expiresAt: result.expiresAt,
      email: result.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mask email
    });
  } catch (error) {
    console.error('Send email code error:', error);
    return res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Step 2: Verify security question, backup code, OR email code
// POST /api/v1/auth/login/verify
router.post('/login/verify', async (req, res) => {
  const { userId, method, questionId, answer, backupCode, emailCode } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    let verified = false;
    let verificationResult = null;

    if (method === 'email') {
      if (!emailCode) {
        return res.status(400).json({ error: 'Email verification code is required' });
      }
      console.log(`📧 Verifying email code for user ${userId}`);
      verificationResult = verifyEmailCode(userId, emailCode);
      verified = verificationResult.valid;
      
      if (!verified) {
        return res.status(401).json({ 
          error: verificationResult.error,
          attemptsRemaining: verificationResult.attemptsRemaining
        });
      }
    } else if (method === 'security_question') {
      if (!questionId || !answer) {
        return res.status(400).json({ error: 'Question ID and answer are required' });
      }
      // Ensure answer is trimmed and lowercased for consistent comparison
      const cleanAnswer = answer.toLowerCase().trim();
      console.log(`🔐 Verifying security answer for user ${userId}, question ${questionId}`);
      verified = await verifySecurityAnswer(userId, questionId, cleanAnswer);
    } else if (method === 'backup_code') {
      if (!backupCode) {
        return res.status(400).json({ error: 'Backup code is required' });
      }
      const backupResult = await verifyBackupCode(userId, backupCode);
      if (!backupResult.valid) {
        return res.status(401).json({ 
          error: backupResult.error || 'Verification failed',
          alreadyUsed: backupResult.alreadyUsed || false
        });
      }
      verified = true;
    } else {
      return res.status(400).json({ error: 'Invalid verification method' });
    }

    if (!verified) {
      return res.status(401).json({ error: 'Verification failed' });
    }

    // Generate tokens
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const { generateToken, generateRefreshToken } = await import('../utils/jwt.js');
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token (non-blocking - don't fail login if Redis is unavailable)
    try {
      const redis = (await import('../config/redis.js')).default;
      await redis.setex(`refresh:${user.id}`, 30 * 24 * 60 * 60, refreshToken); // 30 days TTL
    } catch (redisError) {
      console.warn('⚠️ Redis unavailable for refresh token storage:', redisError.message);
      // Continue without Redis - JWT access token will still work
    }

    // Set cookie - use 'none' for cross-origin Railway deployment, 'lax' for same-origin
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Log successful login
    await logAction(userId, 'LOGIN_SUCCESS', req.ip, req.get('user-agent'), {
      method
    });
    
    // Clear login attempts on successful verification
    clearLoginAttempts(user.email);

    const { password: _, ...sanitizedUser } = user;

    return res.json({
      message: 'Login successful',
      user: sanitizedUser,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login verification error:', error);
    return res.status(401).json({ error: 'Verification failed' });
  }
});

// Logout user
// POST /api/v1/auth/logout
router.post('/logout', verifyAuth, async (req, res) => {
  try {
    const result = await logoutUser(req.token, req.user.userId);
    res.clearCookie('token');
    return res.status(200).json({ message: result.message });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user profile
// GET /api/v1/auth/me
router.get('/me', verifyAuth, async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

// Update user profile
// PUT /api/v1/auth/profile
router.put('/profile', verifyAuth, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;

    if (!firstName && !lastName) {
      return res.status(400).json({ error: 'At least one field is required' });
    }

    const user = await updateUserProfile(req.user.userId, { firstName, lastName });
    return res.status(200).json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Refresh access token
// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const result = await refreshAccessToken(refreshToken);
    return res.status(200).json({ accessToken: result.accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(400).json({ error: error.message });
  }
});

// Change password with backup code verification
// POST /api/v1/auth/change-password
router.post('/change-password', passwordResetLimiter, verifyAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, backupCode } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!currentPassword || !newPassword || !backupCode) {
      return res.status(400).json({ error: 'Current password, new password, and backup code are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Verify current password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      await logAction(userId, 'PASSWORD_CHANGE_FAILED', req.ip, req.get('user-agent'), {
        reason: 'Invalid current password'
      });
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Verify backup code - REQUIRED for password change
    const backupResult = await verifyBackupCode(userId, backupCode);
    if (!backupResult.valid) {
      await logAction(userId, 'PASSWORD_CHANGE_FAILED', req.ip, req.get('user-agent'), {
        reason: 'Invalid backup code'
      });
      return res.status(401).json({ error: backupResult.error || 'Invalid backup code', alreadyUsed: backupResult.alreadyUsed });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Log the action
    await logAction(userId, 'PASSWORD_CHANGED', req.ip, req.get('user-agent'));

    // Create notification
    await createNotification(
      userId,
      'security',
      'Password Changed',
      'Your password has been successfully changed.',
      { timestamp: new Date() }
    );

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get random security question for password change
// GET /api/v1/auth/random-security-question
router.get('/random-security-question', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all user's security questions
    const questions = await prisma.securityQuestion.findMany({
      where: { userId },
      select: {
        id: true,
        question: true
      }
    });

    if (questions.length === 0) {
      return res.status(404).json({ error: 'No security questions found' });
    }

    // Select a random question
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

    return res.status(200).json({
      questionId: randomQuestion.id,
      question: randomQuestion.question
    });
  } catch (error) {
    console.error('Get random security question error:', error);
    return res.status(500).json({ error: 'Failed to get security question' });
  }
});

// Update login preference (requires verification)
// PUT /api/v1/auth/login-preference
router.put('/login-preference', verifyAuth, async (req, res) => {
  try {
    const { preference, backupCode, questionId, answer } = req.body;
    const userId = req.user.userId;

    // Validate preference
    if (!['question', 'code'].includes(preference)) {
      return res.status(400).json({ error: 'Invalid preference. Must be "question" or "code"' });
    }

    // Get current user preference
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { loginPreference: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If preference is the same, no change needed
    if (user.loginPreference === preference) {
      return res.status(200).json({ 
        message: 'Login preference is already set to this value',
        preference 
      });
    }

    // Require verification based on current preference
    if (user.loginPreference === 'question') {
      // Currently using security questions - require backup code to change
      if (!backupCode) {
        return res.status(400).json({ error: 'Backup code is required to change from security question' });
      }
      
      const backupResult = await verifyBackupCode(userId, backupCode);
      if (!backupResult.valid) {
        return res.status(401).json({ 
          error: backupResult.error || 'Invalid or already used backup code',
          alreadyUsed: backupResult.alreadyUsed || false
        });
      }
    } else {
      // Currently using backup code/auth token - require security question answer to change
      if (!questionId || !answer) {
        return res.status(400).json({ error: 'Security question answer is required to change from auth token' });
      }
      
      const cleanAnswer = answer.toLowerCase().trim();
      const verified = await verifySecurityAnswer(userId, questionId, cleanAnswer);
      if (!verified) {
        return res.status(401).json({ error: 'Incorrect security question answer' });
      }
    }

    // Update user preference
    await prisma.user.update({
      where: { id: userId },
      data: { loginPreference: preference }
    });

    // Log the action
    await logAction(userId, 'LOGIN_PREFERENCE_CHANGED', req.ip, req.get('user-agent'), {
      newPreference: preference,
      previousPreference: user.loginPreference
    });

    return res.status(200).json({ 
      message: 'Login preference updated successfully',
      preference 
    });
  } catch (error) {
    console.error('Update login preference error:', error);
    return res.status(500).json({ error: 'Failed to update login preference' });
  }
});

// Get user's login preference
// GET /api/v1/auth/login-preference
router.get('/login-preference', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { loginPreference: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ preference: user.loginPreference });
  } catch (error) {
    console.error('Get login preference error:', error);
    return res.status(500).json({ error: 'Failed to get login preference' });
  }
});

// Upload profile photo
// POST /api/v1/users/profile-photo
router.post('/users/profile-photo', verifyAuth, (req, res) => {
  profilePhotoUpload(req, res, async (err) => {
    // Handle multer errors with detailed messages
    if (err) {
      console.error('Multer upload error:', err);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false,
          error: 'File size too large. Maximum size is 1MB',
          details: err.message 
        });
      }
      
      if (err.message.includes('Only image files')) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid file type. Only JPEG, JPG, PNG, and GIF images are allowed',
          details: err.message 
        });
      }
      
      return res.status(400).json({ 
        success: false,
        error: 'File upload failed',
        details: err.message 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded. Please select an image file' 
      });
    }

    try {
      const userId = req.user.userId;
      const photoPath = `/uploads/profiles/${userId}/${req.file.filename}`;

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Update user profile photo in database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profilePhoto: photoPath }
      });

      console.log(`Profile photo uploaded successfully for user ${userId}: ${photoPath}`);

      return res.json({
        success: true,
        message: 'Profile photo uploaded successfully',
        photoUrl: photoPath,
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          profilePhoto: updatedUser.profilePhoto
        }
      });
    } catch (error) {
      console.error('Profile photo database error:', error);
      
      // Provide specific error messages
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          success: false,
          error: 'User not found in database',
          details: error.message 
        });
      }
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to save profile photo to database',
        details: error.message 
      });
    }
  });
});

// Upload profile photo as base64
// POST /api/v1/auth/profile-photo-base64
router.post('/profile-photo-base64', verifyAuth, async (req, res) => {
  try {
    const { base64Image } = req.body;
    const userId = req.user.userId;

    if (!base64Image) {
      return res.status(400).json({ error: 'Base64 image data is required' });
    }

    // Validate base64 format
    const matches = base64Image.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid base64 image format. Must be data:image/[type];base64,[data]' });
    }

    // Check size (limit to 5MB)
    const base64Data = matches[2];
    const sizeInBytes = (base64Data.length * 3) / 4;
    if (sizeInBytes > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image size exceeds 5MB limit' });
    }

    // Store the base64 image directly in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: base64Image }
    });

    console.log(`Base64 profile photo saved for user ${userId}`);

    return res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        profilePhoto: updatedUser.profilePhoto
      }
    });
  } catch (error) {
    console.error('Base64 profile photo error:', error);
    return res.status(500).json({ error: 'Failed to save profile photo' });
  }
});

// Get auto-debit settings
// GET /api/v1/auth/auto-debit-settings
router.get('/auto-debit-settings', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { autoDebitEnabled: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      enabled: user.autoDebitEnabled ?? true,
      excludedAccountTypes: ['CRYPTO_WALLET'],
      priority: ['SAVINGS', 'CHECKING', 'BUSINESS'],
      policy: {
        title: 'Automatic Balance Protection',
        description: 'When enabled, negative balances in your accounts will be automatically covered by transferring funds from your other accounts.',
        rules: [
          'Crypto wallets are excluded from auto-debit (investment proceeds are protected)',
          'Savings account is used first, then Checking',
          'You will receive a notification for each auto-debit transfer',
          'This feature helps avoid overdraft fees and account restrictions'
        ]
      }
    });
  } catch (error) {
    console.error('Get auto-debit settings error:', error);
    return res.status(500).json({ error: 'Failed to get auto-debit settings' });
  }
});

// Update auto-debit settings
// PUT /api/v1/auth/auto-debit-settings
router.put('/auto-debit-settings', verifyAuth, async (req, res) => {
  try {
    const { enabled } = req.body;
    const userId = req.user.userId;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Invalid value for enabled. Must be true or false' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { autoDebitEnabled: enabled }
    });

    await logAction(userId, 'AUTO_DEBIT_SETTINGS_CHANGED', req.ip, req.get('user-agent'), {
      enabled
    });

    return res.status(200).json({
      message: 'Auto-debit settings updated successfully',
      enabled
    });
  } catch (error) {
    console.error('Update auto-debit settings error:', error);
    return res.status(500).json({ error: 'Failed to update auto-debit settings' });
  }
});

// ============= FORGOT PASSWORD FLOW =============

// Step 1: Verify email exists
// POST /api/v1/auth/forgot-password/verify-email
router.post('/forgot-password/verify-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Normalize email for case-insensitive search
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive'
        }
      },
      select: { id: true, email: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    // Log the attempt
    await logAction(user.id, 'FORGOT_PASSWORD_EMAIL_VERIFIED', req.ip, req.get('user-agent'));

    return res.status(200).json({
      success: true,
      message: 'Email verified. Please enter your Auth Token.'
    });
  } catch (error) {
    console.error('Forgot password verify email error:', error);
    return res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Step 2: Verify backup code (without marking as used yet)
// POST /api/v1/auth/forgot-password/verify-code
router.post('/forgot-password/verify-code', async (req, res) => {
  try {
    const { email, backupCode } = req.body;

    if (!email || !backupCode) {
      return res.status(400).json({ error: 'Email and backup code are required' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive'
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify the backup code exists and is not used
    const code = await prisma.backupCode.findFirst({
      where: {
        userId: user.id,
        code: backupCode.trim(),
        used: false
      }
    });

    if (!code) {
      // Check if code exists but is already used
      const usedCode = await prisma.backupCode.findFirst({
        where: {
          userId: user.id,
          code: backupCode.trim(),
          used: true
        }
      });

      if (usedCode) {
        return res.status(401).json({ 
          error: 'This Auth Token has already been used. Please use a different one.',
          alreadyUsed: true
        });
      }

      return res.status(401).json({ error: 'Invalid Auth Token' });
    }

    // Log the verification (don't mark as used yet - that happens on password reset)
    await logAction(user.id, 'FORGOT_PASSWORD_CODE_VERIFIED', req.ip, req.get('user-agent'));

    return res.status(200).json({
      success: true,
      message: 'Auth Token verified. You can now reset your password.'
    });
  } catch (error) {
    console.error('Forgot password verify code error:', error);
    return res.status(500).json({ error: 'Failed to verify Auth Token' });
  }
});

// Step 3: Reset password (marks backup code as used)
// POST /api/v1/auth/forgot-password/reset
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { email, backupCode, newPassword } = req.body;

    if (!email || !backupCode || !newPassword) {
      return res.status(400).json({ error: 'Email, backup code, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive'
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify and mark backup code as used in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find the backup code
      const code = await tx.backupCode.findFirst({
        where: {
          userId: user.id,
          code: backupCode.trim(),
          used: false
        }
      });

      if (!code) {
        throw new Error('Invalid or already used Auth Token');
      }

      // Mark backup code as used
      await tx.backupCode.update({
        where: { id: code.id },
        data: { 
          used: true,
          usedAt: new Date()
        }
      });

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      await tx.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      return { success: true };
    });

    // Log the password reset
    await logAction(user.id, 'PASSWORD_RESET_VIA_FORGOT', req.ip, req.get('user-agent'));

    // Create notification
    await createNotification(
      user.id,
      'security',
      'Password Reset',
      'Your password has been reset successfully. If you did not make this change, please contact support immediately.',
      { timestamp: new Date() }
    );

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Forgot password reset error:', error);
    return res.status(500).json({ error: error.message || 'Failed to reset password' });
  }
});

export default router;
