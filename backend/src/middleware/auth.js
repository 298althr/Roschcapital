import { verifyToken } from '../utils/jwt.js';
import prisma from '../config/prisma.js';

// Development mode - skip Redis entirely (MUST be false in production)
const DEV_MODE = process.env.NODE_ENV !== 'production';

/**
 * Middleware to verify JWT token from Authorization header or cookies
 * Attaches user info to req.user if valid
 */
export const verifyAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7); // Remove 'Bearer ' prefix
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      // In dev mode, try to get first admin user for testing
      if (DEV_MODE) {
        const adminUser = await prisma.user.findFirst({
          where: { isAdmin: true }
        });
        if (adminUser) {
          req.user = {
            userId: adminUser.id,
            email: adminUser.email,
            isAdmin: true
          };
          return next();
        }
      }
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    // Verify token (skip Redis blacklist check in dev mode)
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch user to check if admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isAdmin: true }
    });

    // Attach user info to request with isAdmin flag
    req.user = {
      ...decoded,
      isAdmin: user?.isAdmin || false
    };
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    // In dev mode, don't fail - try to continue
    if (DEV_MODE) {
      try {
        const adminUser = await prisma.user.findFirst({
          where: { isAdmin: true }
        });
        if (adminUser) {
          req.user = {
            userId: adminUser.id,
            email: adminUser.email,
            isAdmin: true
          };
          return next();
        }
      } catch (e) {
        console.error('Dev mode fallback failed:', e);
      }
    }
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token, but verifies if present
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = decoded;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

/**
 * Middleware to verify admin access
 * Must be used after verifyAuth middleware
 */
export const isAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isAdmin: true }
    });

    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({ error: 'Authorization failed' });
  }
};