import express from 'express';
import bcrypt from 'bcryptjs';
import { verifyAuth } from '../middleware/auth.js';
import * as fixedDepositService from '../services/fixedDepositService.js';
import prisma from '../config/prisma.js';

const router = express.Router();

/**
 * POST /api/v1/fixed-deposits
 * Create a new fixed deposit
 */
router.post('/', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { accountId, principalAmount, interestRate, termMonths, autoRenew } = req.body;

    // Validation
    if (!accountId || !principalAmount || !interestRate || !termMonths) {
      return res.status(400).json({ 
        error: 'Missing required fields: accountId, principalAmount, interestRate, termMonths' 
      });
    }

    const principal = parseFloat(principalAmount);
    const rate = parseFloat(interestRate);
    const term = parseInt(termMonths);

    if (principal <= 0) {
      return res.status(400).json({ error: 'Principal amount must be greater than 0' });
    }

    if (rate <= 0 || rate > 100) {
      return res.status(400).json({ error: 'Interest rate must be between 0 and 100' });
    }

    if (term < 1 || term > 120) {
      return res.status(400).json({ error: 'Term must be between 1 and 120 months' });
    }

    const fixedDeposit = await fixedDepositService.createFixedDeposit(
      userId,
      accountId,
      principal,
      rate,
      term,
      autoRenew || false
    );

    return res.status(201).json({
      success: true,
      message: 'Fixed deposit created successfully',
      data: fixedDeposit
    });

  } catch (error) {
    console.error('Create fixed deposit error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to create fixed deposit' 
    });
  }
});

/**
 * GET /api/v1/fixed-deposits
 * Get all fixed deposits for logged-in user
 */
router.get('/', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const deposits = await fixedDepositService.getUserFixedDeposits(userId);

    return res.json({
      success: true,
      data: deposits
    });

  } catch (error) {
    console.error('Get fixed deposits error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch fixed deposits' 
    });
  }
});

/**
 * GET /api/v1/fixed-deposits/stats
 * Get fixed deposit statistics for user
 */
router.get('/stats', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = await fixedDepositService.getFixedDepositStats(userId);

    return res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get fixed deposit stats error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch statistics' 
    });
  }
});

/**
 * GET /api/v1/fixed-deposits/:depositId
 * Get specific fixed deposit details
 */
router.get('/:depositId', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { depositId } = req.params;

    const deposit = await fixedDepositService.getFixedDepositById(depositId, userId);

    return res.json({
      success: true,
      data: deposit
    });

  } catch (error) {
    console.error('Get fixed deposit error:', error);
    return res.status(404).json({ 
      error: error.message || 'Fixed deposit not found' 
    });
  }
});

/**
 * POST /api/v1/fixed-deposits/:depositId/withdraw-request
 * Request withdrawal of a fixed deposit (requires backup code, creates pending request)
 */
router.post('/:depositId/withdraw-request', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { depositId } = req.params;
    const { backupCode, reason } = req.body;

    if (!backupCode) {
      return res.status(400).json({ error: 'Backup code is required for withdrawal request' });
    }

    // Verify backup code
    const backupCodes = await prisma.backupCode.findMany({
      where: { userId, isUsed: false }
    });

    let validCode = false;
    let matchedCodeId = null;

    for (const code of backupCodes) {
      const isMatch = await bcrypt.compare(backupCode, code.code);
      if (isMatch) {
        validCode = true;
        matchedCodeId = code.id;
        break;
      }
    }

    if (!validCode) {
      return res.status(401).json({ error: 'Invalid or already used backup code' });
    }

    // Get the fixed deposit
    const deposit = await prisma.fixedDeposit.findFirst({
      where: { id: depositId, userId }
    });

    if (!deposit) {
      return res.status(404).json({ error: 'Fixed deposit not found' });
    }

    if (deposit.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'This fixed deposit is not active' });
    }

    if (deposit.withdrawalStatus === 'PENDING') {
      return res.status(400).json({ error: 'A withdrawal request is already pending for this deposit' });
    }

    // Mark backup code as used
    await prisma.backupCode.update({
      where: { id: matchedCodeId },
      data: { isUsed: true, usedAt: new Date() }
    });

    // Create withdrawal request (pending status)
    const updatedDeposit = await prisma.fixedDeposit.update({
      where: { id: depositId },
      data: {
        status: 'WITHDRAWAL_PENDING',
        withdrawalStatus: 'PENDING',
        withdrawalRequestedAt: new Date(),
        withdrawalReason: reason || 'User requested withdrawal'
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        account: { select: { accountNumber: true, accountType: true } }
      }
    });

    // Create notification for admin
    const admins = await prisma.user.findMany({
      where: { isAdmin: true }
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'Fixed Deposit Withdrawal Request',
          message: `${updatedDeposit.user.firstName} ${updatedDeposit.user.lastName} has requested withdrawal of fixed deposit ${deposit.depositNumber} ($${deposit.principalAmount})`,
          type: 'WITHDRAWAL_REQUEST',
          read: false
        }
      });
    }

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId,
        title: 'Withdrawal Request Submitted',
        message: `Your withdrawal request for fixed deposit ${deposit.depositNumber} has been submitted. Processing takes a minimum of 3 weeks.`,
        type: 'WITHDRAWAL_REQUEST',
        read: false
      }
    });

    return res.json({
      success: true,
      message: 'Withdrawal request submitted successfully. Processing takes a minimum of 3 weeks.',
      data: {
        depositNumber: deposit.depositNumber,
        principalAmount: deposit.principalAmount,
        maturityAmount: deposit.maturityAmount,
        status: 'WITHDRAWAL_PENDING',
        withdrawalStatus: 'PENDING',
        withdrawalRequestedAt: updatedDeposit.withdrawalRequestedAt,
        estimatedProcessingTime: '3 weeks minimum'
      }
    });

  } catch (error) {
    console.error('Withdraw request error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to submit withdrawal request' 
    });
  }
});

/**
 * POST /api/v1/fixed-deposits/:depositId/withdraw
 * Legacy endpoint - redirects to new flow
 */
router.post('/:depositId/withdraw', verifyAuth, async (req, res) => {
  return res.status(400).json({ 
    error: 'Direct withdrawal is no longer supported. Please use the withdrawal request flow which requires backup code verification.',
    redirectTo: `/fixed-deposits/${req.params.depositId}/withdraw-request`
  });
});

export default router;
