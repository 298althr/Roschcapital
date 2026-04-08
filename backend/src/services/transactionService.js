import prisma from '../config/prisma.js';

// Get paginated transactions for a user (optionally filtered by account)
export const getUserTransactions = async (userId, accountId = null, limit = 50, offset = 0) => {
  const where = {
    account: {
      userId,
    },
  };

  if (accountId) {
    where.accountId = accountId;
  }

  // Get regular account transactions
  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
    include: {
      account: true,
      card: true,
    },
  });

  // Get card transactions (both debit and credit cards)
  const cardTransactions = await prisma.cardTransaction.findMany({
    where: {
      userId
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      debitCard: {
        include: {
          account: true
        }
      },
      creditCard: true
    }
  });

  // Format card transactions to match regular transaction structure
  const formattedCardTxs = cardTransactions.map(tx => ({
    id: tx.id,
    accountId: tx.debitCard?.accountId || null,
    amount: tx.amount,
    type: parseFloat(tx.amount) < 0 ? 'DEBIT' : 'CREDIT',
    description: `Card Transaction - ${tx.merchantName}`,
    category: tx.merchantCategory || 'card_transaction',
    merchantName: tx.merchantName,
    status: tx.status,
    createdAt: tx.createdAt,
    account: tx.debitCard?.account || null,
    cardType: tx.debitCardId ? 'DEBIT' : 'CREDIT',
    cardId: tx.debitCardId || tx.creditCardId
  }));

  // Combine and sort all transactions
  const allTransactions = [...transactions, ...formattedCardTxs]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);

  return { transactions: allTransactions };
};

// Get single transaction by ID, ensuring it belongs to the user
export const getTransactionById = async (id, userId) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id,
      account: {
        userId,
      },
    },
    include: {
      account: true,
      card: true,
    },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  return transaction;
};

// Create a new transaction for an account
export const createTransaction = async (
  accountId,
  { cardId = null, amount, type, description, category = null, merchantName = null }
) => {
  // Ensure account exists
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) {
    throw new Error('Account not found');
  }

  const transaction = await prisma.transaction.create({
    data: {
      accountId,
      cardId,
      amount,
      type,
      description,
      category,
      merchantName,
      status: 'COMPLETED',
    },
  });

  return transaction;
};

// Get transactions by category for a user
export const getTransactionsByCategory = async (userId, category, limit = 50) => {
  const transactions = await prisma.transaction.findMany({
    where: {
      category,
      account: {
        userId,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return { transactions };
};

// Simple spending summary over the last N days
export const getSpendingSummary = async (userId, days = 30) => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const transactions = await prisma.transaction.findMany({
    where: {
      account: {
        userId,
      },
      createdAt: {
        gte: since,
      },
    },
  });

  // Aggregate by category and total amount
  const summaryByCategory = {};
  let total = 0;

  for (const tx of transactions) {
    const key = tx.category || 'uncategorized';
    const amountNumber = Number(tx.amount);

    total += amountNumber;
    summaryByCategory[key] = (summaryByCategory[key] || 0) + amountNumber;
  }

  return {
    days,
    total,
    byCategory: summaryByCategory,
  };
};
