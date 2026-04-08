import prisma from '../config/prisma.js';
import { Decimal } from '../config/jsonDbClient.js';

/**
 * Generate unique fixed deposit number
 */
function generateDepositNumber() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FD-${timestamp}-${random}`;
}

/**
 * Calculate maturity amount based on principal, rate, and term
 * Formula: A = P(1 + r/n)^(nt)
 * For simplicity, using simple interest: A = P(1 + rt)
 */
function calculateMaturityAmount(principal, annualRate, termMonths) {
  const rate = parseFloat(annualRate) / 100;
  const years = termMonths / 12;
  const maturityAmount = parseFloat(principal) * (1 + rate * years);
  return maturityAmount.toFixed(2);
}

/**
 * Calculate maturity date
 */
function calculateMaturityDate(termMonths) {
  const maturityDate = new Date();
  maturityDate.setMonth(maturityDate.getMonth() + termMonths);
  return maturityDate;
}

/**
 * Create a new fixed deposit
 */
export const createFixedDeposit = async (userId, accountId, principalAmount, interestRate, termMonths, autoRenew = false) => {
  // Verify account belongs to user and has sufficient balance
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId: userId,
      isActive: true
    }
  });

  if (!account) {
    throw new Error('Account not found or inactive');
  }

  const principal = parseFloat(principalAmount);
  const availableBalance = parseFloat(account.availableBalance);

  if (availableBalance < principal) {
    throw new Error('Insufficient balance in account');
  }

  // Calculate maturity details
  const maturityAmount = calculateMaturityAmount(principal, interestRate, termMonths);
  const maturityDate = calculateMaturityDate(termMonths);
  const depositNumber = generateDepositNumber();

  // Create fixed deposit and deduct from account in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create fixed deposit
    const fixedDeposit = await tx.fixedDeposit.create({
      data: {
        userId,
        accountId,
        depositNumber,
        principalAmount: new Decimal(principal),
        interestRate: new Decimal(interestRate),
        termMonths,
        maturityAmount: new Decimal(maturityAmount),
        maturityDate,
        status: 'ACTIVE',
        autoRenew
      },
      include: {
        account: {
          select: {
            accountNumber: true,
            accountType: true,
            accountName: true
          }
        }
      }
    });

    // Deduct amount from account
    await tx.account.update({
      where: { id: accountId },
      data: {
        balance: { decrement: new Decimal(principal) },
        availableBalance: { decrement: new Decimal(principal) }
      }
    });

    // Create transaction record
    await tx.transaction.create({
      data: {
        accountId,
        amount: new Decimal(principal),
        type: 'DEBIT',
        description: `Fixed Deposit Created - ${depositNumber}`,
        category: 'INVESTMENT',
        merchantName: 'Rosch Capital Bank',
        merchantCategory: 'Fixed Deposit',
        status: 'COMPLETED',
        reference: depositNumber
      }
    });

    return fixedDeposit;
  });

  return result;
};

/**
 * Get all fixed deposits for a user
 */
export const getUserFixedDeposits = async (userId) => {
  const deposits = await prisma.fixedDeposit.findMany({
    where: { userId },
    include: {
      account: {
        select: {
          accountNumber: true,
          accountType: true,
          accountName: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return deposits.map(deposit => ({
    ...deposit,
    principalAmount: parseFloat(deposit.principalAmount),
    interestRate: parseFloat(deposit.interestRate),
    maturityAmount: parseFloat(deposit.maturityAmount),
    withdrawnAmount: parseFloat(deposit.withdrawnAmount)
  }));
};

/**
 * Get fixed deposit by ID
 */
export const getFixedDepositById = async (depositId, userId) => {
  const deposit = await prisma.fixedDeposit.findFirst({
    where: {
      id: depositId,
      userId
    },
    include: {
      account: {
        select: {
          accountNumber: true,
          accountType: true,
          accountName: true,
          balance: true
        }
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  if (!deposit) {
    throw new Error('Fixed deposit not found');
  }

  return {
    ...deposit,
    principalAmount: parseFloat(deposit.principalAmount),
    interestRate: parseFloat(deposit.interestRate),
    maturityAmount: parseFloat(deposit.maturityAmount),
    withdrawnAmount: parseFloat(deposit.withdrawnAmount),
    account: {
      ...deposit.account,
      balance: parseFloat(deposit.account.balance)
    }
  };
};

/**
 * Withdraw fixed deposit (before or at maturity)
 */
export const withdrawFixedDeposit = async (depositId, userId) => {
  const deposit = await prisma.fixedDeposit.findFirst({
    where: {
      id: depositId,
      userId,
      status: 'ACTIVE'
    },
    include: {
      account: true
    }
  });

  if (!deposit) {
    throw new Error('Fixed deposit not found or already withdrawn');
  }

  const now = new Date();
  const isMatured = now >= deposit.maturityDate;
  const withdrawalAmount = isMatured 
    ? parseFloat(deposit.maturityAmount) 
    : parseFloat(deposit.principalAmount); // Early withdrawal = principal only

  // Process withdrawal
  const result = await prisma.$transaction(async (tx) => {
    // Update fixed deposit status
    await tx.fixedDeposit.update({
      where: { id: depositId },
      data: {
        status: 'WITHDRAWN',
        withdrawnAmount: new Decimal(withdrawalAmount),
        withdrawnAt: now
      }
    });

    // Credit account
    await tx.account.update({
      where: { id: deposit.accountId },
      data: {
        balance: { increment: new Decimal(withdrawalAmount) },
        availableBalance: { increment: new Decimal(withdrawalAmount) }
      }
    });

    // Create transaction record
    await tx.transaction.create({
      data: {
        accountId: deposit.accountId,
        amount: new Decimal(withdrawalAmount),
        type: 'CREDIT',
        description: `Fixed Deposit Withdrawal - ${deposit.depositNumber}${isMatured ? ' (Matured)' : ' (Early)'}`,
        category: 'INVESTMENT',
        merchantName: 'Rosch Capital Bank',
        merchantCategory: 'Fixed Deposit',
        status: 'COMPLETED',
        reference: `WD-${deposit.depositNumber}`
      }
    });

    return { withdrawalAmount, isMatured };
  });

  return result;
};

/**
 * Get fixed deposit statistics for user
 */
export const getFixedDepositStats = async (userId) => {
  const deposits = await prisma.fixedDeposit.findMany({
    where: { userId }
  });

  const stats = {
    totalDeposits: deposits.length,
    activeDeposits: deposits.filter(d => d.status === 'ACTIVE').length,
    maturedDeposits: deposits.filter(d => d.status === 'MATURED').length,
    withdrawnDeposits: deposits.filter(d => d.status === 'WITHDRAWN').length,
    totalInvested: deposits
      .filter(d => d.status === 'ACTIVE')
      .reduce((sum, d) => sum + parseFloat(d.principalAmount), 0),
    expectedReturns: deposits
      .filter(d => d.status === 'ACTIVE')
      .reduce((sum, d) => sum + (parseFloat(d.maturityAmount) - parseFloat(d.principalAmount)), 0)
  };

  return stats;
};

/**
 * Admin: Get all fixed deposits
 */
export const getAllFixedDeposits = async (filters = {}) => {
  const { status, userId, search } = filters;
  
  const where = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (search) {
    where.OR = [
      { depositNumber: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { firstName: { contains: search, mode: 'insensitive' } } },
      { user: { lastName: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const deposits = await prisma.fixedDeposit.findMany({
    where,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      account: {
        select: {
          accountNumber: true,
          accountType: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return deposits.map(deposit => ({
    ...deposit,
    principalAmount: parseFloat(deposit.principalAmount),
    interestRate: parseFloat(deposit.interestRate),
    maturityAmount: parseFloat(deposit.maturityAmount),
    withdrawnAmount: parseFloat(deposit.withdrawnAmount)
  }));
};

/**
 * Admin: Process fixed deposit withdrawal
 */
export const adminWithdrawFixedDeposit = async (depositId, adminId) => {
  const deposit = await prisma.fixedDeposit.findUnique({
    where: { id: depositId },
    include: { account: true }
  });

  if (!deposit) {
    throw new Error('Fixed deposit not found');
  }

  if (deposit.status !== 'ACTIVE') {
    throw new Error('Fixed deposit is not active');
  }

  const now = new Date();
  const isMatured = now >= deposit.maturityDate;
  const withdrawalAmount = isMatured 
    ? parseFloat(deposit.maturityAmount) 
    : parseFloat(deposit.principalAmount);

  const result = await prisma.$transaction(async (tx) => {
    await tx.fixedDeposit.update({
      where: { id: depositId },
      data: {
        status: 'WITHDRAWN',
        withdrawnAmount: new Decimal(withdrawalAmount),
        withdrawnAt: now,
        processedBy: adminId
      }
    });

    await tx.account.update({
      where: { id: deposit.accountId },
      data: {
        balance: { increment: new Decimal(withdrawalAmount) },
        availableBalance: { increment: new Decimal(withdrawalAmount) }
      }
    });

    await tx.transaction.create({
      data: {
        accountId: deposit.accountId,
        amount: new Decimal(withdrawalAmount),
        type: 'CREDIT',
        description: `Fixed Deposit Withdrawal (Admin) - ${deposit.depositNumber}`,
        category: 'INVESTMENT',
        merchantName: 'Rosch Capital Bank',
        merchantCategory: 'Fixed Deposit',
        status: 'COMPLETED',
        reference: `ADM-WD-${deposit.depositNumber}`
      }
    });

    return { withdrawalAmount, isMatured };
  });

  return result;
};
