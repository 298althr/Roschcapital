import prisma from '../config/prisma.js';

/**
 * Middleware to check if user account has PND (Pending - No Debit) status
 * PND users can only receive credits, not make debits
 * Returns 403 with instructions to contact account manager
 */
export const checkPNDStatus = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        accountStatus: true, 
        suspensionReason: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.accountStatus === 'PND') {
      return res.status(403).json({
        error: 'Account Restricted',
        code: 'PND_RESTRICTION',
        message: 'Your account is currently under review and debit transactions are temporarily restricted. You can still receive funds. Please contact your account manager to resolve this.',
        suspensionReason: user.suspensionReason || 'Account under review',
        accountStatus: 'PND',
        allowedActions: ['CREDIT', 'VIEW_BALANCE', 'VIEW_TRANSACTIONS'],
        restrictedActions: ['DEBIT', 'TRANSFER', 'WITHDRAWAL', 'PAYMENT'],
        contactInfo: {
          phone: '+1 (800) 555-BANK',
          email: 'accountmanager@roschcapital.com',
          supportTicket: 'Create a support ticket for faster resolution'
        }
      });
    }

    next();
  } catch (error) {
    console.error('PND check error:', error);
    return res.status(500).json({ error: 'Failed to verify account status' });
  }
};

/**
 * Middleware to check if user account is SUSPENDED (complete lockout)
 * SUSPENDED users cannot perform any operations
 */
export const checkSuspendedStatus = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        accountStatus: true, 
        suspensionReason: true 
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        error: 'Account Suspended',
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended and requires physical verification with the bank. Please visit your nearest Rosch Capital Bank branch with valid identification.',
        suspensionReason: user.suspensionReason || 'Account suspended pending verification',
        accountStatus: 'SUSPENDED',
        contactInfo: {
          phone: '+1 (800) 555-BANK',
          email: 'support@roschcapital.com',
          hours: 'Mon-Fri 9AM-5PM EST'
        }
      });
    }

    next();
  } catch (error) {
    console.error('Suspended check error:', error);
    return res.status(500).json({ error: 'Failed to verify account status' });
  }
};

/**
 * Combined middleware that checks both PND and SUSPENDED status
 * Use this for debit operations
 */
export const checkDebitEligibility = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        accountStatus: true, 
        suspensionReason: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check SUSPENDED first (more severe)
    if (user.accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        error: 'Account Suspended',
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended. Please visit your nearest Rosch Capital Bank branch for verification.',
        accountStatus: 'SUSPENDED'
      });
    }

    // Check PND (can receive but not send)
    if (user.accountStatus === 'PND') {
      return res.status(403).json({
        error: 'Account Placed on PND',
        code: 'PND_RESTRICTION',
        message: 'Your account has been placed on PND (Pending - No Debit) status. All debit transactions including withdrawals and transfers are temporarily restricted. You can still receive funds. Please contact support for more information.',
        suspensionReason: user.suspensionReason || 'Account under review',
        accountStatus: 'PND',
        contactInfo: {
          phone: '+1 (800) 555-BANK',
          email: 'support@roschcapital.com'
        }
      });
    }

    next();
  } catch (error) {
    console.error('Debit eligibility check error:', error);
    return res.status(500).json({ error: 'Failed to verify account status' });
  }
};

export default { checkPNDStatus, checkSuspendedStatus, checkDebitEligibility };
