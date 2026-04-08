import express from 'express';
import bcrypt from 'bcryptjs';
import { verifyAuth } from '../middleware/auth.js';
import { checkDebitEligibility } from '../middleware/accountRestrictions.js';
import { upload } from '../middleware/upload.js';
import { transactionLimiter, uploadLimiter } from '../middleware/rateLimiter.js';
import prisma from '../config/prisma.js';
import * as paymentService from '../services/paymentService.js';
import { validateSWIFT, validateIBAN, validateRecipientName, validateBankName } from '../utils/bankValidation.js';
import { verifyBackupCode } from '../services/securityService.js';

const paymentsRouter = express.Router();

/**
 * POST /api/v1/payments/deposit
 * Create deposit request (requires admin approval)
 */
paymentsRouter.post('/deposit', uploadLimiter, verifyAuth, upload.single('paymentProof'), async (req, res) => {
  try {
    const { accountId, amount, description, gatewayId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID is required',
      });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0',
      });
    }

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: req.user.userId
      }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Generate unique reference
    const reference = `DEP-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Create deposit record
    const deposit = await prisma.deposit.create({
      data: {
        userId: req.user.userId,
        gatewayId: gatewayId || null,
        amount: parseFloat(amount),
        method: gatewayId ? 'CRYPTO' : 'OTHER',
        reference,
        description: description || 'Deposit request',
        paymentProof: req.file ? req.file.path : null,
        status: 'PENDING'
      }
    });

    // Create notification for admins
    await prisma.notification.create({
      data: {
        userId: req.user.userId,
        type: 'deposit',
        title: 'Deposit Request Submitted',
        message: `Your deposit request of $${amount} is pending admin approval.`,
        metadata: {
          depositId: deposit.id,
          reference,
          amount: parseFloat(amount)
        }
      }
    });

    return res.status(201).json({
      success: true,
      deposit,
      message: 'Deposit request submitted successfully. Awaiting admin approval.'
    });
  } catch (error) {
    console.error('Error in POST /deposit:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/payments/withdrawal
 * Create a withdrawal request (pending admin approval)
 * PND and SUSPENDED users cannot make withdrawals
 * Requires backup code verification for security
 */
paymentsRouter.post('/withdrawal', transactionLimiter, verifyAuth, checkDebitEligibility, async (req, res) => {
  try {
    const { accountId, amount, description, gatewayId, backupCode } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0',
      });
    }

    // Verify backup code - REQUIRED for all debit transactions
    if (!backupCode) {
      return res.status(400).json({
        success: false,
        error: 'Backup code is required for withdrawals',
      });
    }
    
    const backupResult = await verifyBackupCode(req.user.userId, backupCode);
    if (!backupResult.valid) {
      return res.status(401).json({
        success: false,
        error: backupResult.error || 'Invalid backup code',
        alreadyUsed: backupResult.alreadyUsed
      });
    }

    // Verify account ownership
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: req.user.userId
      }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found or unauthorized',
      });
    }

    // Check sufficient balance
    if (parseFloat(account.balance) < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
      });
    }

    // Create pending withdrawal request
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: req.user.userId,
        accountId,
        amount: parseFloat(amount),
        description: description || 'Withdrawal request',
        gatewayId,
        status: 'PENDING',
        reference: `WTH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        metadata: {
          backupCodeUsed: validBackupCode ? validBackupCode.id : null,
          verificationSkipped: !validBackupCode
        }
      }
    });

    // Mark backup code as used (only if one was provided and verified)
    if (validBackupCode) {
      await prisma.backupCode.update({
        where: { id: validBackupCode.id },
        data: { 
          used: true,
          usedAt: new Date(),
          usedFor: 'WITHDRAWAL'
        }
      });
    }

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: req.user.userId,
        type: 'withdrawal',
        title: 'Withdrawal Request Submitted',
        message: `Your withdrawal request of $${amount} is pending admin approval.`,
        metadata: {
          withdrawalId: withdrawal.id,
          amount: parseFloat(amount)
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawal,
    });
  } catch (error) {
    console.error('Error in POST /withdrawal:', error);

    if (error.message.includes('Insufficient')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (error.message.includes('not found') || error.message.includes('unauthorized')) {
      return res.status(404).json({ success: false, error: error.message });
    }

    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/payments/international-transfer
 * International transfer via SWIFT/IBAN
 * TEST PROJECT: Relaxed validation for testing purposes
 */
paymentsRouter.post('/international-transfer', verifyAuth, async (req, res) => {
  try {
    const { fromAccountId, recipientName, recipientIBAN, recipientSWIFT, recipientBank, recipientCountry, recipientAddress, amount, description } = req.body;

    // Validate required fields
    if (!fromAccountId) {
      return res.status(400).json({ success: false, message: 'Source account is required' });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
    }

    if (!recipientName || recipientName.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Recipient name is required (min 2 characters)' });
    }

    if (!recipientIBAN || recipientIBAN.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'IBAN/Account number is required' });
    }

    // Validate SWIFT/BIC code - required for international transfers
    if (!recipientSWIFT || recipientSWIFT.trim().length < 8) {
      return res.status(400).json({ success: false, message: 'SWIFT/BIC code is required (8-11 characters)' });
    }

    // Validate SWIFT format (8 or 11 alphanumeric characters)
    const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i;
    if (!swiftRegex.test(recipientSWIFT.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid SWIFT/BIC code format' });
    }

    if (!recipientBank || recipientBank.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Bank name is required' });
    }

    if (!recipientCountry || recipientCountry.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Recipient country is required' });
    }

    const result = await paymentService.internationalTransfer(fromAccountId, req.user.userId, {
      recipientName: recipientName.trim(),
      recipientIBAN: recipientIBAN.trim().toUpperCase(),
      recipientSWIFT: recipientSWIFT.trim().toUpperCase(),
      recipientBank: recipientBank.trim(),
      recipientCountry: recipientCountry.trim(),
      recipientAddress: recipientAddress ? recipientAddress.trim() : null,
      amount: parseFloat(amount),
      description: description || 'International transfer',
    });

    return res.status(201).json({
      success: true,
      message: 'International transfer initiated successfully',
      transfer: result.transferRequest,
      transaction: result.transaction,
    });
  } catch (error) {
    console.error('Error in POST /international-transfer:', error);

    if (error.message.includes('Insufficient')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message.includes('not found') || error.message.includes('unauthorized')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/payments/transfer
 * Transfer money between user's own accounts
 */
paymentsRouter.post('/transfer', verifyAuth, async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, description } = req.body;

    if (!fromAccountId || !toAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Both source and destination accounts are required',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0',
      });
    }

    const result = await paymentService.transferMoney(fromAccountId, toAccountId, req.user.userId, {
      amount,
      description,
    });

    return res.status(201).json({
      success: true,
      payment: result.payment,
      transactions: result.transactions,
    });
  } catch (error) {
    console.error('Error in POST /transfer:', error);

    if (error.message.includes('Insufficient')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message.includes('not found') || error.message.includes('unauthorized')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/payments/p2p
 * Send peer-to-peer payment to another user
 */
paymentsRouter.post('/p2p', verifyAuth, async (req, res) => {
  try {
    const { fromAccountId, toUserId, amount, description, toAccountId } = req.body;

    if (!fromAccountId || !toUserId) {
      return res.status(400).json({
        success: false,
        message: 'Source account and recipient are required',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0',
      });
    }

    const result = await paymentService.sendPeerPayment(
      fromAccountId,
      toUserId,
      req.user.userId,
      { amount, description, toAccountId },
    );

    return res.status(201).json({
      success: true,
      payment: result.payment,
      transactions: result.transactions,
    });
  } catch (error) {
    console.error('Error in POST /p2p:', error);

    if (error.message.includes('Insufficient')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message.includes('not found') || error.message.includes('unauthorized')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/payments/bill
 * Pay a bill from an account
 */
paymentsRouter.post('/bill', verifyAuth, async (req, res) => {
  try {
    const { accountId, billName, amount, reference, description } = req.body;

    if (!accountId || !billName) {
      return res.status(400).json({
        success: false,
        message: 'Account and bill name are required',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0',
      });
    }

    const result = await paymentService.payBill(accountId, req.user.userId, {
      billName,
      amount,
      reference,
      description,
    });

    return res.status(201).json({
      success: true,
      payment: result.payment,
      transaction: result.transaction,
    });
  } catch (error) {
    console.error('Error in POST /bill:', error);

    if (error.message.includes('Insufficient')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message.includes('not found') || error.message.includes('unauthorized')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/payments/account/:accountId
 * Get payment history for an account
 */
paymentsRouter.get('/account/:accountId', verifyAuth, async (req, res) => {
  try {
    const { accountId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    const result = await paymentService.getPaymentHistory(
      req.user.userId,
      accountId,
      limit,
      offset,
    );

    return res.json({
      success: true,
      payments: result.payments,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    console.error('Error in GET /account/:accountId:', error);

    if (error.message.includes('not found') || error.message.includes('unauthorized')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/payments/history
 * Get all payments for user (combined from all accounts)
 */
paymentsRouter.get('/history', verifyAuth, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    const result = await paymentService.getUserPayments(
      req.user.userId,
      limit,
      offset,
    );

    return res.json({
      success: true,
      payments: result.payments,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    console.error('Error in GET /history:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/payments/stats/overview
 * Get payment statistics for user
 */
paymentsRouter.get('/stats/overview', verifyAuth, async (req, res) => {
  try {
    const stats = await paymentService.getPaymentStats(req.user.userId);
    return res.json({ success: true, stats });
  } catch (error) {
    console.error('Error in GET /stats/overview:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export { paymentsRouter };
