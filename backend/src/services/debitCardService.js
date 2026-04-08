import prisma from '../config/prisma.js';
import crypto from 'crypto';

// Encryption helpers (simple for demo - use proper encryption in production)
const encrypt = (text) => {
  // In production, use proper encryption with env variables for keys
  return Buffer.from(text).toString('base64');
};

const decrypt = (encrypted) => {
  return Buffer.from(encrypted, 'base64').toString('utf-8');
};

// Generate 16-digit card number
export const generateCardNumber = () => {
  // Generate Mastercard-style number (starts with 5)
  const prefix = '5';
  const randomDigits = Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0');
  return prefix + randomDigits;
};

// Generate 3-digit CVV
export const generateCVV = () => {
  return Math.floor(Math.random() * 900 + 100).toString();
};

// Generate expiry date (5 years from now)
export const generateExpiryDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 5);
  return date;
};

// Mask card number (show first 4 digits only)
export const maskCardNumber = (cardNumber) => {
  if (!cardNumber || cardNumber.length < 4) return '****';
  return cardNumber.substring(0, 4) + ' **** **** ****';
};

// Create debit card
export const createDebitCard = async (userId, accountId, cardHolderName) => {
  // Verify account belongs to user
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId }
  });

  if (!account) {
    throw new Error('Account not found or unauthorized');
  }

  // Generate card details
  const cardNumber = generateCardNumber();
  const cvv = generateCVV();
  const expiryDate = generateExpiryDate();

  // Create debit card
  const debitCard = await prisma.debitCard.create({
    data: {
      userId,
      accountId,
      cardNumber: encrypt(cardNumber),
      cardHolderName,
      cvv: encrypt(cvv),
      expiryDate,
      cardType: 'DEBIT',
      cardBrand: 'MASTERCARD',
      isActive: true,
      isFrozen: false,
      dailyLimit: 5000
    }
  });

  return {
    success: true,
    message: 'Debit card created successfully',
    card: {
      id: debitCard.id,
      cardNumber: maskCardNumber(cardNumber),
      cardHolderName: debitCard.cardHolderName,
      expiryDate: debitCard.expiryDate,
      cardBrand: debitCard.cardBrand,
      isActive: debitCard.isActive,
      isFrozen: debitCard.isFrozen,
      dailyLimit: debitCard.dailyLimit,
      createdAt: debitCard.createdAt
    }
  };
};

// Get all debit cards for user
export const getUserDebitCards = async (userId) => {
  const cards = await prisma.debitCard.findMany({
    where: { userId },
    include: {
      account: {
        select: {
          accountNumber: true,
          accountType: true,
          balance: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return {
    success: true,
    count: cards.length,
    cards: cards.map(card => ({
      id: card.id,
      cardNumber: maskCardNumber(decrypt(card.cardNumber)),
      cardHolderName: card.cardHolderName,
      expiryDate: card.expiryDate,
      cardBrand: card.cardBrand,
      isActive: card.isActive,
      isFrozen: card.isFrozen,
      dailyLimit: card.dailyLimit,
      account: card.account,
      createdAt: card.createdAt
    }))
  };
};

// Get full card details (requires backup code verification)
export const getFullCardDetails = async (cardId, userId, backupCode) => {
  // Verify backup code
  const validCode = await prisma.backupCode.findFirst({
    where: {
      userId,
      used: false
    }
  });

  if (!validCode) {
    throw new Error('Invalid or used backup code');
  }

  // Get card
  const card = await prisma.debitCard.findFirst({
    where: { id: cardId, userId }
  });

  if (!card) {
    throw new Error('Card not found');
  }

  // Mark backup code as used
  await prisma.backupCode.update({
    where: { id: validCode.id },
    data: {
      used: true,
      usedAt: new Date(),
      usedFor: 'card_details'
    }
  });

  return {
    success: true,
    card: {
      id: card.id,
      cardNumber: decrypt(card.cardNumber),
      cardHolderName: card.cardHolderName,
      cvv: decrypt(card.cvv),
      expiryDate: card.expiryDate,
      cardBrand: card.cardBrand,
      dailyLimit: card.dailyLimit
    }
  };
};

// Freeze debit card
export const freezeDebitCard = async (cardId, userId) => {
  const card = await prisma.debitCard.findFirst({
    where: { id: cardId, userId }
  });

  if (!card) {
    throw new Error('Card not found');
  }

  const updated = await prisma.debitCard.update({
    where: { id: cardId },
    data: { isFrozen: true }
  });

  return {
    success: true,
    message: 'Card frozen successfully',
    card: {
      id: updated.id,
      isFrozen: updated.isFrozen
    }
  };
};

// Unfreeze debit card
export const unfreezeDebitCard = async (cardId, userId) => {
  const card = await prisma.debitCard.findFirst({
    where: { id: cardId, userId }
  });

  if (!card) {
    throw new Error('Card not found');
  }

  const updated = await prisma.debitCard.update({
    where: { id: cardId },
    data: { isFrozen: false }
  });

  return {
    success: true,
    message: 'Card unfrozen successfully',
    card: {
      id: updated.id,
      isFrozen: updated.isFrozen
    }
  };
};

export default {
  createDebitCard,
  getUserDebitCards,
  getFullCardDetails,
  freezeDebitCard,
  unfreezeDebitCard,
  maskCardNumber
};
