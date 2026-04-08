import { Router } from 'express';
import { verifyAuth, isAdmin } from '../middleware/auth.js';
import { checkDebitEligibility } from '../middleware/accountRestrictions.js';
import prisma from '../config/prisma.js';
import {
  getBankList,
  validateRoutingNumber,
  createTransferRequest,
  getUserTransfers,
  getTransferById,
  getPendingTransfers,
  approveTransfer,
  declineTransfer,
  reverseTransfer,
  saveBeneficiary,
  getBeneficiaries,
  deleteBeneficiary
} from '../services/transferService.js';
import { verifyBackupCode } from '../services/securityService.js';

export const transfersRouter = Router();

// Protect all routes
transfersRouter.use(verifyAuth);

/**
 * GET /api/v1/transfers/banks
 * Get list of all banks
 */
transfersRouter.get('/banks', async (req, res) => {
  try {
    const result = await getBankList();
    res.json(result);
  } catch (error) {
    console.error('Error getting banks:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/transfers/validate-routing
 * Validate routing number
 */
transfersRouter.post('/validate-routing', async (req, res) => {
  try {
    const { routingNumber } = req.body;
    
    if (!routingNumber) {
      return res.status(400).json({ error: 'Routing number is required' });
    }
    
    const result = await validateRoutingNumber(routingNumber);
    res.json(result);
  } catch (error) {
    console.error('Error validating routing number:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/transfers
 * Create transfer request
 * PND and SUSPENDED users cannot create transfers
 */
transfersRouter.post('/', checkDebitEligibility, async (req, res) => {
  try {
    const { fromAccountId, destinationBank, routingNumber, accountNumber, accountName, amount, description, saveBeneficiary, beneficiaryNickname } = req.body;
    
    if (!fromAccountId || !destinationBank || !routingNumber || !accountNumber || !accountName || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await createTransferRequest(req.user.userId, {
      fromAccountId,
      destinationBank,
      routingNumber,
      accountNumber,
      accountName,
      amount: parseFloat(amount),
      description,
      saveBeneficiary,
      beneficiaryNickname
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/transfers/domestic
 * Create domestic transfer request (same as regular transfer)
 * PND and SUSPENDED users are blocked before backup code verification
 * Requires backup code verification for security
 */
transfersRouter.post('/domestic', checkDebitEligibility, async (req, res) => {
  try {
    const { fromAccountId, bankName, routingNumber, accountNumber, accountHolderName, amount, description, backupCode } = req.body;
    
    if (!fromAccountId || !bankName || !routingNumber || !accountNumber || !accountHolderName || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Verify backup code - REQUIRED for all debit transactions
    if (!backupCode) {
      return res.status(400).json({ error: 'Backup code is required for transfers' });
    }
    
    const backupResult = await verifyBackupCode(req.user.userId, backupCode);
    if (!backupResult.valid) {
      return res.status(401).json({ error: backupResult.error || 'Invalid backup code', alreadyUsed: backupResult.alreadyUsed });
    }
    
    const result = await createTransferRequest(req.user.userId, {
      fromAccountId,
      destinationBank: bankName,
      routingNumber,
      accountNumber,
      accountName: accountHolderName,
      amount: parseFloat(amount),
      description,
      transferType: 'DOMESTIC'
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating domestic transfer:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/transfers/international
 * Create international transfer request
 * PND and SUSPENDED users are blocked before backup code verification
 * Requires backup code verification for security
 */
transfersRouter.post('/international', checkDebitEligibility, async (req, res) => {
  try {
    const { fromAccountId, bankName, swiftCode, iban, accountHolderName, amount, description, country, backupCode } = req.body;
    
    if (!fromAccountId || !bankName || !swiftCode || !accountHolderName || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Verify backup code - REQUIRED for all debit transactions
    if (!backupCode) {
      return res.status(400).json({ error: 'Backup code is required for transfers' });
    }
    
    const backupResult = await verifyBackupCode(req.user.userId, backupCode);
    if (!backupResult.valid) {
      return res.status(401).json({ error: backupResult.error || 'Invalid backup code', alreadyUsed: backupResult.alreadyUsed });
    }
    
    const result = await createTransferRequest(req.user.userId, {
      fromAccountId,
      destinationBank: bankName,
      routingNumber: swiftCode,
      accountNumber: iban || swiftCode,
      accountName: accountHolderName,
      amount: parseFloat(amount),
      description,
      transferType: 'INTERNATIONAL',
      country
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating international transfer:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/transfers
 * Get user's transfers
 */
transfersRouter.get('/', async (req, res) => {
  try {
    const result = await getUserTransfers(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error getting transfers:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/transfers/:id
 * Get transfer by ID
 */
transfersRouter.get('/:id', async (req, res) => {
  try {
    const result = await getTransferById(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error getting transfer:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * POST /api/v1/transfers/beneficiaries
 * Save beneficiary
 */
transfersRouter.post('/beneficiaries', async (req, res) => {
  try {
    const { bankName, routingNumber, accountNumber, accountName, nickname } = req.body;
    
    if (!bankName || !routingNumber || !accountNumber || !accountName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await saveBeneficiary(req.user.userId, {
      bankName,
      routingNumber,
      accountNumber,
      accountName,
      nickname
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error saving beneficiary:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/transfers/beneficiaries
 * Get beneficiaries
 */
transfersRouter.get('/beneficiaries/list', async (req, res) => {
  try {
    const result = await getBeneficiaries(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error getting beneficiaries:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/transfers/beneficiaries/:id
 * Delete beneficiary
 */
transfersRouter.delete('/beneficiaries/:id', async (req, res) => {
  try {
    const result = await deleteBeneficiary(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting beneficiary:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/transfers/internal
 * Internal transfer between Rosch Capital Bank users
 * Requires backup code verification for security
 */
transfersRouter.post('/internal', async (req, res) => {
  try {
    const { fromAccountId, toAccountNumber, amount, description, backupCode } = req.body;
    
    console.log('Internal transfer request:', { fromAccountId, toAccountNumber, amount, description });
    
    if (!fromAccountId || !toAccountNumber || !amount) {
      return res.status(400).json({ error: 'Missing required fields: fromAccountId, toAccountNumber, and amount are required' });
    }
    
    // Verify backup code - REQUIRED for all debit transactions
    if (!backupCode) {
      return res.status(400).json({ error: 'Backup code is required for transfers' });
    }
    
    const backupResult = await verifyBackupCode(req.user.userId, backupCode);
    if (!backupResult.valid) {
      return res.status(401).json({ error: backupResult.error || 'Invalid backup code', alreadyUsed: backupResult.alreadyUsed });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    
    // Get sender account
    const fromAccount = await prisma.account.findFirst({
      where: {
        id: fromAccountId,
        userId: req.user.userId
      }
    });
    
    if (!fromAccount) {
      return res.status(404).json({ error: 'Sender account not found or unauthorized' });
    }
    
    // Check balance
    if (parseFloat(fromAccount.balance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Get recipient account
    const toAccount = await prisma.account.findUnique({
      where: { accountNumber: toAccountNumber },
      include: { user: { select: { firstName: true, lastName: true, email: true } } }
    });
    
    if (!toAccount) {
      return res.status(404).json({ error: 'Recipient account not found' });
    }
    
    if (!toAccount.isActive) {
      return res.status(400).json({ error: 'Recipient account is not active' });
    }
    
    // Prevent self-transfer
    if (fromAccount.id === toAccount.id) {
      return res.status(400).json({ error: 'Cannot transfer to the same account' });
    }
    
    // Create transaction reference
    const reference = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Perform transfer in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from sender
      await tx.account.update({
        where: { id: fromAccount.id },
        data: { balance: { decrement: parseFloat(amount) } }
      });
      
      // Add to recipient
      await tx.account.update({
        where: { id: toAccount.id },
        data: { balance: { increment: parseFloat(amount) } }
      });
      
      // Create debit transaction for sender
      const debitTx = await tx.transaction.create({
        data: {
          accountId: fromAccount.id,
          type: 'DEBIT',
          amount: parseFloat(amount),
          description: description || `Transfer to ${toAccount.user.firstName} ${toAccount.user.lastName}`,
          reference,
          status: 'COMPLETED',
          category: 'INTERNAL_TRANSFER',
          merchantName: `${toAccount.user.firstName} ${toAccount.user.lastName}`,
          merchantCategory: toAccountNumber
        }
      });
      
      // Create credit transaction for recipient
      const creditTx = await tx.transaction.create({
        data: {
          accountId: toAccount.id,
          type: 'CREDIT',
          amount: parseFloat(amount),
          description: description || `Transfer from ${fromAccount.accountNumber}`,
          reference,
          status: 'COMPLETED',
          category: 'INTERNAL_TRANSFER',
          merchantName: fromAccount.accountNumber,
          merchantCategory: 'Internal Transfer'
        }
      });
      
      // Create notifications
      await tx.notification.create({
        data: {
          userId: req.user.userId,
          type: 'transaction',
          title: 'Transfer Sent',
          message: `You sent $${amount} to ${toAccount.user.firstName} ${toAccount.user.lastName}`,
          metadata: {
            transactionId: debitTx.id,
            amount: parseFloat(amount),
            reference
          }
        }
      });
      
      await tx.notification.create({
        data: {
          userId: toAccount.userId,
          type: 'transaction',
          title: 'Money Received',
          message: `You received $${amount} from account ${fromAccount.accountNumber}`,
          metadata: {
            transactionId: creditTx.id,
            amount: parseFloat(amount),
            reference
          }
        }
      });
      
      return {
        debitTransaction: debitTx,
        creditTransaction: creditTx,
        reference
      };
    });
    
    console.log('Internal transfer completed:', reference);
    
    res.status(201).json({
      success: true,
      message: 'Transfer completed successfully',
      reference: result.reference,
      amount: parseFloat(amount),
      recipient: {
        name: `${toAccount.user.firstName} ${toAccount.user.lastName}`,
        accountNumber: toAccountNumber
      }
    });
  } catch (error) {
    console.error('Internal transfer error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Transfer failed', details: error.message });
  }
});

// =============================================
// ADMIN ROUTES
// =============================================

/**
 * GET /api/v1/transfers/admin/all
 * Get all transfers (admin only)
 */
transfersRouter.get('/admin/all', isAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    
    const transfers = await prisma.transferRequest.findMany({
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
            accountNumber: true,
            accountType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      count: transfers.length,
      transfers
    });
  } catch (error) {
    console.error('Error getting all transfers:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/transfers/admin/pending
 * Get pending transfers (admin only)
 */
transfersRouter.get('/admin/pending', isAdmin, async (req, res) => {
  try {
    const result = await getPendingTransfers();
    res.json(result);
  } catch (error) {
    console.error('Error getting pending transfers:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/transfers/admin/:id/approve
 * Approve a transfer (admin only)
 */
transfersRouter.post('/admin/:id/approve', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const result = await approveTransfer(id, req.user.userId, notes);
    res.json(result);
  } catch (error) {
    console.error('Error approving transfer:', error);
    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('already') ? 400 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * POST /api/v1/transfers/admin/:id/decline
 * Decline a transfer (admin only)
 */
transfersRouter.post('/admin/:id/decline', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Decline reason is required' });
    }
    
    const result = await declineTransfer(id, req.user.userId, reason, notes);
    res.json(result);
  } catch (error) {
    console.error('Error declining transfer:', error);
    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('already') ? 400 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * POST /api/v1/transfers/admin/:id/reverse
 * Reverse a completed transfer (admin only)
 */
transfersRouter.post('/admin/:id/reverse', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await reverseTransfer(id, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error reversing transfer:', error);
    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('Cannot reverse') ? 400 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

export default transfersRouter;
