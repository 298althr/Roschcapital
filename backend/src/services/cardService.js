import prisma from '../config/prisma.js';

// Get all cards for a user
export const getUserCards = async (userId) => {
  const cards = await prisma.card.findMany({
    where: {
      account: {
        userId,
      },
    },
    select: {
      id: true,
      accountId: true,
      cardNumber: true,
      cardType: true,
      isActive: true,
      isFrozen: true,
      dailyLimit: true,
      expiry: true,
      createdAt: true,
      updatedAt: true,
      account: {
        select: {
          id: true,
          accountType: true,
          accountNumber: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    success: true,
    count: cards.length,
    cards,
  };
};

// Get cards for a specific account (ensuring it belongs to the user)
export const getAccountCards = async (accountId, userId) => {
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId,
    },
  });

  if (!account) {
    throw new Error('Account not found or unauthorized');
  }

  const cards = await prisma.card.findMany({
    where: {
      accountId,
    },
    select: {
      id: true,
      accountId: true,
      cardNumber: true,
      cardType: true,
      isActive: true,
      isFrozen: true,
      dailyLimit: true,
      expiry: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    success: true,
    count: cards.length,
    cards,
  };
};

// Get a specific card by ID (with minimal account and recent transactions)
export const getCardById = async (cardId, userId) => {
  // Try debit cards first
  const debitCard = await prisma.debitCard.findFirst({
    where: {
      id: cardId,
      userId,
    },
    include: {
      account: {
        select: {
          id: true,
          accountType: true,
          accountNumber: true,
          balance: true,
        },
      },
    },
  });

  if (debitCard) {
    // Get recent transactions for this debit card
    const transactions = await prisma.cardTransaction.findMany({
      where: {
        userId,
        debitCardId: cardId,
      },
      select: {
        id: true,
        amount: true,
        merchantName: true,
        description: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      success: true,
      card: { ...debitCard, transactions },
      type: 'debit',
    };
  }

  // Try credit cards
  const creditCard = await prisma.creditCard.findFirst({
    where: {
      id: cardId,
      userId,
    },
  });

  if (creditCard) {
    // Get recent transactions for this credit card
    const transactions = await prisma.cardTransaction.findMany({
      where: {
        userId,
        creditCardId: cardId,
      },
      select: {
        id: true,
        amount: true,
        merchantName: true,
        description: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      success: true,
      card: { ...creditCard, transactions },
      type: 'credit',
    };
  }

  throw new Error('Card not found or unauthorized');
};

// Helper to generate demo card details (NOT for production use)
const generateDemoCardDetails = () => {
  const cardNumber = `4${Math.random().toString().slice(2, 15)}`; // pseudo-Visa style
  const cvv = (Math.floor(Math.random() * 900) + 100).toString();
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 4);

  return { cardNumber, cvv, expiry };
};

// Create a new card for an account (ensuring account belongs to user)
export const createCard = async (accountId, userId, cardData = {}) => {
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId,
    },
  });

  if (!account) {
    throw new Error('Account not found or unauthorized');
  }

  const { cardNumber, cvv, expiry } = generateDemoCardDetails();

  const card = await prisma.card.create({
    data: {
      accountId,
      cardNumber,
      cvv,
      expiry,
      cardType: cardData.cardType || 'debit',
      dailyLimit:
        cardData.dailyLimit !== undefined
          ? cardData.dailyLimit
          : 500,
    },
    select: {
      id: true,
      accountId: true,
      cardNumber: true,
      cardType: true,
      isActive: true,
      isFrozen: true,
      dailyLimit: true,
      expiry: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    success: true,
    message: 'Card created successfully',
    card,
  };
};

// Freeze a card
export const freezeCard = async (cardId, userId) => {
  const card = await prisma.card.findFirst({
    where: {
      id: cardId,
      account: {
        userId,
      },
    },
  });

  if (!card) {
    throw new Error('Card not found or unauthorized');
  }

  const updated = await prisma.card.update({
    where: { id: cardId },
    data: {
      isFrozen: true,
    },
    select: {
      id: true,
      accountId: true,
      cardType: true,
      isActive: true,
      isFrozen: true,
      dailyLimit: true,
      expiry: true,
      updatedAt: true,
    },
  });

  return {
    success: true,
    message: 'Card frozen successfully',
    card: updated,
  };
};

// Unfreeze a card
export const unfreezeCard = async (cardId, userId) => {
  const card = await prisma.card.findFirst({
    where: {
      id: cardId,
      account: {
        userId,
      },
    },
  });

  if (!card) {
    throw new Error('Card not found or unauthorized');
  }

  const updated = await prisma.card.update({
    where: { id: cardId },
    data: {
      isFrozen: false,
    },
    select: {
      id: true,
      accountId: true,
      cardType: true,
      isActive: true,
      isFrozen: true,
      dailyLimit: true,
      expiry: true,
      updatedAt: true,
    },
  });

  return {
    success: true,
    message: 'Card unfrozen successfully',
    card: updated,
  };
};

// Update card daily limit
export const updateCardLimit = async (cardId, userId, dailyLimit) => {
  const card = await prisma.card.findFirst({
    where: {
      id: cardId,
      account: {
        userId,
      },
    },
  });

  if (!card) {
    throw new Error('Card not found or unauthorized');
  }

  const updated = await prisma.card.update({
    where: { id: cardId },
    data: {
      dailyLimit,
    },
    select: {
      id: true,
      accountId: true,
      cardType: true,
      isActive: true,
      isFrozen: true,
      dailyLimit: true,
      expiry: true,
      updatedAt: true,
    },
  });

  return {
    success: true,
    message: 'Card limit updated successfully',
    card: updated,
  };
};

// Deactivate a card
export const deactivateCard = async (cardId, userId) => {
  const card = await prisma.card.findFirst({
    where: {
      id: cardId,
      account: {
        userId,
      },
    },
  });

  if (!card) {
    throw new Error('Card not found or unauthorized');
  }

  const updated = await prisma.card.update({
    where: { id: cardId },
    data: {
      isActive: false,
    },
    select: {
      id: true,
      accountId: true,
      cardType: true,
      isActive: true,
      isFrozen: true,
      dailyLimit: true,
      expiry: true,
      updatedAt: true,
    },
  });

  return {
    success: true,
    message: 'Card deactivated successfully',
    card: updated,
  };
};

// Activate a card
export const activateCard = async (cardId, userId) => {
  const card = await prisma.card.findFirst({
    where: {
      id: cardId,
      account: {
        userId,
      },
    },
  });

  if (!card) {
    throw new Error('Card not found or unauthorized');
  }

  const updated = await prisma.card.update({
    where: { id: cardId },
    data: {
      isActive: true,
    },
    select: {
      id: true,
      accountId: true,
      cardType: true,
      isActive: true,
      isFrozen: true,
      dailyLimit: true,
      expiry: true,
      updatedAt: true,
    },
  });

  return {
    success: true,
    message: 'Card activated successfully',
    card: updated,
  };
};

// Get card statistics for overview
export const getCardStats = async (userId) => {
  const cards = await prisma.card.findMany({
    where: {
      account: {
        userId,
      },
    },
    select: {
      id: true,
      isActive: true,
      isFrozen: true,
      dailyLimit: true,
      createdAt: true,
    },
  });

  const totalCards = cards.length;
  const activeCards = cards.filter((c) => c.isActive && !c.isFrozen).length;
  const frozenCards = cards.filter((c) => c.isFrozen).length;
  const inactiveCards = cards.filter((c) => !c.isActive).length;

  // Simple distribution of daily limits
  let totalLimit = 0;
  for (const c of cards) {
    totalLimit += Number(c.dailyLimit || 0);
  }

  const averageDailyLimit = totalCards > 0 ? totalLimit / totalCards : 0;

  return {
    success: true,
    stats: {
      totalCards,
      activeCards,
      frozenCards,
      inactiveCards,
      averageDailyLimit,
    },
  };
};
