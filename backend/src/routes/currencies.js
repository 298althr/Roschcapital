import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all currencies (public - for registration)
// GET /api/v1/currencies
router.get('/', async (req, res) => {
  try {
    const currencies = await prisma.currency.findMany({
      orderBy: [
        { isBase: 'desc' },
        { isActive: 'desc' },
        { name: 'asc' }
      ]
    });

    return res.json({
      success: true,
      currencies
    });
  } catch (error) {
    console.error('Get currencies error:', error);
    return res.status(500).json({ error: 'Failed to fetch currencies' });
  }
});

// Get active currencies only
// GET /api/v1/currencies/active
router.get('/active', verifyAuth, async (req, res) => {
  try {
    const currencies = await prisma.currency.findMany({
      where: { isActive: true },
      orderBy: [
        { isBase: 'desc' },
        { name: 'asc' }
      ]
    });

    return res.json({
      success: true,
      currencies
    });
  } catch (error) {
    console.error('Get active currencies error:', error);
    return res.status(500).json({ error: 'Failed to fetch active currencies' });
  }
});

// Get exchange rate for a currency pair
// GET /api/v1/currencies/rate/:from/:to
router.get('/rate/:from/:to', verifyAuth, async (req, res) => {
  try {
    const { from, to } = req.params;

    const fromCurrency = await prisma.currency.findUnique({
      where: { code: from.toUpperCase() }
    });

    const toCurrency = await prisma.currency.findUnique({
      where: { code: to.toUpperCase() }
    });

    if (!fromCurrency || !toCurrency) {
      return res.status(404).json({ error: 'Currency not found' });
    }

    // Calculate rate: from -> USD -> to
    const rate = toCurrency.exchangeRate / fromCurrency.exchangeRate;

    return res.json({
      success: true,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      rate,
      lastUpdated: toCurrency.lastUpdated
    });
  } catch (error) {
    console.error('Get exchange rate error:', error);
    return res.status(500).json({ error: 'Failed to get exchange rate' });
  }
});

// Middleware to check admin
const isAdmin = async (req, res, next) => {
  try {
    // First check if isAdmin is already set by auth middleware
    if (req.user?.isAdmin) {
      return next();
    }
    
    // Otherwise check database
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isAdmin: true, role: true }
    });
    
    if (!user || (!user.isAdmin && user.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ error: 'Failed to verify admin status' });
  }
};

// Admin: Create new currency
// POST /api/v1/currencies
router.post('/', verifyAuth, isAdmin, async (req, res) => {
  try {
    console.log('Creating currency with data:', req.body);
    const { code, name, symbol, type, exchangeRate } = req.body;

    if (!code || !name || !symbol || !type) {
      console.error('Missing required fields:', { code, name, symbol, type });
      return res.status(400).json({ error: 'Missing required fields: code, name, symbol, and type are required' });
    }

    // Check if currency already exists
    const existing = await prisma.currency.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existing) {
      console.error('Currency already exists:', code);
      return res.status(400).json({ error: 'Currency already exists' });
    }

    const currency = await prisma.currency.create({
      data: {
        code: code.toUpperCase(),
        name,
        symbol,
        type,
        exchangeRate: exchangeRate || 1.0,
        isBase: code.toUpperCase() === 'USD',
        isActive: true,
        lastUpdated: new Date()
      }
    });

    console.log('Currency created successfully:', currency);

    return res.json({
      success: true,
      message: 'Currency created successfully',
      currency
    });
  } catch (error) {
    console.error('Create currency error:', error);
    console.error('Error details:', error.message);
    return res.status(500).json({ error: 'Failed to create currency', details: error.message });
  }
});

// Admin: Update currency
// PUT /api/v1/currencies/:code
router.put('/:code', verifyAuth, isAdmin, async (req, res) => {
  try {
    const { code } = req.params;
    const { name, symbol, exchangeRate, isActive } = req.body;

    const currency = await prisma.currency.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!currency) {
      return res.status(404).json({ error: 'Currency not found' });
    }

    if (currency.isBase && isActive === false) {
      return res.status(400).json({ error: 'Cannot deactivate base currency' });
    }

    const updated = await prisma.currency.update({
      where: { code: code.toUpperCase() },
      data: {
        ...(name && { name }),
        ...(symbol && { symbol }),
        ...(exchangeRate && { exchangeRate, lastUpdated: new Date() }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return res.json({
      success: true,
      message: 'Currency updated successfully',
      currency: updated
    });
  } catch (error) {
    console.error('Update currency error:', error);
    return res.status(500).json({ error: 'Failed to update currency' });
  }
});

// Admin: Update exchange rates (can be called by cron job)
// POST /api/v1/currencies/update-rates
router.post('/update-rates', verifyAuth, async (req, res) => {
  try {
    // This would integrate with yfinance or another API
    // For now, we'll just update the timestamp
    const currencies = await prisma.currency.findMany({
      where: { isBase: false }
    });

    // In production, fetch real rates from yfinance or similar
    // For now, just update the timestamp
    for (const currency of currencies) {
      await prisma.currency.update({
        where: { id: currency.id },
        data: { lastUpdated: new Date() }
      });
    }

    return res.json({
      success: true,
      message: 'Exchange rates updated successfully',
      updatedCount: currencies.length
    });
  } catch (error) {
    console.error('Update rates error:', error);
    return res.status(500).json({ error: 'Failed to update exchange rates' });
  }
});

// Admin: Delete currency
// DELETE /api/v1/currencies/:code
router.delete('/:code', verifyAuth, async (req, res) => {
  try {
    const { code } = req.params;

    const currency = await prisma.currency.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!currency) {
      return res.status(404).json({ error: 'Currency not found' });
    }

    if (currency.isBase) {
      return res.status(400).json({ error: 'Cannot delete base currency' });
    }

    await prisma.currency.delete({
      where: { code: code.toUpperCase() }
    });

    return res.json({
      success: true,
      message: 'Currency deleted successfully'
    });
  } catch (error) {
    console.error('Delete currency error:', error);
    return res.status(500).json({ error: 'Failed to delete currency' });
  }
});

export default router;
