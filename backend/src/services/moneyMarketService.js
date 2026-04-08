import prisma from '../config/prisma.js';

// Note: In production, this would integrate with real market data APIs
// For now, we'll use a simple in-memory price system with Redis caching

export const MARKET_ASSETS = {
  CRYPTO: ['BTC', 'ETH', 'USDT', 'BNB', 'SOL'],
  FOREX: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'],
  COMMODITIES: ['GOLD', 'SILVER', 'OIL', 'PLATINUM'],
  STOCKS: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']
};

// Get current market prices (admin managed)
export const getMarketPrices = async (assetType) => {
  // In production, fetch from Redis cache or external API
  // For now, return mock data
  const mockPrices = {
    CRYPTO: {
      BTC: { price: 45000, change24h: 2.5, volume: 25000000000 },
      ETH: { price: 2400, change24h: 1.8, volume: 12000000000 },
      USDT: { price: 1.00, change24h: 0.01, volume: 50000000000 },
      BNB: { price: 320, change24h: -0.5, volume: 1500000000 },
      SOL: { price: 95, change24h: 3.2, volume: 2000000000 }
    },
    FOREX: {
      'EUR/USD': { price: 1.0850, change24h: 0.15, volume: 1000000000 },
      'GBP/USD': { price: 1.2650, change24h: -0.08, volume: 800000000 },
      'USD/JPY': { price: 149.50, change24h: 0.25, volume: 900000000 },
      'AUD/USD': { price: 0.6580, change24h: 0.12, volume: 500000000 },
      'USD/CAD': { price: 1.3650, change24h: -0.05, volume: 600000000 }
    },
    COMMODITIES: {
      GOLD: { price: 2050, change24h: 0.8, volume: 15000000000 },
      SILVER: { price: 24.50, change24h: 1.2, volume: 2000000000 },
      OIL: { price: 82.50, change24h: -1.5, volume: 10000000000 },
      PLATINUM: { price: 950, change24h: 0.5, volume: 1000000000 }
    },
    STOCKS: {
      AAPL: { price: 185.50, change24h: 1.2, volume: 50000000 },
      GOOGL: { price: 140.25, change24h: 0.8, volume: 25000000 },
      MSFT: { price: 380.75, change24h: 1.5, volume: 30000000 },
      AMZN: { price: 155.30, change24h: -0.5, volume: 40000000 },
      TSLA: { price: 245.80, change24h: 2.8, volume: 100000000 }
    }
  };

  return {
    success: true,
    assetType,
    prices: assetType ? mockPrices[assetType] : mockPrices
  };
};

// Admin: Update asset price
export const updateAssetPrice = async (assetType, symbol, price, adminId) => {
  // In production, this would update Redis cache
  // For now, just log the update
  console.log(`Admin ${adminId} updated ${assetType}/${symbol} to $${price}`);
  
  return {
    success: true,
    message: 'Price updated successfully',
    asset: { assetType, symbol, price }
  };
};

// Buy asset
export const buyAsset = async (userId, assetType, symbol, amount, accountId) => {
  // Verify account
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId }
  });

  if (!account) {
    throw new Error('Account not found');
  }

  // Get current price
  const prices = await getMarketPrices(assetType);
  const assetPrice = prices.prices[symbol]?.price;

  if (!assetPrice) {
    throw new Error('Invalid asset');
  }

  const totalCost = amount * assetPrice;

  // Check balance
  if (account.availableBalance < totalCost) {
    throw new Error('Insufficient funds');
  }

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      accountId,
      type: 'MARKET_BUY',
      amount: -totalCost,
      description: `Buy ${amount} ${symbol}`,
      category: assetType,
      merchantName: 'Rosch Capital Markets',
      status: 'COMPLETED',
      metadata: {
        assetType,
        symbol,
        quantity: amount,
        pricePerUnit: assetPrice,
        totalCost
      }
    }
  });

  // Update account balance
  await prisma.account.update({
    where: { id: accountId },
    data: {
      availableBalance: { decrement: totalCost },
      balance: { decrement: totalCost }
    }
  });

  return {
    success: true,
    message: `Successfully purchased ${amount} ${symbol}`,
    transaction: {
      id: transaction.id,
      symbol,
      quantity: amount,
      pricePerUnit: assetPrice,
      totalCost,
      timestamp: transaction.createdAt
    }
  };
};

// Sell asset
export const sellAsset = async (userId, assetType, symbol, amount, accountId) => {
  // Verify account
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId }
  });

  if (!account) {
    throw new Error('Account not found');
  }

  // Get current price
  const prices = await getMarketPrices(assetType);
  const assetPrice = prices.prices[symbol]?.price;

  if (!assetPrice) {
    throw new Error('Invalid asset');
  }

  const totalValue = amount * assetPrice;

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      accountId,
      type: 'MARKET_SELL',
      amount: totalValue,
      description: `Sell ${amount} ${symbol}`,
      category: assetType,
      merchantName: 'Rosch Capital Markets',
      status: 'COMPLETED',
      metadata: {
        assetType,
        symbol,
        quantity: amount,
        pricePerUnit: assetPrice,
        totalValue
      }
    }
  });

  // Update account balance
  await prisma.account.update({
    where: { id: accountId },
    data: {
      availableBalance: { increment: totalValue },
      balance: { increment: totalValue }
    }
  });

  return {
    success: true,
    message: `Successfully sold ${amount} ${symbol}`,
    transaction: {
      id: transaction.id,
      symbol,
      quantity: amount,
      pricePerUnit: assetPrice,
      totalValue,
      timestamp: transaction.createdAt
    }
  };
};

// Get user's market portfolio
export const getUserPortfolio = async (userId) => {
  // Get all market transactions
  const transactions = await prisma.transaction.findMany({
    where: {
      account: { userId },
      type: { in: ['MARKET_BUY', 'MARKET_SELL'] }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate holdings
  const holdings = {};
  
  transactions.forEach(tx => {
    const { symbol, quantity, assetType } = tx.metadata;
    const key = `${assetType}:${symbol}`;
    
    if (!holdings[key]) {
      holdings[key] = {
        assetType,
        symbol,
        quantity: 0,
        totalInvested: 0
      };
    }
    
    if (tx.type === 'MARKET_BUY') {
      holdings[key].quantity += quantity;
      holdings[key].totalInvested += Math.abs(tx.amount);
    } else {
      holdings[key].quantity -= quantity;
      holdings[key].totalInvested -= tx.amount;
    }
  });

  // Filter out zero holdings and calculate current values
  const allPrices = await getMarketPrices();
  const activeHoldings = Object.values(holdings)
    .filter(h => h.quantity > 0)
    .map(h => {
      const currentPrice = allPrices.prices[h.assetType]?.[h.symbol]?.price || 0;
      const currentValue = h.quantity * currentPrice;
      const profitLoss = currentValue - h.totalInvested;
      const profitLossPercent = h.totalInvested > 0 ? (profitLoss / h.totalInvested) * 100 : 0;
      
      return {
        ...h,
        currentPrice,
        currentValue,
        profitLoss,
        profitLossPercent
      };
    });

  return {
    success: true,
    holdings: activeHoldings,
    totalValue: activeHoldings.reduce((sum, h) => sum + h.currentValue, 0),
    totalInvested: activeHoldings.reduce((sum, h) => sum + h.totalInvested, 0)
  };
};

// Get market transaction history
export const getMarketTransactions = async (userId, limit = 50) => {
  const transactions = await prisma.transaction.findMany({
    where: {
      account: { userId },
      type: { in: ['MARKET_BUY', 'MARKET_SELL'] }
    },
    include: {
      account: {
        select: {
          accountNumber: true,
          accountType: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  return {
    success: true,
    count: transactions.length,
    transactions
  };
};

export default {
  getMarketPrices,
  updateAssetPrice,
  buyAsset,
  sellAsset,
  getUserPortfolio,
  getMarketTransactions,
  MARKET_ASSETS
};
