import express from 'express';
import { generateToken } from '../utils/jwt.js';
import { verifyAuth } from '../middleware/auth.js';
import { getAuditLogs, getAuditStats } from '../services/auditService.js';
import prisma from '../config/prisma.js';
import { upload } from '../middleware/upload.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const router = express.Router();

/**
 * Middleware to verify admin access
 */
const verifyAdmin = async (req, res, next) => {
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

const normalizeMoneyValue = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object' && typeof value.toString === 'function') {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getDefaultSpendingAccount = async (userId) => {
  const checkingAccount = await prisma.account.findFirst({
    where: { userId, accountType: 'CHECKING', isActive: true },
    orderBy: { createdAt: 'asc' }
  });
  if (checkingAccount) {
    return checkingAccount;
  }

  const primaryAccount = await prisma.account.findFirst({
    where: { userId, isPrimary: true, isActive: true },
    orderBy: { createdAt: 'asc' }
  });
  if (primaryAccount) {
    return primaryAccount;
  }

  return prisma.account.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'asc' }
  });
};

const promoteDefaultSpendingAccount = async (userId) => {
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' }
  });

  if (!accounts.length) return null;

  const activeAccounts = accounts.filter(acc => acc.isActive);
  const candidate =
    activeAccounts.find(acc => acc.accountType === 'CHECKING') ||
    activeAccounts.find(acc => acc.isPrimary) ||
    activeAccounts[0] ||
    accounts[0];

  if (!candidate) return null;

  await prisma.account.updateMany({
    where: { userId, id: { not: candidate.id } },
    data: { isPrimary: false }
  });

  await prisma.account.update({
    where: { id: candidate.id },
    data: { isPrimary: true }
  });

  return candidate;
};

// Get admin dashboard stats
// GET /api/v1/mybanker/stats
router.get('/stats', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const [totalUsers, pendingKYC, activeAccounts, recentAudits] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { kycStatus: 'PENDING' } }),
      prisma.user.count({ where: { accountStatus: 'ACTIVE' } }),
      prisma.auditLog.count({
        where: {
          action: { in: ['FAILED_LOGIN', 'SUSPICIOUS_ACTIVITY'] },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        }
      })
    ]);

    return res.json({
      totalUsers,
      pendingKYC,
      activeAccounts,
      securityAlerts: recentAudits
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Create new user (Admin only)
// POST /api/v1/mybanker/users
// or /api/v1/mybanker/users/create
const createUserHandler = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address = '',
      city = '',
      state = '',
      zipCode = '',
      country = '',
      password,
      accountType = 'SAVINGS',
      initialBalance = 0,
      setAsActive = true,
      securityQuestions = [],
      isAdmin = false
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate unique account number (00 + 10 random digits)
    let accountNumber;
    let isUnique = false;
    while (!isUnique) {
      const randomDigits = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
      accountNumber = `00${randomDigits}`;
      const existing = await prisma.user.findUnique({ where: { accountNumber } });
      if (!existing) isUnique = true;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with all details
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address,
        city,
        state,
        zipCode,
        country,
        accountNumber,
        isAdmin: !!isAdmin,
        accountStatus: setAsActive ? 'ACTIVE' : 'LIMITED',
        kycStatus: setAsActive ? 'VERIFIED' : 'NOT_SUBMITTED'
      }
    });

    // Create primary account
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        accountType: accountType.toUpperCase(),
        accountNumber, // Use same account number for primary account
        balance: parseFloat(initialBalance) || 0,
        availableBalance: parseFloat(initialBalance) || 0,
        isPrimary: true,
        isActive: true,
        currency: 'USD'
      }
    });

    // Create security questions if provided
    if (securityQuestions && Array.isArray(securityQuestions)) {
      for (const sq of securityQuestions) {
        if (sq.question && sq.answer) {
          const answerHash = await bcrypt.hash(sq.answer.toLowerCase(), 10);
          await prisma.securityQuestion.create({
            data: {
              userId: user.id,
              question: sq.question,
              answerHash
            }
          });
        }
      }
    }

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 5; i++) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = await bcrypt.hash(code, 10);
      await prisma.backupCode.create({
        data: {
          userId: user.id,
          codeHash
        }
      });
      backupCodes.push(code);
    }

    // Create initial transaction if balance > 0
    if (parseFloat(initialBalance) > 0) {
      await prisma.transaction.create({
        data: {
          accountId: account.id,
          amount: parseFloat(initialBalance),
          type: 'CREDIT',
          description: 'Initial deposit by admin',
          status: 'COMPLETED',
          reference: `INIT-${Date.now()}`
        }
      });
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id, // Target user
        action: 'CREATE_USER',
        description: `Admin created new user: ${email}`,
        severity: 'MEDIUM',
        ipAddress: req.ip || '127.0.0.1',
        metadata: {
          newUserId: user.id,
          accountNumber,
          accountType,
          initialBalance
        }
      }
    });

    return res.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accountNumber: user.accountNumber,
        accountStatus: user.accountStatus,
        kycStatus: user.kycStatus
      },
      backupCodes // Return backup codes to admin
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
};

router.post('/users', verifyAuth, verifyAdmin, createUserHandler);
router.post('/users/create', verifyAuth, verifyAdmin, createUserHandler);

// Get all users
// GET /api/v1/mybanker/users
router.get('/users', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, kycStatus, accountStatus } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (kycStatus) {
      where.kycStatus = kycStatus;
    }

    if (accountStatus) {
      where.accountStatus = accountStatus;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          accountNumber: true,
          profilePhoto: true,
          accountStatus: true,
          kycStatus: true,
          totalSentAmount: true,
          createdAt: true,
          accounts: {
            select: {
              id: true,
              accountNumber: true,
              accountName: true,
              accountType: true,
              balance: true,
              availableBalance: true,
              pendingBalance: true,
              isPrimary: true,
              isActive: true,
              currency: true,
              cryptoSymbol: true,
              cryptoAddress: true
            }
          },
          debitCards: {
            select: { id: true }
          },
          creditCards: {
            select: { id: true }
          },
          _count: {
            select: {
              accounts: true,
              backupCodes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ]);

    // Format users with balance from primary account and include all accounts
    const formattedUsers = users.map(user => {
      // Sort accounts with primary first
      const userAccounts = user.accounts || [];
      const sortedAccounts = [...userAccounts].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
      const primaryAccount = sortedAccounts.find(acc => acc.isPrimary);
      const totalBalance = userAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
      
      return {
        ...user,
        accounts: sortedAccounts,
        balance: totalBalance,
        primaryBalance: primaryAccount?.balance || 0,
        accountType: primaryAccount?.accountType || 'N/A',
        accountsCount: userAccounts.length,
        cardsCount: ((user.debitCards || []).length) + ((user.creditCards || []).length),
        debitCards: undefined,
        creditCards: undefined
      };
    });

    return res.json({
      users: formattedUsers,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user details
// GET /api/v1/mybanker/users/:userId
router.get('/users/:userId', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching user details for:', userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          select: {
            id: true,
            balance: true,
            availableBalance: true,
            pendingBalance: true,
            accountType: true,
            accountNumber: true,
            accountName: true,
            isPrimary: true,
            isActive: true,
            currency: true,
            cryptoSymbol: true,
            cryptoAddress: true
          }
        },
        securityQuestions: {
          select: {
            question: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            backupCodes: true
          }
        }
      }
    });

    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User found:', user.email, 'Accounts:', user.accounts.length);

    // Format response
    const formattedUser = {
      ...user,
      balance: user.accounts[0]?.balance || 0,
      accountType: user.accounts[0]?.accountType || 'N/A',
      accountNumber: user.accounts[0]?.accountNumber || 'N/A',
      password: undefined, // Never send password
      hashedPassword: undefined
    };

    return res.json({ success: true, user: formattedUser });
  } catch (error) {
    console.error('Get user details error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: 'Failed to fetch user details', details: error.message });
  }
});

// Get user transactions
// GET /api/v1/mybanker/users/:userId/transactions
router.get('/users/:userId/transactions', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const where = { userId };
    
    if (req.query.type) where.type = req.query.type;
    if (req.query.category) where.category = req.query.category;
    if (req.query.startDate || req.query.endDate) {
      where.createdAt = {};
      if (req.query.startDate) where.createdAt.gte = new Date(req.query.startDate).toISOString();
      if (req.query.endDate) where.createdAt.lte = new Date(req.query.endDate).toISOString();
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum
      }),
      prisma.transaction.count({ where })
    ]);

    return res.json({ 
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get user backup codes (decrypted for admin view)
// GET /api/v1/mybanker/users/:userId/backup-codes
router.get('/users/:userId/backup-codes', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const backupCodes = await prisma.backupCode.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    // For security, we can't decrypt the codes, but we can show which are used
    const codes = backupCodes.map((bc, idx) => ({
      id: bc.id,
      code: `******${idx + 1}`, // Masked - codes are hashed and can't be retrieved
      used: bc.used,
      usedAt: bc.usedAt,
      usedFor: bc.usedFor
    }));

    return res.json({ codes });
  } catch (error) {
    console.error('Get backup codes error:', error);
    return res.status(500).json({ error: 'Failed to fetch backup codes' });
  }
});

// Regenerate backup codes for user
// POST /api/v1/mybanker/users/:userId/regenerate-backup-codes
router.post('/users/:userId/regenerate-backup-codes', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { count = 50 } = req.body; // Default to 50 codes, admin can specify custom amount

    // Validate count (must be between 1 and 100)
    const codeCount = Math.min(Math.max(parseInt(count) || 50, 1), 100);

    // Delete existing backup codes
    await prisma.backupCode.deleteMany({
      where: { userId }
    });

    // Generate new backup codes
    const newCodes = [];
    for (let i = 0; i < codeCount; i++) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = await bcrypt.hash(code, 10);
      await prisma.backupCode.create({
        data: {
          userId,
          codeHash
        }
      });
      newCodes.push({ code, used: false });
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'REGENERATE_BACKUP_CODES',
        description: `Admin regenerated ${codeCount} backup codes for user ${userId}`,
        severity: 'HIGH',
        ipAddress: req.ip
      }
    });

    return res.json({ 
      success: true, 
      message: `${codeCount} backup codes regenerated successfully`,
      codes: newCodes,
      count: codeCount
    });
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    return res.status(500).json({ error: 'Failed to regenerate backup codes' });
  }
});

// Update user status
// PUT /api/v1/mybanker/users/:userId/status
// Supports: LIMITED, ACTIVE, PND (Pending No Debit), SUSPENDED (Complete lockout)
router.put('/users/:userId/status', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { accountStatus, suspensionReason } = req.body;

    // Validate status
    const validStatuses = ['LIMITED', 'ACTIVE', 'PND', 'SUSPENDED'];
    if (!validStatuses.includes(accountStatus)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: LIMITED, ACTIVE, PND, SUSPENDED' 
      });
    }

    const updateData = { accountStatus };
    
    // Add suspension reason for PND or SUSPENDED
    if (accountStatus === 'PND' || accountStatus === 'SUSPENDED') {
      updateData.suspensionReason = suspensionReason || (
        accountStatus === 'PND' 
          ? 'Account under review - debit transactions restricted'
          : 'Account suspended - physical verification required'
      );
    } else {
      // Clear suspension reason when activating
      updateData.suspensionReason = null;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accountStatus: true,
        suspensionReason: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'USER_STATUS_CHANGE',
        description: `Changed user ${user.email} status to ${accountStatus}${suspensionReason ? `: ${suspensionReason}` : ''}`,
        severity: accountStatus === 'SUSPENDED' ? 'HIGH' : 'MEDIUM',
        ipAddress: req.ip
      }
    });

    // Create notification for user
    let notificationMessage = '';
    switch (accountStatus) {
      case 'ACTIVE':
        notificationMessage = 'Your account has been fully activated. All features are now available.';
        break;
      case 'LIMITED':
        notificationMessage = 'Your account has been set to limited status. Some features may be restricted.';
        break;
      case 'PND':
        notificationMessage = 'Your account is under review. Debit transactions are temporarily restricted. You can still receive funds. Please contact your account manager for assistance.';
        break;
      case 'SUSPENDED':
        notificationMessage = 'Your account has been suspended. Please visit your nearest Gatwick Bank branch with valid identification to restore access.';
        break;
    }

    await prisma.notification.create({
      data: {
        userId,
        type: 'account',
        title: `Account Status: ${accountStatus}`,
        message: notificationMessage,
        metadata: { 
          accountStatus, 
          suspensionReason: updateData.suspensionReason 
        }
      }
    });

    return res.json({ 
      success: true,
      user, 
      message: `User status updated to ${accountStatus}` 
    });
  } catch (error) {
    console.error('Update user status error:', error);
    return res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Credit or Debit money to/from user account
// POST /api/v1/mybanker/users/:userId/credit-debit
router.post('/users/:userId/credit-debit', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, amount, description, accountId } = req.body;

    if (!['CREDIT', 'DEBIT'].includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    const amountValue = normalizeMoneyValue(amount);
    if (amountValue <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    let account;
    if (accountId) {
      account = await prisma.account.findFirst({
        where: { id: accountId, userId }
      });
    } else {
      account = await getDefaultSpendingAccount(userId);
    }

    if (!account) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const currentBalance = normalizeMoneyValue(account.balance);

    // For admin operations, we check against balance (not availableBalance) since admin has full control
    if (type === 'DEBIT' && currentBalance < amountValue) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        accountId: account.id,
        amount: amountValue,
        type,
        description: description || `Admin ${type.toLowerCase()} adjustment`,
        status: 'COMPLETED'
      }
    });

    const newBalance = type === 'CREDIT' ? currentBalance + amountValue : currentBalance - amountValue;
    
    // Admin operations are immediate - availableBalance should EQUAL balance (no pending)
    // pendingBalance stays at 0 for admin operations
    await prisma.account.update({
      where: { id: account.id },
      data: { 
        balance: newBalance, 
        availableBalance: newBalance,  // Sync available to match balance
        pendingBalance: 0              // Clear any pending since admin action is final
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: `ADMIN_${type}`,
        description: `Admin ${type.toLowerCase()}ed $${amountValue} ${type === 'CREDIT' ? 'to' : 'from'} user account`,
        severity: 'HIGH',
        ipAddress: req.ip,
        metadata: {
          targetUserId: userId,
          amount: amountValue,
          transactionId: transaction.id,
          description
        }
      }
    });

    return res.json({
      message: `Successfully ${type.toLowerCase()}ed $${amountValue}`,
      transaction,
      newBalance,
      availableBalance: newBalance  // Admin ops sync available with balance
    });
  } catch (error) {
    console.error('Credit/Debit error:', error);
    return res.status(500).json({ error: 'Failed to process transaction' });
  }
});

// Admin Transfer - Move money between any accounts (same user or different users)
// POST /api/v1/mybanker/admin-transfer
router.post('/admin-transfer', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, description } = req.body;

    if (!fromAccountId || !toAccountId) {
      return res.status(400).json({ error: 'Source and destination accounts are required' });
    }

    if (fromAccountId === toAccountId) {
      return res.status(400).json({ error: 'Source and destination accounts must be different' });
    }

    const amountValue = normalizeMoneyValue(amount);
    if (amountValue <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Get source account
    const fromAccount = await prisma.account.findUnique({
      where: { id: fromAccountId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } }
    });

    if (!fromAccount) {
      return res.status(404).json({ error: 'Source account not found' });
    }

    // Get destination account
    const toAccount = await prisma.account.findUnique({
      where: { id: toAccountId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } }
    });

    if (!toAccount) {
      return res.status(404).json({ error: 'Destination account not found' });
    }

    const fromBalance = normalizeMoneyValue(fromAccount.balance);

    if (fromBalance < amountValue) {
      return res.status(400).json({ error: 'Insufficient balance in source account' });
    }

    // Perform the transfer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Debit from source account
      const debitTransaction = await tx.transaction.create({
        data: {
          userId: fromAccount.userId,
          accountId: fromAccountId,
          amount: amountValue,
          type: 'DEBIT',
          description: description || `Admin transfer to ${toAccount.user.firstName} ${toAccount.user.lastName} (${toAccount.accountNumber})`,
          status: 'COMPLETED'
        }
      });

      const newFromBalance = fromBalance - amountValue;
      await tx.account.update({
        where: { id: fromAccountId },
        data: { 
          balance: newFromBalance, 
          availableBalance: newFromBalance,
          pendingBalance: 0
        }
      });

      // Credit to destination account
      const toBalance = normalizeMoneyValue(toAccount.balance);
      const creditTransaction = await tx.transaction.create({
        data: {
          userId: toAccount.userId,
          accountId: toAccountId,
          amount: amountValue,
          type: 'CREDIT',
          description: description || `Admin transfer from ${fromAccount.user.firstName} ${fromAccount.user.lastName} (${fromAccount.accountNumber})`,
          status: 'COMPLETED'
        }
      });

      const newToBalance = toBalance + amountValue;
      await tx.account.update({
        where: { id: toAccountId },
        data: { 
          balance: newToBalance, 
          availableBalance: newToBalance,
          pendingBalance: 0
        }
      });

      return { debitTransaction, creditTransaction, newFromBalance, newToBalance };
    });

    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'ADMIN_TRANSFER',
        description: `Admin transferred $${amountValue} from ${fromAccount.user.email} to ${toAccount.user.email}`,
        severity: 'HIGH',
        ipAddress: req.ip,
        metadata: {
          fromAccountId,
          toAccountId,
          fromUserId: fromAccount.userId,
          toUserId: toAccount.userId,
          amount: amountValue,
          description
        }
      }
    });

    return res.json({
      success: true,
      message: `Successfully transferred $${amountValue}`,
      fromAccount: {
        id: fromAccountId,
        accountNumber: fromAccount.accountNumber,
        newBalance: result.newFromBalance,
        user: `${fromAccount.user.firstName} ${fromAccount.user.lastName}`
      },
      toAccount: {
        id: toAccountId,
        accountNumber: toAccount.accountNumber,
        newBalance: result.newToBalance,
        user: `${toAccount.user.firstName} ${toAccount.user.lastName}`
      }
    });
  } catch (error) {
    console.error('Admin transfer error:', error);
    return res.status(500).json({ error: 'Failed to process transfer' });
  }
});

// Get all accounts for admin transfer dropdown
// GET /api/v1/mybanker/all-accounts
router.get('/all-accounts', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: [
        { user: { lastName: 'asc' } },
        { accountNumber: 'asc' }
      ]
    });

    return res.json({
      success: true,
      accounts: accounts.map(acc => ({
        id: acc.id,
        accountNumber: acc.accountNumber,
        accountType: acc.accountType,
        balance: normalizeMoneyValue(acc.balance),
        userId: acc.userId,
        userName: `${acc.user.firstName} ${acc.user.lastName}`,
        userEmail: acc.user.email
      }))
    });
  } catch (error) {
    console.error('Get all accounts error:', error);
    return res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Update user (Admin only)
// PUT /api/v1/mybanker/users/:userId
router.put('/users/:userId', verifyAuth, verifyAdmin, upload.single('profilePhoto'), async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      city,
      state,
      zipCode,
      country,
      accountStatus,
      kycStatus,
      accountType,
      loginPreference,
      isAdmin,
      newPassword,
      securityQuestions
    } = req.body;

    // Build update data
    const updateData = {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      address,
      city,
      state,
      zipCode,
      country,
      accountStatus,
      kycStatus,
      loginPreference,
      isAdmin: isAdmin === 'true' || isAdmin === true
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === '') {
        delete updateData[key];
      }
    });

    // Handle profile photo upload
    if (req.file) {
      try {
        const fileBuffer = await fs.promises.readFile(req.file.path);
        const mimeType = req.file.mimetype || 'image/jpeg';
        const base64Data = fileBuffer.toString('base64');
        updateData.profilePhoto = `data:${mimeType};base64,${base64Data}`;

        // Remove the physical file since we store the base64 representation
        await fs.promises.unlink(req.file.path).catch(() => {});
      } catch (fileError) {
        console.error('Profile photo conversion error:', fileError);
        return res.status(500).json({ error: 'Failed to process profile photo' });
      }
    }

    // Handle password update
    if (newPassword && newPassword.trim()) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Update account type if provided
    if (accountType) {
      await prisma.account.updateMany({
        where: {
          userId,
          isPrimary: true
        },
        data: {
          accountType
        }
      });
    }

    // Update security questions if provided
    if (securityQuestions) {
      const questions = JSON.parse(securityQuestions);
      
      if (questions.length > 0) {
        // Delete existing security questions
        await prisma.securityQuestion.deleteMany({
          where: { userId }
        });

        // Create new security questions
        for (const sq of questions) {
          const answerHash = await bcrypt.hash(sq.answer.toLowerCase(), 10);
          await prisma.securityQuestion.create({
            data: {
              userId,
              question: sq.question,
              answerHash
            }
          });
        }
      }
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_USER',
        description: `Admin updated user: ${email}`,
        severity: 'MEDIUM',
        ipAddress: req.ip,
        metadata: {
          targetUserId: userId,
          updatedFields: Object.keys(updateData)
        }
      }
    });

    return res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accountStatus: user.accountStatus,
        kycStatus: user.kycStatus
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
// DELETE /api/v1/mybanker/users/:userId
router.delete('/users/:userId', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.user.delete({
      where: { id: userId }
    });

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get pending KYC submissions
// GET /api/v1/mybanker/kyc/pending
router.get('/kyc/pending', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const submissions = await prisma.kYCDocument.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            accountNumber: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ submissions });
  } catch (error) {
    console.error('Get KYC submissions error:', error);
    return res.status(500).json({ error: 'Failed to fetch KYC submissions' });
  }
});

// Approve KYC
// PUT /api/v1/mybanker/kyc/:kycId/approve
router.put('/kyc/:kycId/approve', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { kycId } = req.params;

    const kyc = await prisma.kYCDocument.update({
      where: { id: kycId },
      data: { 
        status: 'VERIFIED',
        verifiedAt: new Date()
      }
    });

    // Update user KYC status
    await prisma.user.update({
      where: { id: kyc.userId },
      data: { kycStatus: 'VERIFIED' }
    });

    return res.json({ message: 'KYC approved successfully' });
  } catch (error) {
    console.error('Approve KYC error:', error);
    return res.status(500).json({ error: 'Failed to approve KYC' });
  }
});

// Reject KYC
// PUT /api/v1/mybanker/kyc/:kycId/reject
router.put('/kyc/:kycId/reject', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { kycId } = req.params;
    const { reason } = req.body;

    const kyc = await prisma.kYCDocument.update({
      where: { id: kycId },
      data: { 
        status: 'REJECTED',
        rejectionReason: reason
      }
    });

    // Update user KYC status
    await prisma.user.update({
      where: { id: kyc.userId },
      data: { kycStatus: 'REJECTED' }
    });

    return res.json({ message: 'KYC rejected successfully' });
  } catch (error) {
    console.error('Reject KYC error:', error);
    return res.status(500).json({ error: 'Failed to reject KYC' });
  }
});

// Get all transactions
// GET /api/v1/mybanker/transactions
router.get('/transactions', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { type, status, dateRange } = req.query;

    const where = {};
    
    if (type && type !== 'all') {
      where.type = type;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }

    // Date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case '7days':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case '30days':
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        case '90days':
          startDate = new Date(now.setDate(now.getDate() - 90));
          break;
      }
      
      if (startDate) {
        where.createdAt = { gte: startDate };
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            accountNumber: true,
            accountName: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get global activity feed (from fast ledger cache)
router.get('/activity', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const ledgerPath = path.join(process.cwd(), 'backend/data/global_ledger.json');
    if (!fs.existsSync(ledgerPath)) {
      return res.json({ success: true, transactions: [] });
    }
    const transactions = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Activity feed error:', error);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

// Create manual transaction (Admin only)
// POST /api/v1/mybanker/transactions
router.post('/transactions', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { accountId, type, amount, description, status = 'COMPLETED' } = req.body;

    if (!accountId || !type || !amount) {
      return res.status(400).json({ error: 'Account ID, type, and amount are required' });
    }

    // Verify account exists
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } }
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Generate reference
    const reference = `ADM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        accountId,
        type: type.toUpperCase(),
        amount: parseFloat(amount),
        description: description || `Admin manual ${type.toLowerCase()}`,
        reference,
        status: status.toUpperCase()
      }
    });

    // Update account balance if transaction is completed
    if (status.toUpperCase() === 'COMPLETED') {
      const newBalance = type.toUpperCase() === 'CREDIT' 
        ? parseFloat(account.balance) + parseFloat(amount)
        : parseFloat(account.balance) - parseFloat(amount);

      await prisma.account.update({
        where: { id: accountId },
        data: { 
          balance: newBalance,
          availableBalance: newBalance
        }
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: account.user.id,
        action: 'ADMIN_TRANSACTION_CREATED',
        details: `Admin created ${type} transaction of $${amount} for ${account.user.email}`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    });

    return res.json({ 
      success: true, 
      message: 'Transaction created successfully',
      transaction 
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    return res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update transaction (Admin only)
// PUT /api/v1/mybanker/transactions/:transactionId
router.put('/transactions/:transactionId', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { type, amount, description, status, category, createdAt, merchantLogo } = req.body;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { 
        account: { 
          include: { user: { select: { id: true, email: true } } } 
        } 
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const updateData = {};
    if (type) updateData.type = type.toUpperCase();
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (description) updateData.description = description;
    if (status) updateData.status = status.toUpperCase();
    if (category) updateData.category = category.toUpperCase();
    if (createdAt) updateData.createdAt = new Date(createdAt);
    // merchantLogo will be added after schema migration runs
    // if (merchantLogo !== undefined) updateData.merchantLogo = merchantLogo;

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData
    });

    // Create audit log - use userId from transaction directly if available, otherwise from account
    const auditUserId = transaction.userId || transaction.account?.user?.id || transaction.account?.userId;
    if (auditUserId) {
      try {
        await prisma.auditLog.create({
          data: {
            user: { connect: { id: auditUserId } },
            action: 'ADMIN_TRANSACTION_UPDATED',
            details: `Admin updated transaction ${transactionId}`,
            ipAddress: req.ip || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown'
          }
        });
      } catch (auditError) {
        console.error('Audit log creation failed (non-critical):', auditError.message);
        // Don't fail the transaction update if audit log fails
      }
    }

    return res.json({ 
      success: true, 
      message: 'Transaction updated successfully',
      transaction: updatedTransaction 
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    return res.status(500).json({ error: 'Failed to update transaction', details: error.message });
  }
});

// Delete transaction (Admin only)
// DELETE /api/v1/mybanker/transactions/:transactionId
router.delete('/transactions/:transactionId', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { 
        account: { 
          include: { user: { select: { id: true, email: true } } } 
        } 
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await prisma.transaction.delete({
      where: { id: transactionId }
    });

    // Create audit log - use userId from transaction directly if available, otherwise from account
    const auditUserId = transaction.userId || transaction.account?.user?.id || transaction.account?.userId;
    if (auditUserId) {
      try {
        await prisma.auditLog.create({
          data: {
            user: { connect: { id: auditUserId } },
            action: 'ADMIN_TRANSACTION_DELETED',
            details: `Admin deleted transaction ${transactionId} (${transaction.type} $${transaction.amount})`,
            ipAddress: req.ip || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown'
          }
        });
      } catch (auditError) {
        console.error('Audit log creation failed (non-critical):', auditError.message);
        // Don't fail the transaction delete if audit log fails
      }
    }

    return res.json({ 
      success: true, 
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Get all users with transaction counts (for admin transaction management)
// GET /api/v1/mybanker/users-with-transactions
router.get('/users-with-transactions', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePhoto: true,
        accountStatus: true,
        accounts: {
          select: {
            id: true,
            accountNumber: true,
            accountName: true,
            balance: true,
            _count: {
              select: { transactions: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const usersWithCounts = users.map(user => ({
      ...user,
      totalTransactions: user.accounts.reduce((sum, acc) => sum + acc._count.transactions, 0),
      totalBalance: user.accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)
    }));

    return res.json({ users: usersWithCounts });
  } catch (error) {
    console.error('Get users with transactions error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get transactions for a specific user
// GET /api/v1/mybanker/users/:userId/transactions
router.get('/users/:userId/transactions', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, category, startDate, endDate, page = 1, limit = 100 } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accounts: { select: { id: true } }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const accountIds = user.accounts.map(a => a.id);

    const where = {
      accountId: { in: accountIds }
    };

    if (type && type !== 'all') {
      where.type = type.toUpperCase();
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          account: {
            select: {
              accountNumber: true,
              accountName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.transaction.count({ where })
    ]);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create transaction for a specific user (enhanced)
// POST /api/v1/mybanker/users/:userId/transactions
router.post('/users/:userId/transactions', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      type, 
      amount, 
      description, 
      category,
      merchantKey,
      merchantLogo,
      status = 'COMPLETED',
      createdAt, // Allow backdating transactions
      accountId // Allow specifying which account
    } = req.body;

    if (!type || !amount) {
      return res.status(400).json({ error: 'Type and amount are required' });
    }

    let account;
    
    if (accountId) {
      // Use specified account
      account = await prisma.account.findFirst({
        where: { 
          id: accountId,
          userId: userId
        }
      });
      if (!account) {
        return res.status(404).json({ error: 'Account not found or does not belong to this user' });
      }
    } else {
      // Fall back to primary account
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          accounts: {
            where: { isPrimary: true },
            take: 1
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      account = user.accounts[0];
      if (!account) {
        return res.status(400).json({ error: 'User has no primary account' });
      }
    }

    const reference = `ADM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const txAmount = parseFloat(amount);
    const newBalance = type.toUpperCase() === 'CREDIT' 
      ? parseFloat(account.balance) + txAmount
      : parseFloat(account.balance) - txAmount;

    const transaction = await prisma.transaction.create({
      data: {
        accountId: account.id,
        type: type.toUpperCase(),
        amount: txAmount,
        description: description || `Admin ${type.toLowerCase()} transaction`,
        category: category || 'OTHER',
        merchantName: description,
        reference,
        status: status.toUpperCase(),
        createdAt: createdAt ? new Date(createdAt) : new Date()
      }
    });

    // Update account balance if completed
    if (status.toUpperCase() === 'COMPLETED') {
      await prisma.account.update({
        where: { id: account.id },
        data: { 
          balance: newBalance,
          availableBalance: newBalance
        }
      });
    }

    // Audit log (non-critical)
    try {
      await prisma.auditLog.create({
        data: {
          user: { connect: { id: userId } },
          action: 'ADMIN_TRANSACTION_CREATED',
          details: `Admin created ${type} transaction of $${amount}`,
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      });
    } catch (auditError) {
      console.error('Audit log creation failed (non-critical):', auditError.message);
    }

    return res.json({ 
      success: true, 
      message: 'Transaction created successfully',
      transaction 
    });
  } catch (error) {
    console.error('Create user transaction error:', error);
    return res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Bulk create transactions (for recurring payments backdating)
// POST /api/v1/mybanker/users/:userId/transactions/bulk
router.post('/users/:userId/transactions/bulk', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'Transactions array is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          where: { isPrimary: true },
          take: 1
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const account = user.accounts[0];
    if (!account) {
      return res.status(400).json({ error: 'User has no primary account' });
    }

    let currentBalance = parseFloat(account.balance);
    const createdTransactions = [];

    // Sort transactions by date (oldest first) to calculate balances correctly
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.createdAt || Date.now()) - new Date(b.createdAt || Date.now())
    );

    for (const tx of sortedTransactions) {
      const txAmount = parseFloat(tx.amount);
      const newBalance = tx.type.toUpperCase() === 'CREDIT' 
        ? currentBalance + txAmount
        : currentBalance - txAmount;

      const reference = `ADM-BULK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const transaction = await prisma.transaction.create({
        data: {
          accountId: account.id,
          type: tx.type.toUpperCase(),
          amount: txAmount,
          description: tx.description || `Admin bulk ${tx.type.toLowerCase()}`,
          category: tx.category || 'OTHER',
          merchantName: tx.description,
          reference,
          status: 'COMPLETED',
          createdAt: tx.createdAt ? new Date(tx.createdAt) : new Date()
        }
      });

      currentBalance = newBalance;
      createdTransactions.push(transaction);
    }

    // Update final account balance
    await prisma.account.update({
      where: { id: account.id },
      data: { 
        balance: currentBalance,
        availableBalance: currentBalance
      }
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          user: { connect: { id: user.id } },
          action: 'ADMIN_BULK_TRANSACTIONS_CREATED',
          details: `Admin created ${createdTransactions.length} bulk transactions for ${user.email}`,
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      });
    } catch (auditError) {
      console.error('Audit log creation failed (non-critical):', auditError.message);
    }

    return res.json({ 
      success: true, 
      message: `${createdTransactions.length} transactions created successfully`,
      transactions: createdTransactions,
      newBalance: currentBalance
    });
  } catch (error) {
    console.error('Bulk create transactions error:', error);
    return res.status(500).json({ error: 'Failed to create bulk transactions' });
  }
});

// Bulk delete transactions
// DELETE /api/v1/mybanker/transactions/bulk
router.delete('/transactions/bulk', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { transactionIds } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({ error: 'Transaction IDs array is required' });
    }

    // Get transactions to calculate balance adjustments
    const transactions = await prisma.transaction.findMany({
      where: { id: { in: transactionIds } },
      include: {
        account: {
          include: { user: { select: { id: true, email: true } } }
        }
      }
    });

    // Group by account for balance recalculation
    const accountAdjustments = {};
    for (const tx of transactions) {
      if (!accountAdjustments[tx.accountId]) {
        accountAdjustments[tx.accountId] = {
          account: tx.account,
          adjustment: 0
        };
      }
      // Reverse the transaction effect
      if (tx.type === 'CREDIT') {
        accountAdjustments[tx.accountId].adjustment -= parseFloat(tx.amount);
      } else {
        accountAdjustments[tx.accountId].adjustment += parseFloat(tx.amount);
      }
    }

    // Delete transactions
    await prisma.transaction.deleteMany({
      where: { id: { in: transactionIds } }
    });

    // Update account balances
    for (const [accountId, data] of Object.entries(accountAdjustments)) {
      const newBalance = parseFloat(data.account.balance) + data.adjustment;
      await prisma.account.update({
        where: { id: accountId },
        data: { 
          balance: newBalance,
          availableBalance: newBalance
        }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: data.account.user.id,
          action: 'ADMIN_BULK_TRANSACTIONS_DELETED',
          details: `Admin deleted ${transactions.filter(t => t.accountId === accountId).length} transactions`,
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      });
    }

    return res.json({ 
      success: true, 
      message: `${transactionIds.length} transactions deleted successfully`
    });
  } catch (error) {
    console.error('Bulk delete transactions error:', error);
    return res.status(500).json({ error: 'Failed to delete transactions' });
  }
});

// Get merchant logos list
// GET /api/v1/mybanker/merchant-logos
router.get('/merchant-logos', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { getMerchantList, CATEGORY_ICONS } = await import('../config/merchantLogos.js');
    return res.json({ 
      merchants: getMerchantList(),
      categoryIcons: CATEGORY_ICONS
    });
  } catch (error) {
    console.error('Get merchant logos error:', error);
    return res.status(500).json({ error: 'Failed to fetch merchant logos' });
  }
});

// Export transactions as CSV
// GET /api/v1/mybanker/users/:userId/transactions/export
router.get('/users/:userId/transactions/export', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { format = 'csv', startDate, endDate } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: { select: { id: true } }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const accountIds = user.accounts.map(a => a.id);

    const where = {
      accountId: { in: accountIds }
    };

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: { accountNumber: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'csv') {
      const csvHeader = 'Date,Type,Description,Category,Amount,Balance After,Status,Reference,Account\n';
      const csvRows = transactions.map(tx => 
        `"${new Date(tx.createdAt).toISOString()}","${tx.type}","${(tx.description || '').replace(/"/g, '""')}","${tx.category || ''}","${tx.amount}","${tx.balanceAfter || ''}","${tx.status}","${tx.reference || ''}","${tx.account.accountNumber}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="transactions_${userId}_${Date.now()}.csv"`);
      return res.send(csvHeader + csvRows);
    }

    return res.json({ transactions });
  } catch (error) {
    console.error('Export transactions error:', error);
    return res.status(500).json({ error: 'Failed to export transactions' });
  }
});

// Get audit logs
// GET /api/v1/mybanker/audit-logs
router.get('/audit-logs', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { action, severity } = req.query;

    const where = {};
    
    if (action && action !== 'all') {
      where.action = action;
    }
    
    if (severity && severity !== 'all') {
      where.severity = severity;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return res.json({ logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get audit statistics
// GET /api/v1/admin/audit-stats
router.get('/audit-stats', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await getAuditStats(startDate, endDate);
    return res.json(stats);
  } catch (error) {
    console.error('Get audit stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Download backup codes PDF for a user
// GET /api/v1/admin/users/:userId/backup-codes
router.get('/users/:userId/backup-codes', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const pdfPath = `/app/storage/backup-codes/user_${userId}/gatwick-backup-codes-${user.firstName}-${user.lastName}.pdf`;

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'Backup codes PDF not found' });
    }

    res.download(pdfPath, `backup-codes-${user.firstName}-${user.lastName}.pdf`);
  } catch (error) {
    console.error('Download backup codes error:', error);
    return res.status(500).json({ error: 'Failed to download backup codes' });
  }
});

// Get KYC submissions pending review
// GET /api/v1/admin/kyc/pending
router.get('/kyc/pending', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const pendingKYC = await prisma.kYCDocument.findMany({
      where: {
        status: { in: ['PENDING', 'UNDER_REVIEW'] }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return res.json({ submissions: pendingKYC });
  } catch (error) {
    console.error('Get pending KYC error:', error);
    return res.status(500).json({ error: 'Failed to fetch KYC submissions' });
  }
});

// Get KYC document details
// GET /api/v1/admin/kyc/:kycId
router.get('/kyc/:kycId', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { kycId } = req.params;

    const kyc = await prisma.kYCDocument.findUnique({
      where: { id: kycId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!kyc) {
      return res.status(404).json({ error: 'KYC document not found' });
    }

    return res.json({ kyc });
  } catch (error) {
    console.error('Get KYC details error:', error);
    return res.status(500).json({ error: 'Failed to fetch KYC details' });
  }
});

// Approve or reject KYC
// POST /api/v1/admin/kyc/:kycId/review
router.post('/kyc/:kycId/review', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { kycId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (status === 'REJECTED' && !rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const kyc = await prisma.kYCDocument.update({
      where: { id: kycId },
      data: {
        status,
        reviewedBy: req.user.userId,
        reviewedAt: new Date(),
        rejectionReason: status === 'REJECTED' ? rejectionReason : null
      },
      include: { user: true }
    });

    // Update user account status if approved
    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: kyc.userId },
        data: {
          kycStatus: 'APPROVED',
          accountStatus: 'ACTIVE'
        }
      });
    } else {
      await prisma.user.update({
        where: { id: kyc.userId },
        data: { kycStatus: 'REJECTED' }
      });
    }

    // Create notification
    const { notifyKYCStatus } = await import('../services/notificationService.js');
    await notifyKYCStatus(kyc.userId, status, rejectionReason);

    return res.json({
      message: `KYC ${status.toLowerCase()} successfully`,
      kyc
    });
  } catch (error) {
    console.error('Review KYC error:', error);
    return res.status(500).json({ error: 'Failed to review KYC' });
  }
});

// Get pending KYC users (users with PENDING status)
// GET /api/v1/mybanker/kyc/users/pending
router.get('/kyc/users/pending', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { kycStatus: 'PENDING' },
      include: {
        kycDocuments: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { kycSubmittedAt: 'asc' }
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      phoneCountryCode: user.phoneCountryCode,
      isBusinessAccount: user.isBusinessAccount,
      businessName: user.businessName,
      kycSubmittedAt: user.kycSubmittedAt,
      documentCount: user.kycDocuments.length,
      createdAt: user.createdAt
    }));

    return res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Get pending KYC users error:', error);
    return res.status(500).json({ error: 'Failed to fetch pending KYC users' });
  }
});

// Get user's KYC details and documents
// GET /api/v1/mybanker/kyc/users/:userId
router.get('/kyc/users/:userId', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        kycDocuments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Group documents by category
    const documentsByCategory = user.kycDocuments.reduce((acc, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = [];
      }
      acc[doc.category].push(doc);
      return acc;
    }, {});

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        phoneCountryCode: user.phoneCountryCode,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country,
        isBusinessAccount: user.isBusinessAccount,
        businessName: user.businessName,
        businessType: user.businessType,
        taxId: user.taxId,
        businessAddress: user.businessAddress,
        businessCity: user.businessCity,
        businessState: user.businessState,
        businessZip: user.businessZip,
        businessCountry: user.businessCountry,
        representativeName: user.representativeName,
        representativeTitle: user.representativeTitle,
        kycStatus: user.kycStatus,
        kycRejectionReason: user.kycRejectionReason,
        kycSubmittedAt: user.kycSubmittedAt,
        kycReviewedAt: user.kycReviewedAt,
        createdAt: user.createdAt
      },
      documents: documentsByCategory,
      totalDocuments: user.kycDocuments.length
    });
  } catch (error) {
    console.error('Get user KYC details error:', error);
    return res.status(500).json({ error: 'Failed to fetch KYC details' });
  }
});

// Approve user's KYC
// POST /api/v1/mybanker/kyc/users/:userId/approve
router.post('/kyc/users/:userId/approve', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    // Update user KYC status
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: 'VERIFIED',
        accountStatus: 'ACTIVE',
        kycReviewedAt: new Date(),
        kycReviewedBy: adminId,
        kycRejectionReason: null
      }
    });

    // Update all user's documents to VERIFIED
    await prisma.kYCDocument.updateMany({
      where: { userId },
      data: {
        status: 'VERIFIED',
        reviewNotes: 'Approved by admin'
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'kyc',
        title: 'KYC Verified!',
        message: 'Congratulations! Your KYC has been verified. You now have full access to all banking features.',
        metadata: {
          verifiedAt: new Date().toISOString(),
          verifiedBy: adminId
        }
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'APPROVE_KYC',
        description: `Admin approved KYC for user: ${user.email}`,
        severity: 'HIGH',
        ipAddress: req.ip,
        metadata: {
          targetUserId: userId,
          userEmail: user.email
        }
      }
    });

    return res.json({
      message: 'KYC approved successfully',
      user: {
        id: user.id,
        email: user.email,
        kycStatus: user.kycStatus,
        accountStatus: user.accountStatus
      }
    });
  } catch (error) {
    console.error('Approve KYC error:', error);
    return res.status(500).json({ error: 'Failed to approve KYC' });
  }
});

// Reject user's KYC
// POST /api/v1/mybanker/kyc/users/:userId/reject
router.post('/kyc/users/:userId/reject', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Update user KYC status
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: 'REJECTED',
        kycRejectionReason: reason,
        kycReviewedAt: new Date(),
        kycReviewedBy: adminId
      }
    });

    // Update all user's documents to REJECTED
    await prisma.kYCDocument.updateMany({
      where: { userId },
      data: {
        status: 'REJECTED',
        reviewNotes: reason
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'kyc',
        title: 'KYC Rejected',
        message: `Your KYC submission has been rejected. Reason: ${reason}. Please correct the issues and re-submit.`,
        metadata: {
          rejectedAt: new Date().toISOString(),
          reason
        }
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'REJECT_KYC',
        description: `Admin rejected KYC for user: ${user.email}`,
        severity: 'HIGH',
        ipAddress: req.ip,
        metadata: {
          targetUserId: userId,
          userEmail: user.email,
          reason
        }
      }
    });

    return res.json({
      message: 'KYC rejected successfully',
      user: {
        id: user.id,
        email: user.email,
        kycStatus: user.kycStatus,
        rejectionReason: user.kycRejectionReason
      }
    });
  } catch (error) {
    console.error('Reject KYC error:', error);
    return res.status(500).json({ error: 'Failed to reject KYC' });
  }
});

// Request additional documents
// POST /api/v1/mybanker/kyc/users/:userId/request-more
router.post('/kyc/users/:userId/request-more', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;
    const adminId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Request message is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'kyc',
        title: 'Additional Documents Requested',
        message: `Admin has requested additional documents: ${message}`,
        metadata: {
          requestedAt: new Date().toISOString(),
          requestMessage: message
        }
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'REQUEST_KYC_DOCUMENTS',
        description: `Admin requested additional KYC documents from user: ${user.email}`,
        severity: 'MEDIUM',
        ipAddress: req.ip,
        metadata: {
          targetUserId: userId,
          requestMessage: message
        }
      }
    });

    return res.json({
      message: 'Document request sent successfully'
    });
  } catch (error) {
    console.error('Request documents error:', error);
    return res.status(500).json({ error: 'Failed to request documents' });
  }
});

// Get dashboard statistics
// GET /api/v1/admin/stats
router.get('/stats', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      pendingKYC,
      totalTransactions,
      totalBalance
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { accountStatus: 'ACTIVE' } }),
      prisma.kYCDocument.count({ where: { status: 'PENDING' } }),
      prisma.transaction.count(),
      prisma.account.aggregate({
        _sum: { balance: true }
      })
    ]);

    return res.json({
      totalUsers,
      activeUsers,
      pendingKYC,
      totalTransactions,
      totalBalance: totalBalance._sum.balance || 0
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get backup codes for a user
// GET /api/v1/mybanker/users/:userId/backup-codes
router.get('/users/:userId/backup-codes', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const codes = await prisma.backupCode.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        used: true,
        usedAt: true,
        usedFor: true,
        createdAt: true
      }
    });

    // Don't return actual code hashes for security
    const sanitizedCodes = codes.map(code => ({
      id: code.id,
      code: code.used ? null : '******', // Hide code value, just show if used
      used: code.used,
      usedAt: code.usedAt,
      usedFor: code.usedFor,
      createdAt: code.createdAt
    }));

    return res.json({ codes: sanitizedCodes });
  } catch (error) {
    console.error('Get backup codes error:', error);
    return res.status(500).json({ error: 'Failed to fetch backup codes' });
  }
});

// Regenerate backup codes for a user
// POST /api/v1/mybanker/users/:userId/regenerate-backup-codes
router.post('/users/:userId/regenerate-backup-codes', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete all existing backup codes
    await prisma.backupCode.deleteMany({
      where: { userId }
    });

    // Generate 100 new backup codes
    const { regenerateBackupCodes } = await import('../services/securityService.js');
    const { codes } = await regenerateBackupCodes(userId);

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'REGENERATE_BACKUP_CODES',
        description: `Admin regenerated backup codes for user: ${user.email}`,
        severity: 'HIGH',
        ipAddress: req.ip,
        metadata: {
          targetUserId: userId,
          codesGenerated: codes.length
        }
      }
    });

    // Return the new codes (only for admin to download/send to user)
    const sanitizedCodes = codes.map((code, index) => ({
      id: `new-${index}`,
      code: code, // Return actual codes for download
      used: false,
      usedAt: null,
      createdAt: new Date()
    }));

    return res.json({
      message: 'Backup codes regenerated successfully',
      codes: sanitizedCodes
    });
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    return res.status(500).json({ error: 'Failed to regenerate backup codes' });
  }
});

// Create new user (simplified endpoint for Add New User form)
// POST /api/v1/mybanker/users/create
router.post('/users/create', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      password,
      isAdmin = false,
      accountStatus = 'LIMITED'
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate unique account number
    let accountNumber;
    let isUnique = false;
    while (!isUnique) {
      const randomDigits = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
      accountNumber = `00${randomDigits}`;
      const existing = await prisma.user.findUnique({ where: { accountNumber } });
      if (!existing) isUnique = true;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        dateOfBirth: new Date(dateOfBirth),
        accountNumber,
        accountStatus,
        kycStatus: 'NOT_SUBMITTED',
        isAdmin
      }
    });

    // Create default security questions for admin-created users
    const defaultQuestions = [
      { question: "What was the name of your first pet?", answer: 'admin' },
      { question: "In what city were you born?", answer: 'admin' },
      { question: "What is your mother's maiden name?", answer: 'admin' }
    ];
    
    for (const sq of defaultQuestions) {
      const answerHash = await bcrypt.hash(sq.answer.toLowerCase().trim(), 10);
      await prisma.securityQuestion.create({
        data: {
          userId: user.id,
          question: sq.question,
          answerHash
        }
      });
    }

    // Generate 100 backup codes
    const backupCodes = [];
    for (let i = 0; i < 100; i++) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = await bcrypt.hash(code, 10);
      await prisma.backupCode.create({
        data: {
          userId: user.id,
          codeHash
        }
      });
      backupCodes.push(code);
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'CREATE_USER',
        description: `Admin created new user: ${email}`,
        severity: 'MEDIUM',
        ipAddress: req.ip,
        metadata: {
          newUserId: user.id,
          accountNumber,
          isAdmin
        }
      }
    });

    return res.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accountNumber: user.accountNumber,
        accountStatus: user.accountStatus,
        kycStatus: user.kycStatus,
        isAdmin: user.isAdmin
      },
      backupCodesGenerated: backupCodes.length
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get all deposits with filtering
// GET /api/v1/mybanker/deposits?status=all
router.get('/deposits', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    
    // Build where clause based on status filter
    const where = {};
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    const deposits = await prisma.deposit.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            accountNumber: true
          }
        },
        gateway: {
          select: {
            id: true,
            name: true,
            type: true,
            network: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return res.json({
      success: true,
      count: deposits.length,
      deposits
    });
  } catch (error) {
    console.error('Get deposits error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Approve deposit
// POST /api/v1/mybanker/deposits/:depositId/approve
router.post('/deposits/:depositId/approve', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { depositId } = req.params;
    const { notes } = req.body;
    
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
      include: { user: true, gateway: true }
    });
    
    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }
    
    if (deposit.status !== 'PENDING') {
      return res.status(400).json({ error: 'Deposit has already been processed' });
    }
    
    // Get user's primary account
    const primaryAccount = await prisma.account.findFirst({
      where: {
        userId: deposit.userId,
        isPrimary: true
      }
    });
    
    if (!primaryAccount) {
      return res.status(404).json({ error: 'User primary account not found' });
    }
    
    // Update deposit and credit account in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update deposit status
      const updatedDeposit = await tx.deposit.update({
        where: { id: depositId },
        data: {
          status: 'COMPLETED',
          processedBy: req.user.userId,
          processedAt: new Date(),
          adminNotes: notes
        }
      });
      
      // Credit the primary account
      const updatedAccount = await tx.account.update({
        where: { id: primaryAccount.id },
        data: {
          balance: { increment: deposit.amount },
          availableBalance: { increment: deposit.amount }
        }
      });
      
      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: deposit.userId,
          accountId: primaryAccount.id,
          amount: deposit.amount,
          type: 'DEPOSIT',
          description: deposit.description || 'Deposit approved by admin',
          status: 'COMPLETED',
          category: 'deposit',
          reference: deposit.reference
        }
      });
      
      // Create notification
      await tx.notification.create({
        data: {
          userId: deposit.userId,
          type: 'deposit',
          title: 'Deposit Approved',
          message: `Your deposit of $${deposit.amount.toFixed(2)} has been approved and credited to your account.`,
          metadata: {
            depositId: deposit.id,
            amount: deposit.amount,
            reference: deposit.reference
          }
        }
      });
      
      return { updatedDeposit, updatedAccount };
    });
    
    return res.json({
      success: true,
      message: 'Deposit approved successfully',
      deposit: result.updatedDeposit
    });
  } catch (error) {
    console.error('Approve deposit error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Reject deposit
// POST /api/v1/mybanker/deposits/:depositId/reject
router.post('/deposits/:depositId/reject', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { depositId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
      include: { user: true }
    });
    
    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }
    
    if (deposit.status !== 'PENDING') {
      return res.status(400).json({ error: 'Deposit has already been processed' });
    }
    
    // Update deposit status
    const updatedDeposit = await prisma.deposit.update({
      where: { id: depositId },
      data: {
        status: 'REJECTED',
        processedBy: req.user.userId,
        processedAt: new Date(),
        rejectionReason: reason,
        adminNotes: reason
      }
    });
    
    // Create notification
    await prisma.notification.create({
      data: {
        userId: deposit.userId,
        type: 'deposit',
        title: 'Deposit Rejected',
        message: `Your deposit of $${deposit.amount.toFixed(2)} was rejected. Reason: ${reason}`,
        metadata: {
          depositId: deposit.id,
          amount: deposit.amount,
          reason
        }
      }
    });
    
    return res.json({
      success: true,
      message: 'Deposit rejected successfully',
      deposit: updatedDeposit
    });
  } catch (error) {
    console.error('Reject deposit error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================
// WITHDRAWAL MANAGEMENT ROUTES
// ============================================

// Get all withdrawals (admin)
// GET /api/v1/mybanker/withdrawals
router.get('/withdrawals', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = {};
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    const withdrawals = await prisma.withdrawal.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        account: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return res.json({
      success: true,
      withdrawals
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Approve withdrawal
// POST /api/v1/mybanker/withdrawals/:withdrawalId/approve
router.post('/withdrawals/:withdrawalId/approve', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { notes } = req.body;
    
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        user: true,
        account: true
      }
    });
    
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    
    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({ error: 'Withdrawal has already been processed' });
    }
    
    // Check if account has sufficient balance
    if (parseFloat(withdrawal.account.balance) < parseFloat(withdrawal.amount)) {
      return res.status(400).json({ error: 'Insufficient balance in account' });
    }
    
    // Process withdrawal in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update withdrawal status
      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'COMPLETED',
          processedBy: req.user.userId,
          processedAt: new Date()
        }
      });
      
      // Deduct from account balance
      const updatedAccount = await tx.account.update({
        where: { id: withdrawal.accountId },
        data: {
          balance: {
            decrement: parseFloat(withdrawal.amount)
          },
          availableBalance: {
            decrement: parseFloat(withdrawal.amount)
          }
        }
      });
      
      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          accountId: withdrawal.accountId,
          type: 'WITHDRAWAL',
          amount: parseFloat(withdrawal.amount),
          description: `${withdrawal.description || 'Withdrawal'} - Approved by admin`,
          status: 'COMPLETED',
          reference: `WTH-${Date.now()}`
        }
      });
      
      // Create notification
      await tx.notification.create({
        data: {
          userId: withdrawal.userId,
          type: 'withdrawal',
          title: 'Withdrawal Approved',
          message: `Your withdrawal of $${withdrawal.amount.toFixed(2)} has been approved and processed.`,
          metadata: {
            withdrawalId: withdrawal.id,
            amount: withdrawal.amount,
            transactionId: transaction.id
          }
        }
      });
      
      return { updatedWithdrawal, updatedAccount, transaction };
    });
    
    return res.json({
      success: true,
      message: 'Withdrawal approved successfully',
      withdrawal: result.updatedWithdrawal
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Reject withdrawal
// POST /api/v1/mybanker/withdrawals/:withdrawalId/reject
router.post('/withdrawals/:withdrawalId/reject', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: true }
    });
    
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    
    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({ error: 'Withdrawal has already been processed' });
    }
    
    // Update withdrawal status
    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'REJECTED',
        processedBy: req.user.userId,
        processedAt: new Date(),
        rejectionReason: reason
      }
    });
    
    // Create notification
    await prisma.notification.create({
      data: {
        userId: withdrawal.userId,
        type: 'withdrawal',
        title: 'Withdrawal Rejected',
        message: `Your withdrawal of $${withdrawal.amount.toFixed(2)} was rejected. Reason: ${reason}`,
        metadata: {
          withdrawalId: withdrawal.id,
          amount: withdrawal.amount,
          reason
        }
      }
    });
    
    return res.json({
      success: true,
      message: 'Withdrawal rejected successfully',
      withdrawal: updatedWithdrawal
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get user accounts
// GET /api/v1/mybanker/users/:userId/accounts
router.get('/users/:userId/accounts', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching accounts for user:', userId);
    
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: {
        id: true,
        accountNumber: true,
        accountType: true,
        balance: true,
        availableBalance: true,
        isPrimary: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { isPrimary: 'desc' }
    });
    
    console.log(`Found ${accounts.length} accounts for user ${userId}`);
    
    return res.json({
      success: true,
      accounts
    });
  } catch (error) {
    console.error('Get user accounts error:', error);
    console.error('Error details:', error.message);
    return res.status(500).json({ error: error.message, details: 'Failed to load user accounts' });
  }
});

// Update a user's account (account number, balances, status)
router.put('/users/:userId/accounts/:accountId', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId, accountId } = req.params;
    const {
      accountNumber,
      accountType,
      balance,
      availableBalance,
      pendingBalance,
      isPrimary,
      isActive
    } = req.body;

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account || account.userId !== userId) {
      return res.status(404).json({ error: 'Account not found for this user' });
    }

    const updateData = {};

    if (accountNumber !== undefined) {
      const normalizedNumber = accountNumber.toString().trim();
      if (!/^\d{6,20}$/.test(normalizedNumber)) {
        return res.status(400).json({ error: 'Account number must be 6-20 digits with no letters or spaces' });
      }

      const existingAccountNumber = await prisma.account.findUnique({
        where: { accountNumber: normalizedNumber }
      });

      if (existingAccountNumber && existingAccountNumber.id !== accountId) {
        return res.status(400).json({ error: 'Account number already in use by another account' });
      }

      updateData.accountNumber = normalizedNumber;
    }

    if (accountType && typeof accountType === 'string') {
      updateData.accountType = accountType.toUpperCase();
    }

    const numericFields = [
      { key: 'balance', value: balance },
      { key: 'availableBalance', value: availableBalance },
      { key: 'pendingBalance', value: pendingBalance }
    ];

    numericFields.forEach(({ key, value }) => {
      if (value !== undefined && value !== null && value !== '') {
        const parsed = parseFloat(value);
        if (Number.isNaN(parsed)) {
          throw new Error(`${key} must be a valid number`);
        }
        updateData[key] = parsed;
      }
    });

    if (isPrimary !== undefined) {
      updateData.isPrimary = Boolean(isPrimary);
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    // If setting account as primary, demote other accounts
    if (updateData.isPrimary) {
      await prisma.account.updateMany({
        where: {
          userId,
          id: { not: accountId }
        },
        data: { isPrimary: false }
      });
    }

    // Ensure available balance defaults to balance when not provided but balance is updated
    if (updateData.balance !== undefined && updateData.availableBalance === undefined) {
      updateData.availableBalance = updateData.balance;
    }

    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: updateData
    });

    await promoteDefaultSpendingAccount(userId);

    return res.json({
      success: true,
      account: updatedAccount
    });
  } catch (error) {
    console.error('Update account error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update account' });
  }
});

// Delete a user's account
router.delete('/users/:userId/accounts/:accountId', verifyAuth, verifyAdmin, async (req, res) => {
  const { userId, accountId } = req.params;

  try {
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account || account.userId !== userId) {
      return res.status(404).json({ error: 'Account not found for this user' });
    }

    const remainingAccounts = await prisma.account.findMany({
      where: {
        userId,
        id: { not: accountId }
      },
      orderBy: { createdAt: 'asc' }
    });

    await prisma.account.delete({ where: { id: accountId } });

    if (account.isPrimary && remainingAccounts.length > 0) {
      await promoteDefaultSpendingAccount(userId);
    }

    return res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete account' });
  }
});

// Create admin deposit (direct credit)
// POST /api/v1/mybanker/deposits
router.post('/deposits', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userEmail, amount, method, description } = req.body;
    
    if (!userEmail || !amount) {
      return res.status(400).json({ error: 'User email and amount are required' });
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's primary account
    const primaryAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        isPrimary: true
      }
    });
    
    if (!primaryAccount) {
      return res.status(404).json({ error: 'User primary account not found' });
    }
    
    // Generate unique reference
    const reference = `ADM-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    
    // Create deposit and transaction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create deposit record
      const deposit = await tx.deposit.create({
        data: {
          userId: user.id,
          amount: parseFloat(amount),
          method: method || 'ADMIN_CREDIT',
          reference,
          description: description || 'Admin deposit',
          status: 'COMPLETED',
          processedBy: req.user.userId,
          processedAt: new Date()
        }
      });
      
      // Credit the primary account
      const updatedAccount = await tx.account.update({
        where: { id: primaryAccount.id },
        data: {
          balance: { increment: parseFloat(amount) },
          availableBalance: { increment: parseFloat(amount) }
        }
      });
      
      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: user.id,
          accountId: primaryAccount.id,
          amount: parseFloat(amount),
          type: 'DEPOSIT',
          description: description || 'Admin deposit',
          status: 'COMPLETED',
          category: 'admin_deposit',
          reference
        }
      });
      
      // Create notification
      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'deposit',
          title: 'Deposit Received',
          message: `$${parseFloat(amount).toFixed(2)} has been credited to your account by admin.`,
          metadata: {
            depositId: deposit.id,
            amount: parseFloat(amount),
            reference
          }
        }
      });
      
      return { deposit, updatedAccount };
    });
    
    return res.json({
      success: true,
      message: 'Deposit created and account credited successfully',
      deposit: result.deposit
    });
  } catch (error) {
    console.error('Create admin deposit error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Save admin settings
// POST /api/v1/mybanker/settings
router.post('/settings', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const settings = req.body;
    
    // Store settings in database or configuration
    // For now, we'll just acknowledge receipt
    // In production, you'd save to a Settings table
    
    return res.json({
      success: true,
      message: 'Settings saved successfully',
      settings
    });
  } catch (error) {
    console.error('Save settings error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get user cards (debit and credit)
// GET /api/v1/mybanker/users/:userId/cards
router.get('/users/:userId/cards', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get debit cards
    const debitCards = await prisma.debitCard.findMany({
      where: {
        account: {
          userId
        }
      },
      include: {
        account: {
          select: {
            accountType: true,
            accountNumber: true
          }
        }
      }
    });
    
    // Get credit cards
    const creditCards = await prisma.creditCard.findMany({
      where: { userId },
      select: {
        id: true,
        cardNumber: true,
        cvv: true,
        expiryDate: true,
        cardHolderName: true,
        status: true,
        creditLimit: true,
        availableCredit: true,
        currentBalance: true,
        apr: true,
        isActive: true,
        isFrozen: true,
        createdAt: true
      }
    });
    
    // Format debit cards
    const formattedDebitCards = debitCards.map(card => ({
      id: card.id,
      cardNumber: card.cardNumber,
      cvv: card.cvv,
      expiryDate: card.expiryDate,
      cardholderName: card.cardholderName,
      cardType: 'DEBIT',
      status: card.isActive ? (card.isFrozen ? 'FROZEN' : 'ACTIVE') : 'INACTIVE',
      dailyLimit: card.dailyLimit ? parseFloat(card.dailyLimit.toString()) : 0,
      monthlyLimit: card.monthlyLimit ? parseFloat(card.monthlyLimit.toString()) : 0,
      accountType: card.account?.accountType,
      accountNumber: card.account?.accountNumber,
      createdAt: card.createdAt
    }));
    
    // Format credit cards
    const formattedCreditCards = creditCards.map(card => ({
      id: card.id,
      cardNumber: card.cardNumber,
      cvv: card.cvv,
      expiryDate: card.expiryDate,
      cardholderName: card.cardHolderName,
      cardType: 'CREDIT',
      status: card.status,
      creditLimit: card.creditLimit ? parseFloat(card.creditLimit.toString()) : 0,
      availableCredit: card.availableCredit ? parseFloat(card.availableCredit.toString()) : 0,
      currentBalance: card.currentBalance ? parseFloat(card.currentBalance.toString()) : 0,
      apr: card.apr ? parseFloat(card.apr.toString()) : 0,
      isActive: card.isActive,
      isFrozen: card.isFrozen,
      accountType: 'CREDIT',
      createdAt: card.createdAt
    }));
    
    // Combine all cards
    const allCards = [...formattedDebitCards, ...formattedCreditCards].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    return res.json({
      success: true,
      cards: allCards
    });
  } catch (error) {
    console.error('Get user cards error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Update card limits and status
// PUT /api/v1/mybanker/cards/:cardId
router.put('/cards/:cardId', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { cardId } = req.params;
    const {
      cardNumber,
      expiryDate,
      dailyLimit,
      monthlyLimit,
      status,
      // For credit cards
      creditLimit,
      availableCredit,
      currentBalance
    } = req.body;
    
    // Try to find as debit card first
    let debitCard = await prisma.debitCard.findUnique({
      where: { id: cardId }
    });
    
    if (debitCard) {
      // Update debit card
      const updateData = {};
      if (cardNumber !== undefined) {
        // Encode card number to base64
        updateData.cardNumber = Buffer.from(cardNumber).toString('base64');
      }
      if (expiryDate !== undefined) updateData.expiryDate = new Date(expiryDate);
      if (dailyLimit !== undefined) updateData.dailyLimit = parseFloat(dailyLimit);
      if (monthlyLimit !== undefined) updateData.monthlyLimit = parseFloat(monthlyLimit);
      if (status !== undefined) {
        updateData.isActive = status === 'ACTIVE' || status === 'FROZEN';
        updateData.isFrozen = status === 'FROZEN';
      }
      
      const updatedCard = await prisma.debitCard.update({
        where: { id: cardId },
        data: updateData
      });
      
      return res.json({
        success: true,
        message: 'Debit card updated successfully',
        card: updatedCard
      });
    }
    
    // Try credit card
    let creditCard = await prisma.creditCard.findUnique({
      where: { id: cardId }
    });
    
    if (creditCard) {
      // Update credit card
      const updateData = {};
      console.log('Updating credit card:', cardId, 'with data:', {
        cardNumber,
        expiryDate,
        dailyLimit,
        monthlyLimit,
        status,
        creditLimit,
        availableCredit,
        currentBalance
      });
      if (cardNumber !== undefined) {
        // Encode card number to base64
        updateData.cardNumber = Buffer.from(cardNumber).toString('base64');
      }
      if (expiryDate !== undefined) updateData.expiryDate = new Date(expiryDate);
      
      // --- Credit card amounts ---
      // Prefer explicit creditLimit / availableCredit / currentBalance from admin UI
      if (creditLimit !== undefined && creditLimit !== null && creditLimit !== '') {
        updateData.creditLimit = parseFloat(creditLimit);
      }

      if (currentBalance !== undefined && currentBalance !== null && currentBalance !== '') {
        updateData.currentBalance = parseFloat(currentBalance);
      }

      if (availableCredit !== undefined && availableCredit !== null && availableCredit !== '') {
        updateData.availableCredit = parseFloat(availableCredit);
      } else if (updateData.creditLimit !== undefined && updateData.currentBalance !== undefined) {
        // Derive availableCredit if limit and balance are both known and explicit availableCredit not provided
        updateData.availableCredit = updateData.creditLimit - updateData.currentBalance;
      }

      // Backwards compatibility: if older admin UI sends dailyLimit instead of creditLimit
      if (dailyLimit !== undefined && dailyLimit !== null && dailyLimit !== '' && updateData.creditLimit === undefined) {
        const parsedLimit = parseFloat(dailyLimit);
        updateData.creditLimit = parsedLimit;

        if (updateData.currentBalance !== undefined) {
          updateData.availableCredit = parsedLimit - updateData.currentBalance;
        } else if (availableCredit === undefined) {
          // If admin did not explicitly set availableCredit, default it to the limit
          updateData.availableCredit = parsedLimit;
        }
      }
      if (status !== undefined) {
        const normalizedStatus = status.toUpperCase();
        updateData.status = normalizedStatus;
        // Also update approvalStatus when activating a credit card
        if (normalizedStatus === 'ACTIVE') {
          updateData.approvalStatus = 'APPROVED';
          updateData.isActive = true;
          updateData.isFrozen = false;
          updateData.approvedAt = new Date();
        } else if (normalizedStatus === 'FROZEN') {
          updateData.isFrozen = true;
          updateData.isActive = true;
        } else if (normalizedStatus === 'PENDING') {
          updateData.approvalStatus = 'PENDING';
          updateData.isActive = false;
          updateData.isFrozen = false;
        } else if (normalizedStatus === 'DECLINED') {
          updateData.approvalStatus = 'DECLINED';
          updateData.isActive = false;
          updateData.isFrozen = false;
        }
      }
      
      console.log('Final updateData for credit card:', updateData);
      
      // Only update if there's something to update
      if (Object.keys(updateData).length === 0) {
        return res.json({
          success: true,
          message: 'No changes to update',
          card: creditCard
        });
      }
      
      const updatedCard = await prisma.creditCard.update({
        where: { id: cardId },
        data: updateData
      });
      
      return res.json({
        success: true,
        message: 'Credit card updated successfully',
        card: updatedCard
      });
    }
    
    return res.status(404).json({ error: 'Card not found' });
  } catch (error) {
    console.error('Update card error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Delete card (debit or credit)
// DELETE /api/v1/mybanker/cards/:cardId
router.delete('/cards/:cardId', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { cardId } = req.params;
    
    // Try to find as debit card first
    let debitCard = await prisma.debitCard.findUnique({
      where: { id: cardId }
    });
    
    if (debitCard) {
      // Delete debit card
      await prisma.debitCard.delete({
        where: { id: cardId }
      });
      
      return res.json({
        success: true,
        message: 'Debit card deleted successfully'
      });
    }
    
    // Try credit card
    let creditCard = await prisma.creditCard.findUnique({
      where: { id: cardId }
    });
    
    if (creditCard) {
      // Delete credit card
      await prisma.creditCard.delete({
        where: { id: cardId }
      });
      
      return res.json({
        success: true,
        message: 'Credit card deleted successfully'
      });
    }
    
    return res.status(404).json({ error: 'Card not found' });
  } catch (error) {
    console.error('Delete card error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Fix missing accounts for users
// POST /api/v1/mybanker/fix-accounts/:userId
router.post('/fix-accounts/:userId', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('Fixing accounts for user:', userId);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check existing accounts
    const existingAccounts = await prisma.account.findMany({
      where: { userId }
    });
    
    console.log(`User has ${existingAccounts.length} existing accounts`);
    
    const createdAccounts = [];
    
    // Create Savings account if missing
    const hasSavings = existingAccounts.some(acc => acc.accountType === 'SAVINGS');
    if (!hasSavings) {
      const savingsNumber = `7${String(Math.floor(100000000 + Math.random() * 900000000))}`;
      const savingsAccount = await prisma.account.create({
        data: {
          userId: user.id,
          accountType: 'SAVINGS',
          accountNumber: savingsNumber,
          balance: 0,
          availableBalance: 0,
          pendingBalance: 0,
          currency: 'USD',
          isActive: true,
          isPrimary: existingAccounts.length === 0 // Primary if first account
        }
      });
      createdAccounts.push(savingsAccount);
      console.log('Created Savings account:', savingsNumber);
    }
    
    // Create Checking account if missing
    const hasChecking = existingAccounts.some(acc => acc.accountType === 'CHECKING');
    if (!hasChecking) {
      const checkingNumber = `03${String(Math.floor(100000000 + Math.random() * 900000000))}`;
      const checkingAccount = await prisma.account.create({
        data: {
          userId: user.id,
          accountType: 'CHECKING',
          accountNumber: checkingNumber,
          balance: 0,
          availableBalance: 0,
          pendingBalance: 0,
          currency: 'USD',
          isActive: true,
          isPrimary: false
        }
      });
      createdAccounts.push(checkingAccount);
      console.log('Created Checking account:', checkingNumber);
    }
    
    if (createdAccounts.length === 0) {
      return res.json({
        success: true,
        message: 'User already has all required accounts',
        accounts: existingAccounts
      });
    }
    
    return res.json({
      success: true,
      message: `Created ${createdAccounts.length} missing account(s)`,
      createdAccounts,
      allAccounts: [...existingAccounts, ...createdAccounts]
    });
  } catch (error) {
    console.error('Fix accounts error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// =============================================
// LOANS MANAGEMENT (God Mode)
// =============================================

// Update loan (Admin only - God Mode)
// PUT /api/v1/mybanker/loans/:loanId
router.put('/loans/:loanId', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { loanId } = req.params;
    const { amount, interestRate, termMonths, status, purpose, remainingBalance, monthlyPayment } = req.body;

    const loan = await prisma.loan.findUnique({
      where: { id: loanId }
    });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (interestRate !== undefined) updateData.interestRate = parseFloat(interestRate);
    if (termMonths !== undefined) updateData.termMonths = parseInt(termMonths);
    if (status !== undefined) updateData.status = status.toUpperCase();
    if (purpose !== undefined) updateData.purpose = purpose;
    if (remainingBalance !== undefined) updateData.remainingBalance = parseFloat(remainingBalance);
    if (monthlyPayment !== undefined) updateData.monthlyPayment = parseFloat(monthlyPayment);

    // Recalculate monthly payment if amount, rate, or term changed
    if ((amount || interestRate || termMonths) && !monthlyPayment) {
      const principal = amount ? parseFloat(amount) : parseFloat(loan.amount);
      const rate = interestRate ? parseFloat(interestRate) : parseFloat(loan.interestRate);
      const months = termMonths ? parseInt(termMonths) : loan.termMonths;
      
      if (rate === 0) {
        updateData.monthlyPayment = principal / months;
      } else {
        const monthlyRate = rate / 100 / 12;
        const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
        const denominator = Math.pow(1 + monthlyRate, months) - 1;
        updateData.monthlyPayment = (principal * numerator) / denominator;
      }
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: updateData,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: loan.userId,
        action: 'ADMIN_LOAN_UPDATED',
        details: `Admin updated loan ${loanId}`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    });

    return res.json({
      success: true,
      message: 'Loan updated successfully',
      loan: updatedLoan
    });
  } catch (error) {
    console.error('Update loan error:', error);
    return res.status(500).json({ error: 'Failed to update loan' });
  }
});

// Delete loan (Admin only - God Mode)
// DELETE /api/v1/mybanker/loans/:loanId
router.delete('/loans/:loanId', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { user: { select: { id: true, email: true } } }
    });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Delete associated loan payments first
    await prisma.loanPayment.deleteMany({
      where: { loanId }
    });

    // Delete the loan
    await prisma.loan.delete({
      where: { id: loanId }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: loan.user.id,
        action: 'ADMIN_LOAN_DELETED',
        details: `Admin deleted loan ${loanId} (${loan.loanType} $${loan.amount})`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    });

    return res.json({
      success: true,
      message: 'Loan deleted successfully'
    });
  } catch (error) {
    console.error('Delete loan error:', error);
    return res.status(500).json({ error: 'Failed to delete loan' });
  }
});

// Create loan for user (Admin only - God Mode)
// POST /api/v1/mybanker/loans
router.post('/loans', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId, loanType, amount, interestRate, termMonths, purpose, status = 'APPROVED' } = req.body;

    if (!userId || !loanType || !amount || !termMonths) {
      return res.status(400).json({ error: 'User ID, loan type, amount, and term are required' });
    }

    // Get user's primary account
    const account = await prisma.account.findFirst({
      where: { userId, isPrimary: true, isActive: true }
    });

    if (!account) {
      return res.status(400).json({ error: 'User has no active primary account' });
    }

    // Calculate monthly payment
    const principal = parseFloat(amount);
    const rate = interestRate ? parseFloat(interestRate) : 8.5; // Default rate
    const months = parseInt(termMonths);
    
    let monthlyPayment;
    if (rate === 0) {
      monthlyPayment = principal / months;
    } else {
      const monthlyRate = rate / 100 / 12;
      const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
      const denominator = Math.pow(1 + monthlyRate, months) - 1;
      monthlyPayment = (principal * numerator) / denominator;
    }

    const loan = await prisma.loan.create({
      data: {
        userId,
        accountId: account.id,
        loanType: loanType.toUpperCase(),
        amount: principal,
        interestRate: rate,
        termMonths: months,
        monthlyPayment,
        remainingBalance: principal,
        purpose: purpose || null,
        status: status.toUpperCase(),
        approvedBy: status.toUpperCase() === 'APPROVED' ? req.user.userId : null,
        approvedAt: status.toUpperCase() === 'APPROVED' ? new Date() : null,
        disbursedAt: status.toUpperCase() === 'APPROVED' ? new Date() : null
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    // If approved, credit the account
    if (status.toUpperCase() === 'APPROVED') {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          balance: { increment: principal },
          availableBalance: { increment: principal }
        }
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          accountId: account.id,
          type: 'CREDIT',
          amount: principal,
          description: `${loanType} loan disbursement (Admin created)`,
          reference: `LOAN-ADM-${Date.now()}`,
          status: 'COMPLETED',
          category: 'LOAN'
        }
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_LOAN_CREATED',
        details: `Admin created ${loanType} loan of $${amount} for user`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    });

    return res.json({
      success: true,
      message: 'Loan created successfully',
      loan
    });
  } catch (error) {
    console.error('Create loan error:', error);
    return res.status(500).json({ error: 'Failed to create loan' });
  }
});


// Admin impersonate user - generate token to view user's dashboard
// POST /api/v1/mybanker/users/:userId/impersonate
router.post('/users/:userId/impersonate', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, isAdmin: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a token for the target user
    const impersonationToken = generateToken(targetUser.id);

    // Log the impersonation action (non-critical)
    try {
      await prisma.auditLog.create({
        data: {
          user: { connect: { id: req.user.userId } },
          action: 'ADMIN_IMPERSONATE_USER',
          details: `Admin impersonated user ${targetUser.email} (${targetUser.firstName} ${targetUser.lastName})`,
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      });
    } catch (auditError) {
      console.error('Audit log creation failed (non-critical):', auditError.message);
    }

    return res.json({
      success: true,
      token: impersonationToken,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName
      }
    });
  } catch (error) {
    console.error('Impersonate user error:', error);
    return res.status(500).json({ error: 'Failed to impersonate user' });
  }
});

// Seed Food Supply Transactions from CSV data
// POST /api/v1/mybanker/seed-food-supply-transactions
router.post('/seed-food-supply-transactions', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { transactions } = req.body;
    
    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ error: 'Transactions array is required' });
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: []
    };

    for (const tx of transactions) {
      const { userEmail, requestNumber, amount, description, category, merchantName, createdAt } = tx;
      
      // Find user and their primary account
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        include: {
          accounts: {
            where: { isActive: true },
            orderBy: { isPrimary: 'desc' }
          }
        }
      });

      if (!user || user.accounts.length === 0) {
        results.errors.push(`No account found for ${userEmail}`);
        results.skipped++;
        continue;
      }

      const account = user.accounts[0];
      const reference = `TXN-${requestNumber}`;

      // Check if transaction already exists
      const existingTx = await prisma.transaction.findUnique({
        where: { reference }
      });

      if (existingTx) {
        results.skipped++;
        continue;
      }

      // Create the transaction
      try {
        await prisma.transaction.create({
          data: {
            userId: user.id,
            accountId: account.id,
            reference,
            amount: parseFloat(amount),
            type: 'DEBIT',
            description,
            category: category || 'SUPPLIES',
            merchantName: merchantName || 'Food Supply Services',
            merchantCategory: 'FOOD_SUPPLIES',
            status: 'COMPLETED',
            createdAt: new Date(createdAt),
            updatedAt: new Date(createdAt)
          }
        });
        results.created++;
      } catch (error) {
        results.errors.push(`Error creating ${reference}: ${error.message}`);
        results.skipped++;
      }
    }

    return res.json({
      success: true,
      message: `Seeded ${results.created} transactions, skipped ${results.skipped}`,
      results
    });
  } catch (error) {
    console.error('Seed food supply transactions error:', error);
    return res.status(500).json({ error: 'Failed to seed transactions' });
  }
});

// Clone transactions from one user to another
// POST /api/v1/mybanker/clone-transactions
router.post('/clone-transactions', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { sourceEmail, targetEmail, locationReplace } = req.body;
    
    if (!sourceEmail || !targetEmail) {
      return res.status(400).json({ error: 'Source and target emails are required' });
    }

    // Find source user and their transactions
    const sourceUser = await prisma.user.findUnique({
      where: { email: sourceEmail },
      include: {
        accounts: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' }
        }
      }
    });

    if (!sourceUser || sourceUser.accounts.length === 0) {
      return res.status(404).json({ error: `Source user not found: ${sourceEmail}` });
    }

    // Find target user and their primary account
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: {
        accounts: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' }
        }
      }
    });

    if (!targetUser || targetUser.accounts.length === 0) {
      return res.status(404).json({ error: `Target user not found: ${targetEmail}` });
    }

    const targetAccount = targetUser.accounts[0];

    // Get all transactions from source user's accounts
    const sourceAccountIds = sourceUser.accounts.map(a => a.id);
    const sourceTransactions = await prisma.transaction.findMany({
      where: {
        accountId: { in: sourceAccountIds }
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${sourceTransactions.length} transactions from ${sourceEmail}`);

    // Get existing transaction references for target user to avoid duplicates
    const existingTargetTxs = await prisma.transaction.findMany({
      where: { accountId: targetAccount.id },
      select: { reference: true }
    });
    const existingRefs = new Set(existingTargetTxs.map(t => t.reference));

    const results = {
      created: 0,
      skipped: 0,
      errors: []
    };

    for (const tx of sourceTransactions) {
      // Skip food supply transactions (already seeded separately)
      if (tx.reference?.startsWith('TXN-SUP-')) {
        results.skipped++;
        continue;
      }

      // Create new reference for cloned transaction
      const newReference = `CLN-${targetUser.id.slice(-6)}-${tx.reference || Date.now()}`;
      
      // Check if already cloned
      if (existingRefs.has(newReference)) {
        results.skipped++;
        continue;
      }

      // Replace location in description if specified
      let description = tx.description;
      if (locationReplace && locationReplace.from && locationReplace.to) {
        description = description.replace(new RegExp(locationReplace.from, 'gi'), locationReplace.to);
      }

      try {
        await prisma.transaction.create({
          data: {
            userId: targetUser.id,
            accountId: targetAccount.id,
            reference: newReference,
            amount: tx.amount,
            type: tx.type,
            description,
            category: tx.category,
            merchantName: tx.merchantName,
            merchantCategory: tx.merchantCategory,
            status: tx.status,
            createdAt: tx.createdAt,
            updatedAt: tx.updatedAt
          }
        });
        results.created++;
        existingRefs.add(newReference);
      } catch (error) {
        results.errors.push(`Error cloning ${tx.reference}: ${error.message}`);
        results.skipped++;
      }
    }

    return res.json({
      success: true,
      message: `Cloned ${results.created} transactions from ${sourceEmail} to ${targetEmail}, skipped ${results.skipped}`,
      results
    });
  } catch (error) {
    console.error('Clone transactions error:', error);
    return res.status(500).json({ error: 'Failed to clone transactions' });
  }
});

// Clone entire user with all data
// POST /api/v1/mybanker/clone-user
router.post('/clone-user', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { sourceEmail, targetEmail } = req.body;
    
    if (!sourceEmail || !targetEmail) {
      return res.status(400).json({ error: 'Source and target emails are required' });
    }

    // 1. Find source user with all relations
    const sourceUser = await prisma.user.findUnique({
      where: { email: sourceEmail },
      include: {
        accounts: {
          include: {
            transactions: true,
            debitCards: true,
            loans: true,
            withdrawals: true
          }
        },
        kycDocuments: true,
        loans: true,
        deposits: true,
        cheques: true,
        debitCards: true,
        creditCards: true,
        transferRequests: true,
        beneficiaries: true,
        cardTransactions: true,
        supportTickets: {
          include: {
            messages: true
          }
        },
        withdrawals: true,
        recurringPayments: true
      }
    });

    if (!sourceUser) {
      return res.status(404).json({ error: `Source user not found: ${sourceEmail}` });
    }

    // 2. Check if target user already exists
    const existingTarget = await prisma.user.findUnique({
      where: { email: targetEmail }
    });

    if (existingTarget) {
      return res.status(400).json({ error: `Target user already exists: ${targetEmail}` });
    }

    // 3. Create new user (same data except email)
    const newUser = await prisma.user.create({
      data: {
        email: targetEmail,
        password: sourceUser.password,
        firstName: sourceUser.firstName,
        lastName: sourceUser.lastName,
        phone: sourceUser.phone,
        phoneCountryCode: sourceUser.phoneCountryCode,
        dateOfBirth: sourceUser.dateOfBirth,
        address: sourceUser.address,
        city: sourceUser.city,
        state: sourceUser.state,
        zipCode: sourceUser.zipCode,
        country: sourceUser.country,
        isBusinessAccount: sourceUser.isBusinessAccount,
        businessName: sourceUser.businessName,
        businessType: sourceUser.businessType,
        taxId: sourceUser.taxId,
        businessAddress: sourceUser.businessAddress,
        businessCity: sourceUser.businessCity,
        businessState: sourceUser.businessState,
        businessZip: sourceUser.businessZip,
        businessCountry: sourceUser.businessCountry,
        representativeName: sourceUser.representativeName,
        representativeTitle: sourceUser.representativeTitle,
        profilePhoto: sourceUser.profilePhoto,
        nationality: sourceUser.nationality,
        governmentIdType: sourceUser.governmentIdType,
        governmentIdNumber: sourceUser.governmentIdNumber,
        isAdmin: false,
        accountStatus: sourceUser.accountStatus,
        kycStatus: sourceUser.kycStatus,
        totalSentAmount: sourceUser.totalSentAmount,
        loginPreference: sourceUser.loginPreference,
        autoDebitEnabled: sourceUser.autoDebitEnabled
      }
    });

    const stats = {
      accounts: 0,
      transactions: 0,
      debitCards: 0,
      creditCards: 0,
      kycDocuments: 0,
      loans: 0,
      beneficiaries: 0,
      recurringPayments: 0
    };

    // 4. Clone accounts with new account numbers
    const accountMap = new Map();
    for (const oldAccount of sourceUser.accounts) {
      const newAccountNumber = '7' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
      
      const newAccount = await prisma.account.create({
        data: {
          userId: newUser.id,
          accountType: oldAccount.accountType,
          accountNumber: newAccountNumber,
          balance: oldAccount.balance,
          availableBalance: oldAccount.availableBalance,
          pendingBalance: oldAccount.pendingBalance,
          accountName: oldAccount.accountName,
          cryptoSymbol: oldAccount.cryptoSymbol,
          cryptoAddress: oldAccount.cryptoAddress,
          currency: oldAccount.currency,
          isActive: oldAccount.isActive,
          isPrimary: oldAccount.isPrimary,
          createdAt: oldAccount.createdAt
        }
      });

      accountMap.set(oldAccount.id, newAccount.id);
      stats.accounts++;
    }

    // 5. Clone transactions with auto-generated references
    for (const oldAccount of sourceUser.accounts) {
      const newAccountId = accountMap.get(oldAccount.id);
      
      for (const oldTx of oldAccount.transactions) {
        const newReference = `CLN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        await prisma.transaction.create({
          data: {
            userId: newUser.id,
            accountId: newAccountId,
            reference: newReference,
            amount: oldTx.amount,
            type: oldTx.type,
            description: oldTx.description,
            category: oldTx.category,
            merchantName: oldTx.merchantName,
            merchantCategory: oldTx.merchantCategory,
            status: oldTx.status,
            createdAt: oldTx.createdAt
          }
        });
        
        stats.transactions++;
      }
    }

    // 6. Clone debit cards (generate new unique card numbers)
    for (const oldCard of sourceUser.debitCards) {
      const newAccountId = accountMap.get(oldCard.accountId);
      
      // Generate new unique card number (16 digits)
      const newCardNumber = '4062' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
      const newCvv = Math.floor(100 + Math.random() * 900).toString();
      
      await prisma.debitCard.create({
        data: {
          userId: newUser.id,
          accountId: newAccountId,
          cardNumber: newCardNumber,
          cardHolderName: `${newUser.firstName} ${newUser.lastName}`,
          cvv: newCvv,
          expiryDate: oldCard.expiryDate,
          cardType: oldCard.cardType,
          cardBrand: oldCard.cardBrand,
          isActive: oldCard.isActive,
          isFrozen: oldCard.isFrozen,
          dailyLimit: oldCard.dailyLimit,
          createdAt: oldCard.createdAt
        }
      });
      
      stats.debitCards++;
    }

    // 7. Clone credit cards (generate new unique card numbers)
    for (const oldCard of sourceUser.creditCards) {
      // Generate new unique card number (16 digits)
      const newCardNumber = '5175' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
      const newCvv = Math.floor(100 + Math.random() * 900).toString();
      
      await prisma.creditCard.create({
        data: {
          userId: newUser.id,
          cardNumber: newCardNumber,
          cardHolderName: `${newUser.firstName} ${newUser.lastName}`,
          cvv: newCvv,
          expiryDate: oldCard.expiryDate,
          creditLimit: oldCard.creditLimit,
          availableCredit: oldCard.availableCredit,
          currentBalance: oldCard.currentBalance,
          apr: oldCard.apr,
          minimumPayment: oldCard.minimumPayment,
          paymentDueDate: oldCard.paymentDueDate,
          statementDate: oldCard.statementDate,
          status: oldCard.status,
          approvalStatus: oldCard.approvalStatus,
          isActive: oldCard.isActive,
          isFrozen: oldCard.isFrozen,
          createdAt: oldCard.createdAt
        }
      });
      
      stats.creditCards++;
    }

    // 8. Clone KYC documents
    for (const oldDoc of sourceUser.kycDocuments) {
      await prisma.kYCDocument.create({
        data: {
          userId: newUser.id,
          category: oldDoc.category,
          documentType: oldDoc.documentType,
          documentNumber: oldDoc.documentNumber,
          filePath: oldDoc.filePath,
          fileName: oldDoc.fileName,
          fileSize: oldDoc.fileSize,
          mimeType: oldDoc.mimeType,
          description: oldDoc.description,
          expiryDate: oldDoc.expiryDate,
          issueDate: oldDoc.issueDate,
          issuingAuthority: oldDoc.issuingAuthority,
          status: oldDoc.status,
          reviewNotes: oldDoc.reviewNotes,
          createdAt: oldDoc.createdAt
        }
      });
      stats.kycDocuments++;
    }

    // 9. Clone loans
    for (const oldLoan of sourceUser.loans) {
      const newAccountId = oldLoan.accountId ? accountMap.get(oldLoan.accountId) : null;
      
      await prisma.loan.create({
        data: {
          userId: newUser.id,
          accountId: newAccountId,
          loanType: oldLoan.loanType,
          amount: oldLoan.amount,
          interestRate: oldLoan.interestRate,
          termMonths: oldLoan.termMonths,
          monthlyPayment: oldLoan.monthlyPayment,
          remainingBalance: oldLoan.remainingBalance,
          totalPaid: oldLoan.totalPaid,
          status: oldLoan.status,
          approvedAt: oldLoan.approvedAt,
          disbursedAt: oldLoan.disbursedAt,
          nextPaymentDate: oldLoan.nextPaymentDate,
          purpose: oldLoan.purpose,
          createdAt: oldLoan.createdAt
        }
      });
      stats.loans++;
    }

    // 10. Clone beneficiaries
    for (const oldBen of sourceUser.beneficiaries) {
      await prisma.beneficiary.create({
        data: {
          userId: newUser.id,
          bankName: oldBen.bankName,
          routingNumber: oldBen.routingNumber,
          accountNumber: oldBen.accountNumber,
          accountName: oldBen.accountName,
          nickname: oldBen.nickname,
          isActive: oldBen.isActive,
          createdAt: oldBen.createdAt
        }
      });
      stats.beneficiaries++;
    }

    // 11. Clone recurring payments
    for (const oldPayment of sourceUser.recurringPayments) {
      const newFromAccountId = accountMap.get(oldPayment.fromAccountId);
      const newToAccountId = oldPayment.toAccountId ? accountMap.get(oldPayment.toAccountId) : null;
      const newReference = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      await prisma.recurringPayment.create({
        data: {
          userId: newUser.id,
          fromAccountId: newFromAccountId,
          toAccountId: newToAccountId,
          paymentType: oldPayment.paymentType,
          recipientName: oldPayment.recipientName,
          recipientBank: oldPayment.recipientBank,
          recipientAccount: oldPayment.recipientAccount,
          recipientRouting: oldPayment.recipientRouting,
          amount: oldPayment.amount,
          currency: oldPayment.currency,
          description: oldPayment.description,
          reference: newReference,
          frequency: oldPayment.frequency,
          startDate: oldPayment.startDate,
          endDate: oldPayment.endDate,
          nextExecutionDate: oldPayment.nextExecutionDate,
          dayOfMonth: oldPayment.dayOfMonth,
          dayOfWeek: oldPayment.dayOfWeek,
          status: oldPayment.status,
          executionCount: oldPayment.executionCount,
          maxExecutions: oldPayment.maxExecutions,
          createdAt: oldPayment.createdAt
        }
      });
      stats.recurringPayments++;
    }

    return res.json({
      success: true,
      message: `Successfully cloned user from ${sourceEmail} to ${targetEmail}`,
      newUserId: newUser.id,
      stats,
      note: 'Security questions and backup codes NOT cloned. Set these up via admin panel.'
    });

  } catch (error) {
    console.error('Clone user error:', error);
    return res.status(500).json({ error: 'Failed to clone user', details: error.message });
  }
});

// Fix all crypto wallet addresses to match Brian Merker's wallet
// POST /api/v1/mybanker/fix-crypto-wallets
router.post('/fix-crypto-wallets', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    // Brian Merker's correct wallet info
    // The bc1q address is the correct one to use for all wallets
    const CORRECT_CRYPTO_ADDRESS = 'bc1q7m8m6ufptvqlt7jer92d480y78jckyrzy0t6f7';

    // Find ALL crypto wallet accounts (including Brian's)
    const cryptoWallets = await prisma.account.findMany({
      where: {
        accountType: 'CRYPTO_WALLET'
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    let updatedCount = 0;
    let skippedCount = 0;
    const results = [];

    for (const wallet of cryptoWallets) {
      const userName = `${wallet.user.firstName} ${wallet.user.lastName}`;
      
      // Check if wallet already has correct address
      if (wallet.cryptoAddress === CORRECT_CRYPTO_ADDRESS) {
        results.push({ 
          userName, 
          status: 'already_correct',
          accountNumber: wallet.accountNumber,
          cryptoAddress: wallet.cryptoAddress
        });
        skippedCount++;
        continue;
      }

      // Update cryptoAddress to the bc1q address
      await prisma.account.update({
        where: { id: wallet.id },
        data: {
          cryptoAddress: CORRECT_CRYPTO_ADDRESS
        }
      });

      results.push({
        userName,
        status: 'updated',
        oldCryptoAddress: wallet.cryptoAddress,
        newCryptoAddress: CORRECT_CRYPTO_ADDRESS
      });
      updatedCount++;
    }

    return res.json({
      success: true,
      message: `Fixed ${updatedCount} crypto wallets, ${skippedCount} already correct`,
      totalWallets: cryptoWallets.length,
      updated: updatedCount,
      alreadyCorrect: skippedCount,
      correctCryptoAddress: CORRECT_CRYPTO_ADDRESS,
      results
    });

  } catch (error) {
    console.error('Fix crypto wallets error:', error);
    return res.status(500).json({ error: 'Failed to fix crypto wallets', details: error.message });
  }
});

// Fix account types for Brokard Williams users
// POST /api/v1/mybanker/fix-brokard-accounts
router.post('/fix-brokard-accounts', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    // Find both Brokard Williams users
    const brokardUsers = await prisma.user.findMany({
      where: {
        firstName: 'Brokard',
        lastName: 'Williams'
      },
      include: {
        accounts: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    const results = [];

    for (const user of brokardUsers) {
      if (user.accounts.length !== 3) {
        results.push({
          email: user.email,
          status: 'skipped',
          reason: `User has ${user.accounts.length} accounts, expected 3`
        });
        continue;
      }

      // Expected account types: CHECKING, SAVINGS, CRYPTO_WALLET
      const [account1, account2, account3] = user.accounts;
      
      // Update account types
      await prisma.account.update({
        where: { id: account1.id },
        data: { accountType: 'CHECKING' }
      });

      await prisma.account.update({
        where: { id: account2.id },
        data: { accountType: 'CRYPTO_WALLET' }
      });

      await prisma.account.update({
        where: { id: account3.id },
        data: { accountType: 'SAVINGS' }
      });

      results.push({
        email: user.email,
        status: 'updated',
        changes: [
          { accountNumber: account1.accountNumber, oldType: account1.accountType, newType: 'CHECKING' },
          { accountNumber: account2.accountNumber, oldType: account2.accountType, newType: 'CRYPTO_WALLET' },
          { accountNumber: account3.accountNumber, oldType: account3.accountType, newType: 'SAVINGS' }
        ]
      });
    }

    return res.json({
      success: true,
      message: `Fixed account types for ${results.filter(r => r.status === 'updated').length} users`,
      results
    });

  } catch (error) {
    console.error('Fix Brokard accounts error:', error);
    return res.status(500).json({ error: 'Failed to fix account types', details: error.message });
  }
});

// ============================================
// FIXED DEPOSITS MANAGEMENT
// ============================================

/**
 * GET /api/v1/mybanker/fixed-deposits
 * Get all fixed deposits (admin view)
 */
router.get('/fixed-deposits', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { status, userId, search } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { depositNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const deposits = await prisma.fixedDeposit.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        account: {
          select: {
            accountNumber: true,
            accountType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedDeposits = deposits.map(deposit => ({
      ...deposit,
      principalAmount: normalizeMoneyValue(deposit.principalAmount),
      interestRate: normalizeMoneyValue(deposit.interestRate),
      maturityAmount: normalizeMoneyValue(deposit.maturityAmount),
      withdrawnAmount: normalizeMoneyValue(deposit.withdrawnAmount)
    }));

    return res.json({
      success: true,
      data: formattedDeposits
    });

  } catch (error) {
    console.error('Get fixed deposits error:', error);
    return res.status(500).json({ error: 'Failed to fetch fixed deposits' });
  }
});

/**
 * POST /api/v1/mybanker/fixed-deposits/:depositId/withdraw
 * Admin approve and process a fixed deposit withdrawal request
 */
router.post('/fixed-deposits/:depositId/withdraw', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { depositId } = req.params;
    const adminId = req.user.userId;

    const deposit = await prisma.fixedDeposit.findUnique({
      where: { id: depositId },
      include: { account: true, user: true }
    });

    if (!deposit) {
      return res.status(404).json({ error: 'Fixed deposit not found' });
    }

    // Only allow withdrawal of WITHDRAWAL_PENDING deposits
    if (deposit.status !== 'WITHDRAWAL_PENDING') {
      return res.status(400).json({ error: 'This deposit does not have a pending withdrawal request' });
    }

    const now = new Date();
    const isMatured = now >= deposit.maturityDate;
    const withdrawalAmount = isMatured 
      ? normalizeMoneyValue(deposit.maturityAmount) 
      : normalizeMoneyValue(deposit.principalAmount);

    await prisma.$transaction(async (tx) => {
      await tx.fixedDeposit.update({
        where: { id: depositId },
        data: {
          status: 'WITHDRAWN',
          withdrawalStatus: 'APPROVED',
          withdrawalProcessedAt: now,
          withdrawnAmount: withdrawalAmount,
          withdrawnAt: now,
          processedBy: adminId
        }
      });

      await tx.account.update({
        where: { id: deposit.accountId },
        data: {
          balance: { increment: withdrawalAmount },
          availableBalance: { increment: withdrawalAmount }
        }
      });

      await tx.transaction.create({
        data: {
          accountId: deposit.accountId,
          amount: withdrawalAmount,
          type: 'CREDIT',
          description: `Fixed Deposit Withdrawal - ${deposit.depositNumber}`,
          category: 'INVESTMENT',
          merchantName: 'Rosch Capital Bank',
          merchantCategory: 'Fixed Deposit',
          status: 'COMPLETED',
          reference: `FD-WD-${deposit.depositNumber}`
        }
      });

      // Notify user
      await tx.notification.create({
        data: {
          userId: deposit.userId,
          title: 'Fixed Deposit Withdrawal Approved',
          message: `Your withdrawal request for fixed deposit ${deposit.depositNumber} has been approved. ${isMatured ? 'Maturity amount' : 'Principal amount'} of $${withdrawalAmount.toLocaleString()} has been credited to your account.`,
          type: 'WITHDRAWAL_APPROVED',
          read: false
        }
      });
    });

    return res.json({
      success: true,
      message: isMatured 
        ? 'Fixed deposit withdrawal approved - maturity amount credited' 
        : 'Fixed deposit withdrawal approved - principal amount credited (early withdrawal)',
      data: { withdrawalAmount, isMatured }
    });

  } catch (error) {
    console.error('Admin withdraw fixed deposit error:', error);
    return res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

/**
 * GET /api/v1/mybanker/fixed-deposits/stats
 * Get overall fixed deposit statistics
 */
router.get('/fixed-deposits/stats', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const deposits = await prisma.fixedDeposit.findMany();

    const stats = {
      totalDeposits: deposits.length,
      activeDeposits: deposits.filter(d => d.status === 'ACTIVE').length,
      maturedDeposits: deposits.filter(d => d.status === 'MATURED').length,
      withdrawnDeposits: deposits.filter(d => d.status === 'WITHDRAWN').length,
      totalInvested: deposits
        .filter(d => d.status === 'ACTIVE')
        .reduce((sum, d) => sum + normalizeMoneyValue(d.principalAmount), 0),
      expectedReturns: deposits
        .filter(d => d.status === 'ACTIVE')
        .reduce((sum, d) => sum + (normalizeMoneyValue(d.maturityAmount) - normalizeMoneyValue(d.principalAmount)), 0)
    };

    return res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get fixed deposit stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
