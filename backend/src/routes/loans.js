import express from 'express';
import { verifyAuth, isAdmin } from '../middleware/auth.js';
import * as loanService from '../services/loanService.js';

const loansRouter = express.Router();

/**
 * POST /api/v1/loans
 * Create a loan application
 */
loansRouter.post('/', verifyAuth, async (req, res) => {
  try {
    const { loanType, amount, termMonths, purpose } = req.body;

    const loan = await loanService.createLoanApplication(req.user.userId, {
      loanType,
      amount,
      termMonths,
      purpose
    });

    return res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
      loan
    });
  } catch (error) {
    console.error('Error in POST /loans:', error);

    if (error.message.includes('Invalid') || error.message.includes('must be')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/loans
 * Get user's loans
 */
loansRouter.get('/', verifyAuth, async (req, res) => {
  try {
    const { status } = req.query;
    console.log('Fetching loans for user:', req.user.userId);

    const loans = await loanService.getUserLoans(req.user.userId, {
      status
    });

    console.log('Found loans:', loans?.length || 0);
    return res.json({
      success: true,
      loans: loans || []
    });
  } catch (error) {
    console.error('Error in GET /loans:', error);
    // Return empty array instead of error for better UX
    return res.json({ success: true, loans: [] });
  }
});

/**
 * GET /api/v1/loans/:id
 * Get loan details
 */
loansRouter.get('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await loanService.getLoanById(id, req.user.userId);

    return res.json({
      success: true,
      loan
    });
  } catch (error) {
    console.error('Error in GET /loans/:id:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/loans/:id/schedule
 * Get payment schedule for a loan
 */
loansRouter.get('/:id/schedule', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await loanService.getPaymentSchedule(id, req.user.userId);

    return res.json({
      success: true,
      schedule
    });
  } catch (error) {
    console.error('Error in GET /loans/:id/schedule:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/loans/:id/repay
 * Make a loan payment
 */
loansRouter.post('/:id/repay', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const result = await loanService.makeLoanPayment(id, req.user.userId, amount);

    return res.json({
      success: true,
      message: 'Payment processed successfully',
      ...result
    });
  } catch (error) {
    console.error('Error in POST /loans/:id/repay:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    if (error.message.includes('Insufficient') || error.message.includes('not active') || error.message.includes('paid off')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/loans/admin/all
 * Get all loans (admin only)
 */
loansRouter.get('/admin/all', verifyAuth, isAdmin, async (req, res) => {
  try {
    const { status, userId } = req.query;

    const loans = await loanService.getAllLoans({
      status,
      userId
    });

    return res.json({
      success: true,
      loans
    });
  } catch (error) {
    console.error('Error in GET /loans/admin/all:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/loans/admin/pending
 * Get pending loans (admin only)
 */
loansRouter.get('/admin/pending', verifyAuth, isAdmin, async (req, res) => {
  try {
    const loans = await loanService.getPendingLoans();

    return res.json({
      success: true,
      loans
    });
  } catch (error) {
    console.error('Error in GET /loans/admin/pending:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/loans/admin/:id/approve
 * Approve a loan (admin only)
 */
loansRouter.post('/admin/:id/approve', verifyAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { interestRate, termMonths } = req.body;

    const result = await loanService.approveLoan(id, req.user.userId, {
      interestRate,
      termMonths
    });

    return res.json({
      success: true,
      message: 'Loan approved successfully',
      ...result
    });
  } catch (error) {
    console.error('Error in POST /loans/admin/:id/approve:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    if (error.message.includes('already')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/loans/admin/:id/decline
 * Decline a loan (admin only)
 */
loansRouter.post('/admin/:id/decline', verifyAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const loan = await loanService.declineLoan(id, req.user.userId, reason);

    return res.json({
      success: true,
      message: 'Loan declined',
      loan
    });
  } catch (error) {
    console.error('Error in POST /loans/admin/:id/decline:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    if (error.message.includes('already')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

export { loansRouter };
