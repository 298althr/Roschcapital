import prisma from '../config/prisma.js';
import crypto from 'crypto';

// Encryption helpers
const encrypt = (text) => {
  return Buffer.from(text).toString('base64');
};

const decrypt = (encrypted) => {
  return Buffer.from(encrypted, 'base64').toString('utf-8');
};

// Generate card details
const generateCardNumber = () => {
  const prefix = '4'; // Visa
  const randomDigits = Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0');
  return prefix + randomDigits;
};

const generateCVV = () => {
  return Math.floor(Math.random() * 900 + 100).toString();
};

const generateExpiryDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 5);
  return date;
};

const maskCardNumber = (cardNumber) => {
  if (!cardNumber || cardNumber.length < 4) return '****';
  return cardNumber.substring(0, 4) + ' **** **** ****';
};

// Calculate minimum payment (3% of balance or $25, whichever is greater)
const calculateMinimumPayment = (balance) => {
  const threePercent = balance * 0.03;
  return Math.max(threePercent, 25);
};

// Apply for credit card
export const applyCreditCard = async (userId, requestedLimit, cardHolderName) => {
  // Check if user already has pending application
  const existingApplication = await prisma.creditCard.findFirst({
    where: {
      userId,
      approvalStatus: 'PENDING'
    }
  });

  if (existingApplication) {
    throw new Error('You already have a pending credit card application');
  }

  // Generate card details (but card won't be active until approved)
  const cardNumber = generateCardNumber();
  const cvv = generateCVV();
  const expiryDate = generateExpiryDate();

  // Create credit card application
  const creditCard = await prisma.creditCard.create({
    data: {
      userId,
      cardNumber: encrypt(cardNumber),
      cardHolderName,
      cvv: encrypt(cvv),
      expiryDate,
      creditLimit: requestedLimit,
      availableCredit: 0, // Will be set upon approval
      currentBalance: 0,
      apr: 14, // Default APR 14%, can be adjusted by admin
      status: 'PENDING',
      approvalStatus: 'PENDING',
      isActive: false,
      isFrozen: false
    }
  });

  return {
    success: true,
    message: 'Credit card application submitted successfully',
    application: {
      id: creditCard.id,
      requestedLimit,
      status: creditCard.approvalStatus,
      createdAt: creditCard.createdAt
    }
  };
};

// Get user's credit cards
export const getUserCreditCards = async (userId) => {
  const cards = await prisma.creditCard.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  return {
    success: true,
    count: cards.length,
    cards: cards.map(card => ({
      id: card.id,
      cardNumber: card.isActive ? maskCardNumber(decrypt(card.cardNumber)) : '****',
      cardHolderName: card.cardHolderName,
      expiryDate: card.expiryDate,
      creditLimit: card.creditLimit,
      availableCredit: card.availableCredit,
      currentBalance: card.currentBalance,
      apr: card.apr,
      minimumPayment: card.minimumPayment,
      paymentDueDate: card.paymentDueDate,
      status: card.status,
      approvalStatus: card.approvalStatus,
      isActive: card.isActive,
      isFrozen: card.isFrozen,
      declineReason: card.declineReason,
      createdAt: card.createdAt
    }))
  };
};

// Admin: Get pending credit card applications
export const getPendingApplications = async () => {
  const applications = await prisma.creditCard.findMany({
    where: {
      approvalStatus: 'PENDING'
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          kycStatus: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  return {
    success: true,
    count: applications.length,
    applications: applications.map(app => ({
      id: app.id,
      user: app.user,
      cardHolderName: app.cardHolderName,
      requestedLimit: app.creditLimit,
      createdAt: app.createdAt
    }))
  };
};

// Admin: Approve credit card
export const approveCreditCard = async (cardId, adminId, approvedLimit, apr) => {
  const card = await prisma.creditCard.findUnique({
    where: { id: cardId }
  });

  if (!card) {
    throw new Error('Credit card application not found');
  }

  if (card.approvalStatus !== 'PENDING') {
    throw new Error('This application has already been processed');
  }

  // Calculate payment due date (25th of next month)
  const paymentDueDate = new Date();
  paymentDueDate.setMonth(paymentDueDate.getMonth() + 1);
  paymentDueDate.setDate(25);

  // Update credit card
  const updated = await prisma.creditCard.update({
    where: { id: cardId },
    data: {
      creditLimit: approvedLimit,
      availableCredit: approvedLimit,
      apr,
      approvalStatus: 'APPROVED',
      status: 'ACTIVE',
      isActive: true,
      approvedBy: adminId,
      approvedAt: new Date(),
      paymentDueDate,
      minimumPayment: 0
    }
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: updated.userId,
      type: 'credit_card',
      title: 'Credit Card Approved!',
      message: `Your credit card application has been approved with a limit of $${approvedLimit.toFixed(2)} and APR of ${apr}%.`,
      metadata: {
        cardId: updated.id,
        creditLimit: approvedLimit,
        apr
      }
    }
  });

  return {
    success: true,
    message: 'Credit card approved successfully',
    card: {
      id: updated.id,
      creditLimit: updated.creditLimit,
      apr: updated.apr,
      status: updated.status
    }
  };
};

// Admin: Decline credit card
export const declineCreditCard = async (cardId, adminId, reason) => {
  const card = await prisma.creditCard.findUnique({
    where: { id: cardId }
  });

  if (!card) {
    throw new Error('Credit card application not found');
  }

  if (card.approvalStatus !== 'PENDING') {
    throw new Error('This application has already been processed');
  }

  const updated = await prisma.creditCard.update({
    where: { id: cardId },
    data: {
      approvalStatus: 'DECLINED',
      status: 'CLOSED',
      declineReason: reason,
      approvedBy: adminId,
      approvedAt: new Date()
    }
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: updated.userId,
      type: 'credit_card',
      title: 'Credit Card Application Declined',
      message: `Unfortunately, your credit card application has been declined. Reason: ${reason}`,
      metadata: {
        cardId: updated.id,
        reason
      }
    }
  });

  return {
    success: true,
    message: 'Credit card application declined',
    card: {
      id: updated.id,
      status: updated.status,
      declineReason: updated.declineReason
    }
  };
};

// Fund credit card from account
export const fundCreditCard = async (creditCardId, accountId, amount, userId) => {
  // Verify credit card belongs to user
  const creditCard = await prisma.creditCard.findFirst({
    where: { id: creditCardId, userId }
  });

  if (!creditCard) {
    throw new Error('Credit card not found');
  }

  if (!creditCard.isActive) {
    throw new Error('Credit card is not active');
  }

  // Verify account belongs to user
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId }
  });

  if (!account) {
    throw new Error('Account not found');
  }

  // Check account has sufficient balance
  if (account.availableBalance < amount) {
    throw new Error('Insufficient funds in account');
  }

  // Create funding record
  const funding = await prisma.creditCardFunding.create({
    data: {
      creditCardId,
      accountId,
      amount,
      status: 'COMPLETED'
    }
  });

  // Update account balance
  await prisma.account.update({
    where: { id: accountId },
    data: {
      availableBalance: { decrement: amount },
      balance: { decrement: amount }
    }
  });

  // Update credit card balance
  const newBalance = Math.max(0, creditCard.currentBalance - amount);
  const newAvailableCredit = creditCard.creditLimit - newBalance;

  await prisma.creditCard.update({
    where: { id: creditCardId },
    data: {
      currentBalance: newBalance,
      availableCredit: newAvailableCredit,
      minimumPayment: calculateMinimumPayment(newBalance)
    }
  });

  return {
    success: true,
    message: 'Credit card funded successfully',
    funding: {
      id: funding.id,
      amount: funding.amount,
      newBalance,
      availableCredit: newAvailableCredit
    }
  };
};

// Freeze credit card
export const freezeCreditCard = async (cardId, userId) => {
  const card = await prisma.creditCard.findFirst({
    where: { id: cardId, userId }
  });

  if (!card) {
    throw new Error('Card not found');
  }

  await prisma.creditCard.update({
    where: { id: cardId },
    data: { isFrozen: true }
  });

  return {
    success: true,
    message: 'Credit card frozen successfully'
  };
};

// Unfreeze credit card
export const unfreezeCreditCard = async (cardId, userId) => {
  const card = await prisma.creditCard.findFirst({
    where: { id: cardId, userId }
  });

  if (!card) {
    throw new Error('Card not found');
  }

  await prisma.creditCard.update({
    where: { id: cardId },
    data: { isFrozen: false }
  });

  return {
    success: true,
    message: 'Credit card unfrozen successfully'
  };
};

export default {
  applyCreditCard,
  getUserCreditCards,
  getPendingApplications,
  approveCreditCard,
  declineCreditCard,
  fundCreditCard,
  freezeCreditCard,
  unfreezeCreditCard,
  maskCardNumber
};
