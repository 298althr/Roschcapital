/**
 * Performance Optimization Utilities
 * Database query optimization and caching
 */

import prisma from '../config/prisma.js';
import redis from '../config/redis.js';

/**
 * Cache wrapper for database queries
 * @param {string} key - Cache key
 * @param {Function} queryFn - Function that returns the data
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 */
export const cacheQuery = async (key, queryFn, ttl = 300) => {
  try {
    // Try to get from cache
    const cached = await redis.get(key);
    if (cached) {
      console.log(`📦 Cache hit: ${key}`);
      return JSON.parse(cached);
    }

    // Cache miss - fetch from database
    console.log(`🔍 Cache miss: ${key}`);
    const data = await queryFn();

    // Store in cache
    await redis.setex(key, ttl, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Cache error:', error);
    // Fallback to direct query if cache fails
    return await queryFn();
  }
};

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Redis key pattern (e.g., 'user:123:*')
 */
export const invalidateCache = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️  Invalidated ${keys.length} cache entries: ${pattern}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

/**
 * Optimized user query with minimal fields
 */
export const getUserOptimized = async (userId) => {
  return await cacheQuery(`user:${userId}`, async () => {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        accountStatus: true,
        kycStatus: true,
        isAdmin: true,
        profilePhoto: true,
        createdAt: true
      }
    });
  }, 600); // Cache for 10 minutes
};

/**
 * Optimized account summary query
 */
export const getAccountSummaryOptimized = async (userId) => {
  return await cacheQuery(`account:summary:${userId}`, async () => {
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: {
        id: true,
        accountNumber: true,
        accountType: true,
        currency: true,
        balance: true,
        availableBalance: true,
        isPrimary: true,
        status: true
      }
    });

    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const totalAvailable = accounts.reduce((sum, acc) => sum + Number(acc.availableBalance), 0);

    return {
      accounts,
      totalBalance,
      totalAvailable,
      accountCount: accounts.length
    };
  }, 300); // Cache for 5 minutes
};

/**
 * Optimized transaction query with pagination
 */
export const getTransactionsOptimized = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  return await prisma.transaction.findMany({
    where: {
      OR: [
        { fromAccountId: { in: await getUserAccountIds(userId) } },
        { toAccountId: { in: await getUserAccountIds(userId) } }
      ]
    },
    select: {
      id: true,
      type: true,
      amount: true,
      currency: true,
      status: true,
      description: true,
      createdAt: true,
      fromAccount: {
        select: {
          accountNumber: true,
          accountType: true
        }
      },
      toAccount: {
        select: {
          accountNumber: true,
          accountType: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit
  });
};

/**
 * Get user account IDs (helper function)
 */
const getUserAccountIds = async (userId) => {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true }
  });
  return accounts.map(acc => acc.id);
};

/**
 * Batch update cache invalidation
 * Call this after any data modification
 */
export const invalidateUserCache = async (userId) => {
  await Promise.all([
    invalidateCache(`user:${userId}`),
    invalidateCache(`account:summary:${userId}`),
    invalidateCache(`cards:${userId}:*`),
    invalidateCache(`transactions:${userId}:*`)
  ]);
};

/**
 * Database connection pool monitoring
 */
export const monitorDatabasePool = () => {
  setInterval(async () => {
    try {
      const metrics = await prisma.$metrics.json();
      console.log('📊 Database Pool Metrics:', {
        activeConnections: metrics.counters?.find(c => c.key === 'prisma_client_queries_active')?.value || 0,
        totalQueries: metrics.counters?.find(c => c.key === 'prisma_client_queries_total')?.value || 0
      });
    } catch (error) {
      // Metrics not available in all Prisma versions
    }
  }, 60000); // Every minute
};

/**
 * Slow query logger
 */
export const logSlowQuery = (queryName, duration) => {
  if (duration > 1000) {
    console.warn(`🐌 Slow query detected: ${queryName} took ${duration}ms`);
  }
};

/**
 * Query performance wrapper
 */
export const measureQuery = async (queryName, queryFn) => {
  const start = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    logSlowQuery(queryName, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`❌ Query failed: ${queryName} (${duration}ms)`, error);
    throw error;
  }
};

/**
 * Optimize database indexes
 * Run this to create recommended indexes
 */
export const createRecommendedIndexes = async () => {
  console.log('📊 Creating recommended database indexes...');
  
  try {
    // Note: Indexes should be created via Prisma schema
    // This is just a reference for manual optimization
    const recommendations = [
      'CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);',
      'CREATE INDEX IF NOT EXISTS idx_account_user ON "Account"("userId");',
      'CREATE INDEX IF NOT EXISTS idx_account_number ON "Account"("accountNumber");',
      'CREATE INDEX IF NOT EXISTS idx_transaction_from ON "Transaction"("fromAccountId");',
      'CREATE INDEX IF NOT EXISTS idx_transaction_to ON "Transaction"("toAccountId");',
      'CREATE INDEX IF NOT EXISTS idx_transaction_created ON "Transaction"("createdAt" DESC);',
      'CREATE INDEX IF NOT EXISTS idx_card_user ON "Card"("userId");',
      'CREATE INDEX IF NOT EXISTS idx_card_number ON "Card"("cardNumber");',
      'CREATE INDEX IF NOT EXISTS idx_deposit_user ON "Deposit"("userId");',
      'CREATE INDEX IF NOT EXISTS idx_deposit_status ON "Deposit"("status");',
      'CREATE INDEX IF NOT EXISTS idx_withdrawal_user ON "Withdrawal"("userId");',
      'CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON "Withdrawal"("status");'
    ];

    console.log('Recommended indexes (add to Prisma schema):');
    recommendations.forEach(idx => console.log(`  - ${idx}`));
  } catch (error) {
    console.error('Index creation error:', error);
  }
};

export default {
  cacheQuery,
  invalidateCache,
  getUserOptimized,
  getAccountSummaryOptimized,
  getTransactionsOptimized,
  invalidateUserCache,
  monitorDatabasePool,
  logSlowQuery,
  measureQuery,
  createRecommendedIndexes
};
