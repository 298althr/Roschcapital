import prisma from '../config/prisma.js';

// Store failed login attempts in memory (use Redis in production for scalability)
const loginAttempts = new Map();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if account is locked
 */
export const isAccountLocked = (email) => {
  const attempts = loginAttempts.get(email);
  
  if (!attempts) {
    return { locked: false };
  }

  if (attempts.count >= MAX_ATTEMPTS) {
    const timeRemaining = attempts.lockedUntil - Date.now();
    
    if (timeRemaining > 0) {
      return {
        locked: true,
        remainingMinutes: Math.ceil(timeRemaining / 60000),
        lockedUntil: attempts.lockedUntil
      };
    } else {
      // Lockout expired, reset attempts
      loginAttempts.delete(email);
      return { locked: false };
    }
  }

  return { locked: false };
};

/**
 * Record failed login attempt
 */
export const recordFailedAttempt = (email) => {
  const attempts = loginAttempts.get(email) || { count: 0, firstAttempt: Date.now() };
  
  attempts.count++;
  attempts.lastAttempt = Date.now();

  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    console.warn(`🔒 Account locked: ${email} (${MAX_ATTEMPTS} failed attempts)`);
  }

  loginAttempts.set(email, attempts);

  return {
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - attempts.count),
    locked: attempts.count >= MAX_ATTEMPTS,
    lockedUntil: attempts.lockedUntil
  };
};

/**
 * Clear login attempts on successful login
 */
export const clearLoginAttempts = (email) => {
  loginAttempts.delete(email);
};

/**
 * Get current attempt count
 */
export const getAttemptCount = (email) => {
  const attempts = loginAttempts.get(email);
  return attempts ? attempts.count : 0;
};

/**
 * Middleware to check account lockout
 */
export const checkAccountLockout = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next();
  }

  const lockStatus = isAccountLocked(email);

  if (lockStatus.locked) {
    return res.status(429).json({
      success: false,
      message: `Account temporarily locked due to multiple failed login attempts. Please try again in ${lockStatus.remainingMinutes} minutes.`,
      lockedUntil: lockStatus.lockedUntil,
      remainingMinutes: lockStatus.remainingMinutes
    });
  }

  next();
};

/**
 * Clean up expired lockouts (run periodically)
 */
export const cleanupExpiredLockouts = () => {
  const now = Date.now();
  let cleaned = 0;

  for (const [email, attempts] of loginAttempts.entries()) {
    if (attempts.lockedUntil && attempts.lockedUntil < now) {
      loginAttempts.delete(email);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired account lockouts`);
  }
};

// Clean up expired lockouts every 5 minutes
setInterval(cleanupExpiredLockouts, 5 * 60 * 1000);

export default {
  isAccountLocked,
  recordFailedAttempt,
  clearLoginAttempts,
  getAttemptCount,
  checkAccountLockout,
  cleanupExpiredLockouts
};
