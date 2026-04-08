import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import {
  getUserAccounts,
  getAccountById,
  getAccountSummary,
  getAccountStats,
  createAccount,
  getAccountsByType,
  getAccountBalances,
} from '../services/accountService.js';

export const accountsRouter = Router();

// Protect all account routes
accountsRouter.use(verifyAuth);

/**
 * GET /api/v1/accounts
 * Get all accounts for the current user
 */
accountsRouter.get('/', async (req, res) => {
  try {
    const result = await getUserAccounts(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /accounts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/accounts/summary
 * Get account summary (total balance, card count, recent transactions)
 */
accountsRouter.get('/summary/overview', async (req, res) => {
  try {
    const result = await getAccountSummary(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /accounts/summary:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/accounts/stats
 * Get account statistics for analytics
 */
accountsRouter.get('/stats/analytics', async (req, res) => {
  try {
    const result = await getAccountStats(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /accounts/stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/accounts
 * Create a new account
 */
accountsRouter.post('/', async (req, res) => {
  try {
    const { accountType, accountName } = req.body;
    
    if (!accountType) {
      return res.status(400).json({ error: 'Account type is required' });
    }
    
    const validTypes = ['CHECKING', 'SAVINGS', 'BUSINESS', 'CRYPTO_WALLET'];
    if (!validTypes.includes(accountType)) {
      return res.status(400).json({ error: 'Invalid account type' });
    }
    
    const account = await createAccount(req.user.userId, accountType, accountName);
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      account
    });
  } catch (error) {
    console.error('Error in POST /accounts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/accounts/type/:type
 * Get accounts by type
 */
accountsRouter.get('/type/:type', async (req, res) => {
  try {
    const accounts = await getAccountsByType(req.user.userId, req.params.type);
    res.json({ success: true, accounts });
  } catch (error) {
    console.error('Error in GET /accounts/type/:type:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/accounts/:id/transactions
 * Get transactions for a specific account with date filtering
 */
accountsRouter.get('/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;
    
    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: {
        id,
        userId: req.user.userId
      }
    });
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    
    const transactions = await prisma.transaction.findMany({
      where: {
        accountId: id,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });
    
    res.json({
      success: true,
      transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error('Error in GET /accounts/:id/transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/accounts/:id/balances
 * Get balance breakdown for an account
 */
accountsRouter.get('/:id/balances', async (req, res) => {
  try {
    const result = await getAccountBalances(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /accounts/:id/balances:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * GET /api/v1/accounts/:id
 * Get a specific account by ID
 */
accountsRouter.get('/:id', async (req, res) => {
  try {
    const result = await getAccountById(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /accounts/:id:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});
