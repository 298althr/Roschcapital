import prisma from '../config/prisma.js';

/**
 * Generate unique cheque number
 */
export const generateChequeNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CHQ${timestamp}${random}`;
};

/**
 * Create a new cheque
 */
export const createCheque = async (userId, data) => {
  const { amount, payee, memo } = data;

  // Validate amount
  if (!amount || parseFloat(amount) <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  if (!payee || payee.trim().length === 0) {
    throw new Error('Payee name is required');
  }

  // Get user's primary account to check balance
  const account = await prisma.account.findFirst({
    where: {
      userId,
      isPrimary: true,
      isActive: true
    }
  });

  if (!account) {
    throw new Error('No active account found');
  }

  // Check sufficient balance
  if (parseFloat(account.balance) < parseFloat(amount)) {
    throw new Error('Insufficient balance');
  }

  // Generate unique cheque number
  const chequeNumber = generateChequeNumber();

  // Create cheque
  const cheque = await prisma.cheque.create({
    data: {
      userId,
      chequeNumber,
      amount: parseFloat(amount),
      payee: payee.trim(),
      memo: memo?.trim() || null,
      status: 'PENDING',
      issuedDate: new Date()
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          accountNumber: true
        }
      }
    }
  });

  return cheque;
};

/**
 * Get user's cheques
 */
export const getUserCheques = async (userId, filters = {}) => {
  const { status } = filters;

  const where = {
    userId
  };

  if (status) {
    where.status = status;
  }

  const cheques = await prisma.cheque.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return cheques;
};

/**
 * Get cheque by ID
 */
export const getChequeById = async (chequeId, userId = null) => {
  const where = { id: chequeId };
  
  if (userId) {
    where.userId = userId;
  }

  const cheque = await prisma.cheque.findFirst({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          accountNumber: true,
          address: true,
          city: true,
          state: true,
          zipCode: true
        }
      }
    }
  });

  if (!cheque) {
    throw new Error('Cheque not found');
  }

  return cheque;
};

/**
 * Validate cheque for clearing
 */
export const validateCheque = async (chequeId) => {
  const cheque = await getChequeById(chequeId);

  // Check if already processed
  if (cheque.status !== 'PENDING') {
    throw new Error(`Cheque is already ${cheque.status.toLowerCase()}`);
  }

  // Check if cheque is not too old (6 months validity)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  if (new Date(cheque.issuedDate) < sixMonthsAgo) {
    throw new Error('Cheque has expired (older than 6 months)');
  }

  // Get user's primary account
  const account = await prisma.account.findFirst({
    where: {
      userId: cheque.userId,
      isPrimary: true,
      isActive: true
    }
  });

  if (!account) {
    throw new Error('Account not found or inactive');
  }

  // Check sufficient balance
  if (parseFloat(account.balance) < parseFloat(cheque.amount)) {
    return {
      valid: false,
      reason: 'Insufficient funds',
      account
    };
  }

  return {
    valid: true,
    account
  };
};

/**
 * Clear cheque (admin action)
 */
export const clearCheque = async (chequeId, adminId) => {
  // Validate cheque
  const validation = await validateCheque(chequeId);
  
  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  const cheque = await getChequeById(chequeId);
  const account = validation.account;

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Debit the account
    const updatedAccount = await tx.account.update({
      where: { id: account.id },
      data: {
        balance: {
          decrement: parseFloat(cheque.amount)
        }
      }
    });

    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId: cheque.userId,
        accountId: account.id,
        type: 'DEBIT',
        amount: parseFloat(cheque.amount),
        description: `Cheque payment to ${cheque.payee}`,
        reference: cheque.chequeNumber,
        status: 'COMPLETED',
        category: 'CHEQUE'
      }
    });

    // Update cheque status
    const updatedCheque = await tx.cheque.update({
      where: { id: chequeId },
      data: {
        status: 'CLEARED',
        clearedDate: new Date(),
        processedBy: adminId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create notification
    await tx.notification.create({
      data: {
        userId: cheque.userId,
        type: 'cheque',
        title: 'Cheque Cleared',
        message: `Your cheque #${cheque.chequeNumber} for $${cheque.amount} to ${cheque.payee} has been cleared.`,
        metadata: {
          chequeId: cheque.id,
          chequeNumber: cheque.chequeNumber,
          amount: parseFloat(cheque.amount)
        }
      }
    });

    return {
      cheque: updatedCheque,
      transaction,
      account: updatedAccount
    };
  });

  return result;
};

/**
 * Bounce cheque (admin action - insufficient funds)
 */
export const bounceCheque = async (chequeId, adminId, reason = 'Insufficient funds') => {
  const cheque = await getChequeById(chequeId);

  if (cheque.status !== 'PENDING') {
    throw new Error(`Cheque is already ${cheque.status.toLowerCase()}`);
  }

  // Update cheque status
  const updatedCheque = await prisma.cheque.update({
    where: { id: chequeId },
    data: {
      status: 'BOUNCED',
      processedBy: adminId
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: cheque.userId,
      type: 'cheque',
      title: 'Cheque Bounced',
      message: `Your cheque #${cheque.chequeNumber} for $${cheque.amount} to ${cheque.payee} has bounced. Reason: ${reason}`,
      metadata: {
        chequeId: cheque.id,
        chequeNumber: cheque.chequeNumber,
        amount: parseFloat(cheque.amount),
        reason
      }
    }
  });

  return updatedCheque;
};

/**
 * Cancel cheque (user action - before clearing)
 */
export const cancelCheque = async (chequeId, userId) => {
  const cheque = await getChequeById(chequeId, userId);

  if (cheque.status !== 'PENDING') {
    throw new Error(`Cannot cancel cheque that is ${cheque.status.toLowerCase()}`);
  }

  const updatedCheque = await prisma.cheque.update({
    where: { id: chequeId },
    data: {
      status: 'CANCELLED'
    }
  });

  return updatedCheque;
};

/**
 * Get all pending cheques (admin)
 */
export const getPendingCheques = async () => {
  const cheques = await prisma.cheque.findMany({
    where: {
      status: 'PENDING'
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          accountNumber: true
        }
      }
    },
    orderBy: {
      issuedDate: 'asc'
    }
  });

  return cheques;
};

/**
 * Get all cheques (admin)
 */
export const getAllCheques = async (filters = {}) => {
  const { status, userId } = filters;

  const where = {};

  if (status) {
    where.status = status;
  }

  if (userId) {
    where.userId = userId;
  }

  const cheques = await prisma.cheque.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          accountNumber: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return cheques;
};
