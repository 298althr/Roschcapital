import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import {
  getUserTransactions,
  getTransactionById,
  createTransaction,
  getTransactionsByCategory,
  getSpendingSummary,
} from '../services/transactionService.js';
import { generateTransactionReceipt, getReceiptData } from '../services/receiptService.js';

export const transactionsRouter = Router();

// Protect all transaction routes
transactionsRouter.use(verifyAuth);

/**
 * GET /api/v1/transactions
 * Get all transactions for the current user
 * Query params: accountId (optional), limit (default 50), offset (default 0)
 */
transactionsRouter.get('/', async (req, res) => {
  try {
    const accountId = req.query.accountId || null;
    const limit = Math.min(parseInt(req.query.limit) || 50, 10000);
    const offset = parseInt(req.query.offset) || 0;

    const result = await getUserTransactions(req.user.userId, accountId, limit, offset);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/transactions/summary
 * Get spending summary for analytics
 */
transactionsRouter.get('/summary/spending', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = await getSpendingSummary(req.user.userId, days);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /transactions/summary:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/transactions/category/:category
 * Get transactions by category
 */
transactionsRouter.get('/category/:category', async (req, res) => {
  try {
    const result = await getTransactionsByCategory(
      req.user.userId,
      req.params.category,
      parseInt(req.query.limit) || 50
    );
    res.json(result);
  } catch (error) {
    console.error('Error in GET /transactions/category/:category:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/transactions/:id/receipt
 * Download PDF receipt for a transaction
 * NOTE: This route MUST come before /:id to avoid being caught by the generic route
 */
transactionsRouter.get('/:id/receipt', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user.userId;

    console.log(`Generating receipt for transaction: ${transactionId}, user: ${userId}`);

    // Generate PDF receipt
    const pdfBuffer = await generateTransactionReceipt(transactionId, userId);

    // Get receipt data for filename
    const receiptData = await getReceiptData(transactionId, userId);
    const filename = `RoschCapital_Receipt_${receiptData.reference || transactionId}.pdf`;

    console.log(`Receipt generated successfully, size: ${pdfBuffer.length} bytes`);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating receipt:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * GET /api/v1/transactions/:id/receipt/preview
 * Get receipt data for preview (without downloading PDF)
 */
transactionsRouter.get('/:id/receipt/preview', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user.userId;

    const receiptData = await getReceiptData(transactionId, userId);
    res.json(receiptData);
  } catch (error) {
    console.error('Error getting receipt preview:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * GET /api/v1/transactions/:id
 * Get a specific transaction by ID
 * NOTE: This route MUST come after more specific routes like /:id/receipt
 */
transactionsRouter.get('/:id', async (req, res) => {
  try {
    const result = await getTransactionById(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /transactions/:id:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * POST /api/v1/transactions
 * Create a new transaction (admin/system use)
 */
transactionsRouter.post('/', async (req, res) => {
  try {
    const { accountId, cardId, amount, type, description, category, merchantName } = req.body;

    if (!accountId || !amount || !type || !description) {
      return res.status(400).json({
        error: 'Missing required fields: accountId, amount, type, description',
      });
    }
    const result = await createTransaction(accountId, {
      cardId,
      amount,
      type,
      description,
      category,
      merchantName,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Error in POST /transactions:', error);
    return res.status(500).json({ error: error.message });
  }
});