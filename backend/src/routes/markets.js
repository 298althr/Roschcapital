import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import {
  getMarketPrices,
  buyAsset,
  sellAsset,
  getUserPortfolio,
  getMarketTransactions,
  MARKET_ASSETS
} from '../services/moneyMarketService.js';

export const marketsRouter = Router();

// Protect all routes
marketsRouter.use(verifyAuth);

/**
 * GET /api/v1/markets/prices
 * Get current market prices
 */
marketsRouter.get('/prices', async (req, res) => {
  try {
    const { assetType } = req.query;
    const result = await getMarketPrices(assetType);
    res.json(result);
  } catch (error) {
    console.error('Error getting market prices:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/markets/assets
 * Get available assets
 */
marketsRouter.get('/assets', async (req, res) => {
  try {
    res.json({
      success: true,
      assets: MARKET_ASSETS
    });
  } catch (error) {
    console.error('Error getting assets:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/markets/buy
 * Buy asset
 */
marketsRouter.post('/buy', async (req, res) => {
  try {
    const { assetType, symbol, amount, accountId } = req.body;
    
    if (!assetType || !symbol || !amount || !accountId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await buyAsset(
      req.user.userId,
      assetType,
      symbol,
      parseFloat(amount),
      accountId
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error buying asset:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/markets/sell
 * Sell asset
 */
marketsRouter.post('/sell', async (req, res) => {
  try {
    const { assetType, symbol, amount, accountId } = req.body;
    
    if (!assetType || !symbol || !amount || !accountId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await sellAsset(
      req.user.userId,
      assetType,
      symbol,
      parseFloat(amount),
      accountId
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error selling asset:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/markets/portfolio
 * Get user's portfolio
 */
marketsRouter.get('/portfolio', async (req, res) => {
  try {
    const result = await getUserPortfolio(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error getting portfolio:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/markets/transactions
 * Get market transactions
 */
marketsRouter.get('/transactions', async (req, res) => {
  try {
    const { limit } = req.query;
    const result = await getMarketTransactions(
      req.user.userId,
      limit ? parseInt(limit) : 50
    );
    res.json(result);
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

export default marketsRouter;
