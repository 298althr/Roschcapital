import { Router } from 'express';
import { verifyAuth, isAdmin } from '../middleware/auth.js';
import { checkDebitEligibility } from '../middleware/accountRestrictions.js';
import prisma from '../config/prisma.js';

const recurringPaymentsRouter = Router();

// Protect all routes
recurringPaymentsRouter.use(verifyAuth);

// Generate reference
const generateReference = () => {
  return `REC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
};

// Calculate next execution date
const calculateNextExecutionDate = (frequency, startDate, dayOfMonth, dayOfWeek) => {
  const now = new Date();
  let nextDate = new Date(startDate);
  
  // If start date is in the past, calculate from now
  if (nextDate < now) {
    nextDate = new Date(now);
  }
  
  switch (frequency) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'WEEKLY':
      if (dayOfWeek !== null && dayOfWeek !== undefined) {
        const currentDay = nextDate.getDay();
        const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7 || 7;
        nextDate.setDate(nextDate.getDate() + daysUntilTarget);
      } else {
        nextDate.setDate(nextDate.getDate() + 7);
      }
      break;
    case 'BIWEEKLY':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'MONTHLY':
      if (dayOfMonth) {
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextDate.setDate(Math.min(dayOfMonth, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()));
      } else {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      break;
    case 'QUARTERLY':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'YEARLY':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  
  return nextDate;
};

/**
 * GET /api/v1/recurring-payments
 * Get user's recurring payments
 */
recurringPaymentsRouter.get('/', async (req, res) => {
  try {
    console.log('Fetching recurring payments for user:', req.user.userId);
    const payments = await prisma.recurringPayment.findMany({
      where: { userId: req.user.userId },
      include: {
        fromAccount: {
          select: { accountNumber: true, accountType: true, balance: true }
        },
        toAccount: {
          select: { accountNumber: true, accountType: true }
        },
        executions: {
          take: 5,
          orderBy: { executionDate: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('Found recurring payments:', payments?.length || 0);
    res.json({
      success: true,
      count: payments?.length || 0,
      payments: payments || []
    });
  } catch (error) {
    console.error('Error getting recurring payments:', error);
    // Return empty array instead of error for better UX
    res.json({ success: true, count: 0, payments: [] });
  }
});

/**
 * GET /api/v1/recurring-payments/:id
 * Get specific recurring payment
 */
recurringPaymentsRouter.get('/:id', async (req, res) => {
  try {
    const payment = await prisma.recurringPayment.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
      include: {
        fromAccount: {
          select: { accountNumber: true, accountType: true, balance: true }
        },
        toAccount: {
          select: { accountNumber: true, accountType: true }
        },
        executions: {
          orderBy: { executionDate: 'desc' },
          take: 20
        }
      }
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Recurring payment not found' });
    }
    
    res.json({ success: true, payment });
  } catch (error) {
    console.error('Error getting recurring payment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/recurring-payments
 * Create a new recurring payment
 * PND and SUSPENDED users cannot create recurring payments
 */
recurringPaymentsRouter.post('/', checkDebitEligibility, async (req, res) => {
  try {
    const {
      fromAccountId,
      paymentType,
      recipientName,
      recipientBank,
      recipientAccount,
      recipientRouting,
      toAccountNumber, // For internal transfers
      amount,
      description,
      frequency,
      startDate,
      endDate,
      dayOfMonth,
      dayOfWeek,
      maxExecutions
    } = req.body;
    
    // Validate required fields
    if (!fromAccountId || !paymentType || !recipientName || !amount || !frequency || !startDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate amount
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    
    // Validate frequency
    const validFrequencies = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({ error: 'Invalid frequency' });
    }
    
    // Verify account belongs to user
    const fromAccount = await prisma.account.findFirst({
      where: { id: fromAccountId, userId: req.user.userId }
    });
    
    if (!fromAccount) {
      return res.status(404).json({ error: 'Source account not found' });
    }
    
    // For internal transfers, find recipient account
    let toAccountId = null;
    if (paymentType === 'INTERNAL' && toAccountNumber) {
      const toAccount = await prisma.account.findUnique({
        where: { accountNumber: toAccountNumber }
      });
      if (!toAccount) {
        return res.status(404).json({ error: 'Recipient account not found' });
      }
      toAccountId = toAccount.id;
    }
    
    const reference = generateReference();
    const parsedStartDate = new Date(startDate);
    const nextExecutionDate = calculateNextExecutionDate(frequency, parsedStartDate, dayOfMonth, dayOfWeek);
    
    const payment = await prisma.recurringPayment.create({
      data: {
        userId: req.user.userId,
        fromAccountId,
        paymentType,
        recipientName,
        recipientBank: recipientBank || null,
        recipientAccount: recipientAccount || null,
        recipientRouting: recipientRouting || null,
        toAccountId,
        amount: parseFloat(amount),
        description: description || null,
        reference,
        frequency,
        startDate: parsedStartDate,
        endDate: endDate ? new Date(endDate) : null,
        nextExecutionDate,
        dayOfMonth: dayOfMonth || null,
        dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : null,
        maxExecutions: maxExecutions || null,
        status: 'ACTIVE'
      },
      include: {
        fromAccount: {
          select: { accountNumber: true, accountType: true }
        }
      }
    });
    
    // Create notification
    await prisma.notification.create({
      data: {
        userId: req.user.userId,
        type: 'payment',
        title: 'Recurring Payment Created',
        message: `Your ${frequency.toLowerCase()} payment of $${amount} to ${recipientName} has been set up.`,
        metadata: {
          recurringPaymentId: payment.id,
          reference: payment.reference
        }
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Recurring payment created successfully',
      payment
    });
  } catch (error) {
    console.error('Error creating recurring payment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/recurring-payments/:id
 * Update a recurring payment
 */
recurringPaymentsRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, frequency, endDate, dayOfMonth, dayOfWeek, maxExecutions } = req.body;
    
    const payment = await prisma.recurringPayment.findFirst({
      where: { id, userId: req.user.userId }
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Recurring payment not found' });
    }
    
    if (payment.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot update cancelled payment' });
    }
    
    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (description !== undefined) updateData.description = description;
    if (frequency !== undefined) {
      updateData.frequency = frequency;
      updateData.nextExecutionDate = calculateNextExecutionDate(frequency, new Date(), dayOfMonth, dayOfWeek);
    }
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (dayOfMonth !== undefined) updateData.dayOfMonth = dayOfMonth;
    if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek;
    if (maxExecutions !== undefined) updateData.maxExecutions = maxExecutions;
    
    const updated = await prisma.recurringPayment.update({
      where: { id },
      data: updateData,
      include: {
        fromAccount: {
          select: { accountNumber: true, accountType: true }
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Recurring payment updated',
      payment: updated
    });
  } catch (error) {
    console.error('Error updating recurring payment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/recurring-payments/:id/pause
 * Pause a recurring payment
 */
recurringPaymentsRouter.post('/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await prisma.recurringPayment.findFirst({
      where: { id, userId: req.user.userId }
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Recurring payment not found' });
    }
    
    if (payment.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Can only pause active payments' });
    }
    
    const updated = await prisma.recurringPayment.update({
      where: { id },
      data: {
        status: 'PAUSED',
        pausedAt: new Date()
      }
    });
    
    res.json({
      success: true,
      message: 'Recurring payment paused',
      payment: updated
    });
  } catch (error) {
    console.error('Error pausing recurring payment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/recurring-payments/:id/resume
 * Resume a paused recurring payment
 */
recurringPaymentsRouter.post('/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await prisma.recurringPayment.findFirst({
      where: { id, userId: req.user.userId }
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Recurring payment not found' });
    }
    
    if (payment.status !== 'PAUSED') {
      return res.status(400).json({ error: 'Can only resume paused payments' });
    }
    
    const nextExecutionDate = calculateNextExecutionDate(
      payment.frequency,
      new Date(),
      payment.dayOfMonth,
      payment.dayOfWeek
    );
    
    const updated = await prisma.recurringPayment.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        pausedAt: null,
        pausedBy: null,
        nextExecutionDate
      }
    });
    
    res.json({
      success: true,
      message: 'Recurring payment resumed',
      payment: updated
    });
  } catch (error) {
    console.error('Error resuming recurring payment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/recurring-payments/:id/cancel
 * Cancel a recurring payment
 */
recurringPaymentsRouter.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await prisma.recurringPayment.findFirst({
      where: { id, userId: req.user.userId }
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Recurring payment not found' });
    }
    
    if (payment.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Payment already cancelled' });
    }
    
    const updated = await prisma.recurringPayment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    });
    
    res.json({
      success: true,
      message: 'Recurring payment cancelled',
      payment: updated
    });
  } catch (error) {
    console.error('Error cancelling recurring payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// ADMIN ROUTES
// =============================================

/**
 * GET /api/v1/recurring-payments/admin/all
 * Get all recurring payments (admin only)
 */
recurringPaymentsRouter.get('/admin/all', isAdmin, async (req, res) => {
  try {
    const { status, userId } = req.query;
    
    const where = {};
    if (status && status !== 'all') where.status = status;
    if (userId) where.userId = userId;
    
    const payments = await prisma.recurringPayment.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        fromAccount: {
          select: { accountNumber: true, accountType: true }
        },
        toAccount: {
          select: { accountNumber: true, accountType: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    console.error('Error getting all recurring payments:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/recurring-payments/admin/:id
 * Update any recurring payment (admin god mode)
 */
recurringPaymentsRouter.put('/admin/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, status, frequency, nextExecutionDate, maxExecutions } = req.body;
    
    const payment = await prisma.recurringPayment.findUnique({
      where: { id }
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Recurring payment not found' });
    }
    
    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (status !== undefined) updateData.status = status;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (nextExecutionDate !== undefined) updateData.nextExecutionDate = new Date(nextExecutionDate);
    if (maxExecutions !== undefined) updateData.maxExecutions = maxExecutions;
    
    const updated = await prisma.recurringPayment.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    });
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: payment.userId,
        action: 'ADMIN_RECURRING_PAYMENT_UPDATED',
        details: `Admin updated recurring payment ${id}`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    });
    
    res.json({
      success: true,
      message: 'Recurring payment updated',
      payment: updated
    });
  } catch (error) {
    console.error('Error updating recurring payment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/recurring-payments/admin/:id
 * Delete a recurring payment (admin god mode)
 */
recurringPaymentsRouter.delete('/admin/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await prisma.recurringPayment.findUnique({
      where: { id }
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Recurring payment not found' });
    }
    
    // Delete executions first
    await prisma.recurringPaymentExecution.deleteMany({
      where: { recurringPaymentId: id }
    });
    
    // Delete the payment
    await prisma.recurringPayment.delete({
      where: { id }
    });
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: payment.userId,
        action: 'ADMIN_RECURRING_PAYMENT_DELETED',
        details: `Admin deleted recurring payment ${id}`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    });
    
    res.json({
      success: true,
      message: 'Recurring payment deleted'
    });
  } catch (error) {
    console.error('Error deleting recurring payment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/recurring-payments/admin/create
 * Create recurring payment for user (admin god mode)
 */
recurringPaymentsRouter.post('/admin/create', isAdmin, async (req, res) => {
  try {
    const {
      userId,
      fromAccountId,
      paymentType,
      recipientName,
      recipientBank,
      recipientAccount,
      recipientRouting,
      amount,
      description,
      frequency,
      startDate,
      status = 'ACTIVE'
    } = req.body;
    
    if (!userId || !fromAccountId || !paymentType || !recipientName || !amount || !frequency || !startDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const reference = generateReference();
    const parsedStartDate = new Date(startDate);
    const nextExecutionDate = calculateNextExecutionDate(frequency, parsedStartDate, null, null);
    
    const payment = await prisma.recurringPayment.create({
      data: {
        userId,
        fromAccountId,
        paymentType,
        recipientName,
        recipientBank: recipientBank || null,
        recipientAccount: recipientAccount || null,
        recipientRouting: recipientRouting || null,
        amount: parseFloat(amount),
        description: description || null,
        reference,
        frequency,
        startDate: parsedStartDate,
        nextExecutionDate,
        status,
        createdBy: req.user.userId
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    });
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_RECURRING_PAYMENT_CREATED',
        details: `Admin created recurring payment of $${amount} to ${recipientName}`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Recurring payment created',
      payment
    });
  } catch (error) {
    console.error('Error creating recurring payment:', error);
    res.status(500).json({ error: error.message });
  }
});

export default recurringPaymentsRouter;
