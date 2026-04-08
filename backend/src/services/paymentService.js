import prisma from '../config/prisma.js';

// Ensure an account belongs to the given user
const getUserAccountOrThrow = async (accountId, userId) => {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });
  if (!account) {
    throw new Error('Account not found or unauthorized');
  }
  return account;
};

// Deposit money into an account
export const depositMoney = async (accountId, userId, { amount, description }) => {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  return prisma.$transaction(async (tx) => {
    const account = await tx.account.findFirst({ where: { id: accountId, userId } });
    if (!account) throw new Error('Account not found or unauthorized');

    const updatedAccount = await tx.account.update({
      where: { id: account.id },
      data: { balance: account.balance.plus(amount) },
    });

    const transaction = await tx.transaction.create({
      data: {
        accountId: account.id,
        amount,
        type: 'CREDIT',
        description: description || 'Deposit',
        category: 'deposit',
        status: 'COMPLETED',
      },
    });

    return { account: updatedAccount, transaction };
  });
};

// Withdraw money from an account
export const withdrawMoney = async (accountId, userId, { amount, description }) => {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  return prisma.$transaction(async (tx) => {
    const account = await tx.account.findFirst({ where: { id: accountId, userId } });
    if (!account) throw new Error('Account not found or unauthorized');

    const accountBalance = Number(account.balance);
    if (accountBalance < amount) {
      throw new Error('Insufficient funds');
    }

    const updatedAccount = await tx.account.update({
      where: { id: account.id },
      data: { balance: account.balance.minus(amount) },
    });

    const transaction = await tx.transaction.create({
      data: {
        accountId: account.id,
        amount,
        type: 'DEBIT',
        description: description || 'Withdrawal',
        category: 'withdrawal',
        status: 'COMPLETED',
      },
    });

    return { account: updatedAccount, transaction };
  });
};

// International transfer
export const internationalTransfer = async (fromAccountId, userId, { recipientName, recipientIBAN, recipientSWIFT, recipientBank, recipientCountry, amount, description }) => {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  return prisma.$transaction(async (tx) => {
    const account = await tx.account.findFirst({ where: { id: fromAccountId, userId } });
    if (!account) throw new Error('Account not found or unauthorized');

    // Check available balance - use balance if availableBalance is 0 or null
    const availableBalance = Number(account.availableBalance) > 0 
      ? Number(account.availableBalance) 
      : Number(account.balance);
    if (availableBalance < amount) {
      throw new Error(`Insufficient funds. Available: $${availableBalance.toFixed(2)}, Requested: $${amount.toFixed(2)}`);
    }

    // Move amount from available to pending (don't deduct from total yet)
    const updatedAccount = await tx.account.update({
      where: { id: account.id },
      data: { 
        availableBalance: { decrement: amount },
        pendingBalance: { increment: amount }
      },
    });

    // Generate reference
    const reference = `INT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create a transfer request for admin approval
    const transferRequest = await tx.transferRequest.create({
      data: {
        userId,
        fromAccountId,
        destinationBank: recipientBank,
        routingNumber: recipientSWIFT || recipientIBAN, // Using SWIFT or IBAN
        accountNumber: recipientIBAN,
        accountName: recipientName,
        amount,
        description: `International transfer to ${recipientName} (${recipientCountry})${description ? ' - ' + description : ''}`,
        reference,
        status: 'PENDING',
        estimatedCompletion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
      },
    });

    // Create pending transaction record
    const transaction = await tx.transaction.create({
      data: {
        accountId: account.id,
        amount,
        type: 'DEBIT',
        description: description || `International transfer to ${recipientName} (${recipientCountry})`,
        reference,
        status: 'PENDING'
      },
    });

    // Create notification
    await tx.notification.create({
      data: {
        userId,
        type: 'transfer',
        title: 'International Transfer Submitted',
        message: `Your international transfer of $${amount.toFixed(2)} to ${recipientName} is pending admin approval.`,
        metadata: {
          transferId: transferRequest.id,
          reference,
          amount
        }
      }
    });

    return { account: updatedAccount, transaction, transferRequest };
  });
};

// Transfer between two accounts owned by the same user
export const transferMoney = async (fromAccountId, toAccountId, userId, { amount, description }) => {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  return prisma.$transaction(async (tx) => {
    const from = await tx.account.findFirst({ where: { id: fromAccountId, userId } });
    if (!from) throw new Error('Source account not found or unauthorized');

    const to = await tx.account.findFirst({ where: { id: toAccountId, userId } });
    if (!to) throw new Error('Destination account not found or unauthorized');

    const fromBalance = Number(from.balance);
    if (fromBalance < amount) {
      throw new Error('Insufficient funds');
    }

    const updatedFrom = await tx.account.update({
      where: { id: from.id },
      data: { balance: from.balance.minus(amount) },
    });

    const updatedTo = await tx.account.update({
      where: { id: to.id },
      data: { balance: to.balance.plus(amount) },
    });

    const debitTransaction = await tx.transaction.create({
      data: {
        accountId: from.id,
        amount,
        type: 'DEBIT',
        description: description || `Transfer to ${to.accountNumber}`,
        category: 'transfer',
        status: 'COMPLETED',
      },
    });

    const creditTransaction = await tx.transaction.create({
      data: {
        accountId: to.id,
        amount,
        type: 'CREDIT',
        description: description || `Transfer from ${from.accountNumber}`,
        category: 'transfer',
        status: 'COMPLETED',
      },
    });

    return {
      payment: {
        fromAccountId: from.id,
        toAccountId: to.id,
        amount,
        description,
      },
      transactions: {
        debit: debitTransaction,
        credit: creditTransaction,
      },
    };
  });
};

// Send peer-to-peer payment to another user
export const sendPeerPayment = async (
  fromAccountId,
  toUserId,
  userId,
  { amount, description, toAccountId }
) => {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  return prisma.$transaction(async (tx) => {
    const from = await tx.account.findFirst({ where: { id: fromAccountId, userId } });
    if (!from) throw new Error('Source account not found or unauthorized');

    const targetUser = await tx.user.findUnique({ where: { id: toUserId } });
    if (!targetUser) throw new Error('Recipient user not found');

    let to;
    if (toAccountId) {
      to = await tx.account.findFirst({ where: { id: toAccountId, userId: toUserId } });
    } else {
      // pick any active account of recipient
      to = await tx.account.findFirst({ where: { userId: toUserId, isActive: true } });
    }

    if (!to) throw new Error('Recipient account not found');

    const fromBalance = Number(from.balance);
    if (fromBalance < amount) {
      throw new Error('Insufficient funds');
    }

    const updatedFrom = await tx.account.update({
      where: { id: from.id },
      data: { balance: from.balance.minus(amount) },
    });

    const updatedTo = await tx.account.update({
      where: { id: to.id },
      data: { balance: to.balance.plus(amount) },
    });

    const debitTransaction = await tx.transaction.create({
      data: {
        accountId: from.id,
        amount,
        type: 'DEBIT',
        description: description || `P2P payment to ${targetUser.email}`,
        category: 'p2p',
        status: 'COMPLETED',
      },
    });

    const creditTransaction = await tx.transaction.create({
      data: {
        accountId: to.id,
        amount,
        type: 'CREDIT',
        description: description || `P2P payment from ${updatedFrom.accountNumber}`,
        category: 'p2p',
        status: 'COMPLETED',
      },
    });

    return {
      payment: {
        fromAccountId: from.id,
        toAccountId: to.id,
        toUserId,
        amount,
        description,
      },
      transactions: {
        debit: debitTransaction,
        credit: creditTransaction,
      },
    };
  });
};

// Pay a bill from a specific account
export const payBill = async (accountId, userId, { billName, amount, reference, description }) => {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  return prisma.$transaction(async (tx) => {
    const account = await tx.account.findFirst({ where: { id: accountId, userId } });
    if (!account) throw new Error('Account not found or unauthorized');

    const balance = Number(account.balance);
    if (balance < amount) {
      throw new Error('Insufficient funds');
    }

    const updated = await tx.account.update({
      where: { id: account.id },
      data: { balance: account.balance.minus(amount) },
    });

    const transaction = await tx.transaction.create({
      data: {
        accountId: account.id,
        amount,
        type: 'DEBIT',
        description: description || `Bill payment: ${billName}`,
        category: 'bill',
        merchantName: billName,
        status: 'COMPLETED',
      },
    });

    return {
      payment: {
        accountId: account.id,
        billName,
        amount,
        reference,
        description,
      },
      transaction,
    };
  });
};

// Get payment history for a single account
export const getPaymentHistory = async (userId, accountId, limit = 20, offset = 0) => {
  const account = await getUserAccountOrThrow(accountId, userId);

  const [total, transactions] = await Promise.all([
    prisma.transaction.count({
      where: {
        accountId: account.id,
        type: 'DEBIT',
      },
    }),
    prisma.transaction.findMany({
      where: {
        accountId: account.id,
        type: 'DEBIT',
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
  ]);

  return {
    payments: transactions,
    total,
    offset,
    limit,
    hasMore: offset + transactions.length < total,
  };
};

// Get all payments for user (all accounts)
export const getUserPayments = async (userId, limit = 20, offset = 0) => {
  const [total, transactions] = await Promise.all([
    prisma.transaction.count({
      where: {
        type: 'DEBIT',
        account: { userId },
      },
    }),
    prisma.transaction.findMany({
      where: {
        type: 'DEBIT',
        account: { userId },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: { account: true },
    }),
  ]);

  return {
    payments: transactions,
    total,
    offset,
    limit,
    hasMore: offset + transactions.length < total,
  };
};

// Basic payment stats for a user
export const getPaymentStats = async (userId) => {
  const since = new Date();
  since.setMonth(since.getMonth() - 1);

  // Get all transactions for user's accounts
  const [sentTransactions, receivedTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        type: { in: ['DEBIT', 'WITHDRAWAL', 'PAYMENT'] },
        account: { userId },
        createdAt: { gte: since },
      },
    }),
    prisma.transaction.findMany({
      where: {
        type: { in: ['CREDIT', 'DEPOSIT'] },
        account: { userId },
        createdAt: { gte: since },
      },
    }),
  ]);

  let totalSent = 0;
  let totalReceived = 0;
  const byCategory = {};

  for (const tx of sentTransactions) {
    const amountNum = Number(tx.amount);
    totalSent += amountNum;
    const key = tx.category || 'uncategorized';
    byCategory[key] = (byCategory[key] || 0) + amountNum;
  }

  for (const tx of receivedTransactions) {
    const amountNum = Number(tx.amount);
    totalReceived += amountNum;
  }

  return {
    periodDays: 30,
    totalPayments: sentTransactions.length + receivedTransactions.length,
    totalSent: totalSent || 0,
    totalReceived: totalReceived || 0,
    totalSpent: totalSent,
    byCategory,
    count: sentTransactions.length,
  };
};
