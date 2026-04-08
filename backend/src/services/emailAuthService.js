import crypto from 'crypto';
import { sendEmail } from './emailService.js';
import config from '../config/app.js';

// Store email verification codes in memory (use Redis in production)
const emailVerificationCodes = new Map();

const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const CODE_LENGTH = 6;

/**
 * Generate a random 6-digit code
 */
const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send email verification code
 */
export const sendEmailVerificationCode = async (user) => {
  const code = generateVerificationCode();
  const expiresAt = Date.now() + CODE_EXPIRY_MS;

  // Store code with expiry
  emailVerificationCodes.set(user.id, {
    code,
    expiresAt,
    attempts: 0,
    email: user.email
  });

  // Send email
  const subject = 'Your Rosch Capital Bank Login Code';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .code { font-size: 48px; font-weight: bold; color: #667eea; text-align: center; letter-spacing: 8px; margin: 30px 0; padding: 20px; background: white; border-radius: 10px; border: 2px dashed #667eea; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Login Verification</h1>
        </div>
        <div class="content">
          <p>Dear ${user.firstName},</p>
          <p>You requested to log in to your Rosch Capital Bank account. Use the verification code below to complete your login:</p>
          <div class="code">${code}</div>
          <p><strong>This code will expire in 10 minutes.</strong></p>
          <div class="warning">
            <strong>⚠️ Security Notice</strong><br>
            If you did not request this code, please ignore this email and ensure your account is secure.
          </div>
          <p>For your security, never share this code with anyone, including Rosch Capital Bank staff.</p>
        </div>
        <div class="footer">
          <p>&#xa9; ${new Date().getFullYear()} Rosch Capital Bank. All rights reserved.</p>
          <p>This code is valid for 10 minutes only.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const result = await sendEmail(user.email, subject, html);

  if (result.success) {
    console.log(`📧 Email verification code sent to ${user.email}`);
  } else {
    console.error(`❌ Failed to send email code to ${user.email}`);
  }

  return {
    success: result.success,
    expiresAt,
    email: user.email
  };
};

/**
 * Verify email code
 */
export const verifyEmailCode = (userId, code) => {
  const stored = emailVerificationCodes.get(userId);

  if (!stored) {
    return { valid: false, error: 'No verification code found. Please request a new code.' };
  }

  // Check expiry
  if (Date.now() > stored.expiresAt) {
    emailVerificationCodes.delete(userId);
    return { valid: false, error: 'Verification code has expired. Please request a new code.' };
  }

  // Check attempts (max 3)
  if (stored.attempts >= 3) {
    emailVerificationCodes.delete(userId);
    return { valid: false, error: 'Too many failed attempts. Please request a new code.' };
  }

  // Verify code
  if (stored.code !== code.trim()) {
    stored.attempts++;
    return { 
      valid: false, 
      error: 'Invalid verification code.',
      attemptsRemaining: 3 - stored.attempts
    };
  }

  // Code is valid, remove it
  emailVerificationCodes.delete(userId);
  return { valid: true };
};

/**
 * Clean up expired codes (run periodically)
 */
export const cleanupExpiredCodes = () => {
  const now = Date.now();
  let cleaned = 0;

  for (const [userId, data] of emailVerificationCodes.entries()) {
    if (data.expiresAt < now) {
      emailVerificationCodes.delete(userId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired email verification codes`);
  }
};

// Clean up expired codes every 5 minutes
setInterval(cleanupExpiredCodes, 5 * 60 * 1000);

export default {
  sendEmailVerificationCode,
  verifyEmailCode,
  cleanupExpiredCodes
};
