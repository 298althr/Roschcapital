import prisma from '../config/prisma.js';
import { generateCryptoWalletAddress, detectCryptoType } from '../utils/walletGenerator.js';

const cachePrefix = 'accountService:';
const accountSelectFields = {
  id: true,
  accountType: true,
  balance: true,
  availableBalance: true,
  pendingBalance: true,
  isPrimary: true,
  isActive: true
};

const normalizeMoneyValue = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'object' && typeof value.toString === 'function') {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// Generate 10-digit account number starting with 7
export const generateAccountNumber = (accountType) => {
  // Generate 9 random digits (0-999999999)
  const randomDigits = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  
  // All account numbers start with 7
  return '7' + randomDigits;
};

// Calculate balances for an account
export const calculateBalances = async (accountId) => {
  // Get all transactions for account
  const transactions = await prisma.transaction.findMany({
    where: { accountId }
  });
  
  let available = 0;
  let pending = 0;
  
  transactions.forEach(tx => {
    const amount = parseFloat(tx.amount);
    if (tx.status === 'COMPLETED') {
      available += amount;
    } else if (tx.status === 'PENDING') {
      pending += amount;
    }
  });
  
  const current = available + pending;
  
  // Update account
  await prisma.account.update({
    where: { id: accountId },
    data: {
      availableBalance: available,
      pendingBalance: pending,
      balance: current
    }
  });
  
  return { available, pending, current };
};

// Create new account
export const createAccount = async (userId, accountType, accountName) => {
  let accountNumber;
  
  // Generate wallet address for crypto accounts, regular account number for others
  if (accountType === 'CRYPTO_WALLET') {
    // Check if user already has a crypto wallet - only one allowed per user
    const existingCryptoWallet = await prisma.account.findFirst({
      where: {
        userId,
        accountType: 'CRYPTO_WALLET'
      }
    });
    
    if (existingCryptoWallet) {
      throw new Error('You can only have one crypto wallet account');
    }
    
    const cryptoType = detectCryptoType(accountName);
    accountNumber = generateCryptoWalletAddress(cryptoType);
  } else {
    accountNumber = generateAccountNumber(accountType);
  }
  
  const account = await prisma.account.create({
    data: {
      userId,
      accountType,
      accountNumber,
      accountName: accountName || `${accountType} Account`,
      balance: 0,
      availableBalance: 0,
      pendingBalance: 0,
      currency: 'USD',
      isActive: true,
      isPrimary: false
    }
  });
  
  return account;
};

// Get accounts by type
export const getAccountsByType = async (userId, type) => {
  return await prisma.account.findMany({
    where: {
      userId,
      accountType: type,
      isActive: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

// Get account balances breakdown
export const getAccountBalances = async (accountId, userId) => {
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId
    },
    select: {
      id: true,
      accountNumber: true,
      balance: true,
      availableBalance: true,
      pendingBalance: true,
      currency: true
    }
  });
  
  if (!account) {
    throw new Error('Account not found or unauthorized');
  }
  
  return {
    success: true,
    balances: {
      current: Number(account.balance),
      available: Number(account.availableBalance),
      pending: Number(account.pendingBalance),
      currency: account.currency
    }
  };
};

// Get all accounts for a user
export const getUserAccounts = async (userId) => {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: {
      id: true,
      accountType: true,
      accountNumber: true,
      balance: true,
      availableBalance: true,
      pendingBalance: true,
      accountName: true,
      currency: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate available and pending balances if not set
  const updatedAccounts = accounts.map(account => {
    const balance = Number(account.balance) || 0;
    const pendingBalance = Number(account.pendingBalance) || 0;
    const availableBalance = account.availableBalance !== null 
      ? Number(account.availableBalance) 
      : balance - pendingBalance;

    return {
      ...account,
      balance,
      availableBalance,
      pendingBalance
    };
  });

  return {
    success: true,
    count: updatedAccounts.length,
    accounts: updatedAccounts,
  };
};

// Get a specific account by ID (ensuring it belongs to the user)
export const getAccountById = async (accountId, userId) => {
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId,
    },
    select: {
      id: true,
      accountType: true,
      accountNumber: true,
      balance: true,
      currency: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      cards: {
        select: {
          id: true,
          cardType: true,
          isActive: true,
          isFrozen: true,
          dailyLimit: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      transactions: {
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          category: true,
          merchantName: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!account) {
    throw new Error('Account not found or unauthorized');
  }

  return {
    success: true,
    account,
  };
};

// Get account summary (used by /api/v1/accounts/summary and /api/v1/dashboard)
export const getAccountSummary = async (userId) => {
  // Get current month date range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  let accounts = await prisma.account.findMany({
    where: { userId },
    select: accountSelectFields,
  });

  // Accounts already have synced balances from admin operations
  // No additional sync needed here

  const [cards, recentTransactions, monthlyTransactions, loans] = await Promise.all([
    prisma.card.findMany({
      where: {
        account: { userId },
      },
      select: {
        id: true,
        isActive: true,
        isFrozen: true,
      },
    }),
    prisma.transaction.findMany({
      where: {
        account: { userId },
      },
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        category: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    // Get all transactions for the current month for metrics
    prisma.transaction.findMany({
      where: {
        account: { userId },
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        amount: true,
        type: true,
        category: true,
      },
    }),
    // Get active loans
    prisma.loan.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      select: {
        amount: true,
        remainingBalance: true,
        totalPaid: true,
        monthlyPayment: true,
        nextPaymentDate: true,
      },
    }),
  ]);

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.balance),
    0,
  );

  const availableBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.availableBalance || acc.balance),
    0,
  );

  const pendingBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.pendingBalance || 0),
    0,
  );

  const activeCards = cards.filter((c) => c.isActive && !c.isFrozen).length;

  // Calculate monthly income (credits this month)
  const monthlyIncome = monthlyTransactions
    .filter(tx => tx.type === 'CREDIT')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  // Calculate monthly expenses (debits this month)
  const monthlyExpenses = monthlyTransactions
    .filter(tx => tx.type === 'DEBIT')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  // Calculate expenses by category
  const expensesByCategory = {};
  monthlyTransactions
    .filter(tx => tx.type === 'DEBIT')
    .forEach(tx => {
      const category = tx.category || 'OTHER';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + Number(tx.amount);
    });

  // Map categories to display names
  const categoryMapping = {
    HOUSING: 'Housing & Utilities',
    UTILITIES: 'Housing & Utilities',
    GROCERIES: 'Food & Dining',
    DINING: 'Food & Dining',
    TRANSPORTATION: 'Transportation',
    ENTERTAINMENT: 'Entertainment',
    INSURANCE: 'Other',
    SHOPPING: 'Other',
    LOAN_PAYMENT: 'Other',
  };

  // Aggregate expenses by display category
  const aggregatedExpenses = {};
  Object.entries(expensesByCategory).forEach(([cat, amount]) => {
    const displayCat = categoryMapping[cat] || 'Other';
    aggregatedExpenses[displayCat] = (aggregatedExpenses[displayCat] || 0) + amount;
  });

  // Convert to array with percentages
  const totalExpenses = Object.values(aggregatedExpenses).reduce((a, b) => a + b, 0) || 1;
  const expensesBreakdown = Object.entries(aggregatedExpenses)
    .map(([label, amount]) => ({
      label,
      amount: Number(amount.toFixed(2)),
      percent: Math.round((amount / totalExpenses) * 100),
    }))
    .sort((a, b) => b.amount - a.amount);

  // Loan summary
  const loanBalance = loans.reduce((sum, loan) => sum + Number(loan.remainingBalance), 0);
  const loanTotalPaid = loans.reduce((sum, loan) => sum + Number(loan.totalPaid), 0);
  const loanOriginalAmount = loans.reduce((sum, loan) => sum + Number(loan.amount), 0);
  const nextLoanPayment = loans.length > 0 ? loans[0].nextPaymentDate : null;

  // Savings (assume savings accounts or a percentage of balance)
  const savingsAccounts = accounts.filter(acc => acc.accountType === 'SAVINGS');
  const savingsBalance = savingsAccounts.length > 0 
    ? savingsAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0)
    : totalBalance * 0.15; // Estimate 15% as savings if no savings account

  const summary = {
    totalBalance: Number(totalBalance.toFixed(2)),
    availableBalance: Number(availableBalance.toFixed(2)),
    pendingBalance: Number(pendingBalance.toFixed(2)),
    accountCount: accounts.length,
    totalCards: cards.length,
    activeCards,
    recentTransactionCount: recentTransactions.length,
    // New metrics
    monthlyIncome: Number(monthlyIncome.toFixed(2)),
    monthlyExpenses: Number(monthlyExpenses.toFixed(2)),
    savingsBalance: Number(savingsBalance.toFixed(2)),
    loanBalance: Number(loanBalance.toFixed(2)),
    loanTotalPaid: Number(loanTotalPaid.toFixed(2)),
    loanOriginalAmount: Number(loanOriginalAmount.toFixed(2)),
    nextLoanPayment,
    expensesBreakdown,
  };

  return {
    success: true,
    summary,
    recentTransactions,
  };
};

// Get account statistics for analytics (used by /api/v1/accounts/stats)
export const getAccountStats = async (userId) => {
  const [accounts, allTransactions] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      select: {
        id: true,
      },
    }),
    prisma.transaction.findMany({
      where: {
        account: { userId },
      },
      select: {
        amount: true,
        category: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const totalTransactions = allTransactions.length;

  // Spending by category
  const spendingByCategory = {};
  for (const tx of allTransactions) {
    const category = tx.category || 'Other';
    const amount = Number(tx.amount);
    spendingByCategory[category] = (spendingByCategory[category] || 0) + amount;
  }

  // Monthly spending trend (YYYY-MM)
  const monthlySpending = {};
  for (const tx of allTransactions) {
    const month = new Date(tx.createdAt).toISOString().slice(0, 7);
    const amount = Number(tx.amount);
    monthlySpending[month] = (monthlySpending[month] || 0) + amount;
  }

  return {
    success: true,
    stats: {
      accountCount: accounts.length,
      totalTransactions,
      spendingByCategory,
      monthlySpending,
    },
  };
};
