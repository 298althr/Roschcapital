import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import {
  getUserCards,
  getAccountCards,
  getCardById,
  createCard,
  freezeCard,
  unfreezeCard,
  updateCardLimit,
  deactivateCard,
  activateCard,
  getCardStats,
} from '../services/cardService.js';
import {
  createDebitCard,
  getUserDebitCards,
  getFullCardDetails,
  freezeDebitCard,
  unfreezeDebitCard
} from '../services/debitCardService.js';
import {
  applyCreditCard,
  getUserCreditCards,
  fundCreditCard,
  freezeCreditCard,
  unfreezeCreditCard
} from '../services/creditCardService.js';
import { verifyBackupCode } from '../services/securityService.js';

export const cardsRouter = Router();

// Protect all card routes
cardsRouter.use(verifyAuth);

/**
 * GET /api/v1/cards
 * Get all cards for the current user
 */
cardsRouter.get('/', async (req, res) => {
  try {
    const result = await getUserCards(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /cards:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/cards/stats/overview
 * Get card statistics
 */
cardsRouter.get('/stats/overview', async (req, res) => {
  try {
    const result = await getCardStats(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /cards/stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/cards/account/:accountId
 * Get cards for a specific account
 */
cardsRouter.get('/account/:accountId', async (req, res) => {
  try {
    const result = await getAccountCards(req.params.accountId, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /cards/account/:id:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * POST /api/v1/cards
 * Create a new card
 */
cardsRouter.post('/', async (req, res) => {
  try {
    const { accountId, cardType, dailyLimit } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    const result = await createCard(accountId, req.user.userId, {
      cardType,
      dailyLimit,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error in POST /cards:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * GET /api/v1/cards/:id
 * Get a specific card by ID
 */
cardsRouter.get('/:id', async (req, res) => {
  try {
    const result = await getCardById(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /cards/:id:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/cards/:id/freeze
 * Freeze a card
 */
cardsRouter.put('/:id/freeze', async (req, res) => {
  try {
    const result = await freezeCard(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error in PUT /cards/:id/freeze:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/cards/:id/unfreeze
 * Unfreeze a card
 */
cardsRouter.put('/:id/unfreeze', async (req, res) => {
  try {
    const result = await unfreezeCard(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error in PUT /cards/:id/unfreeze:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/cards/:id/limit
 * Update card daily limit
 */
cardsRouter.put('/:id/limit', async (req, res) => {
  try {
    const { dailyLimit } = req.body;

    if (dailyLimit === undefined) {
      return res.status(400).json({ error: 'dailyLimit is required' });
    }

    const result = await updateCardLimit(req.params.id, req.user.userId, dailyLimit);
    res.json(result);
  } catch (error) {
    console.error('Error in PUT /cards/:id/limit:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/cards/:id/deactivate
 * Deactivate a card
 */
cardsRouter.put('/:id/deactivate', async (req, res) => {
  try {
    const result = await deactivateCard(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error in PUT /cards/:id/deactivate:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/cards/:id/activate
 * Activate a card
 */
cardsRouter.put('/:id/activate', async (req, res) => {
  try {
    const result = await activateCard(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error in PUT /cards/:id/activate:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

// ========== DEBIT CARD ROUTES ==========

cardsRouter.post('/debit', async (req, res) => {
  try {
    const { accountId, backupCode } = req.body;
    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' });
    }
    
    // Verify backup code - REQUIRED for card creation
    if (!backupCode) {
      return res.status(400).json({ error: 'Backup code is required to create a card' });
    }
    
    const backupResult = await verifyBackupCode(req.user.userId, backupCode);
    if (!backupResult.valid) {
      return res.status(401).json({ error: backupResult.error || 'Invalid backup code', alreadyUsed: backupResult.alreadyUsed });
    }
    
    // Get user's name from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { firstName: true, lastName: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const cardHolderName = `${user.firstName} ${user.lastName}`.toUpperCase();
    const result = await createDebitCard(req.user.userId, accountId, cardHolderName);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating debit card:', error);
    res.status(500).json({ error: error.message });
  }
});

cardsRouter.get('/debit', async (req, res) => {
  try {
    const result = await getUserDebitCards(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error getting debit cards:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reveal full card details with backup code verification
cardsRouter.post('/debit/:id/reveal', async (req, res) => {
  try {
    const { backupCode } = req.body;
    if (!backupCode) {
      return res.status(400).json({ error: 'Backup code is required' });
    }
    const result = await getFullCardDetails(req.params.id, req.user.userId, backupCode);
    res.json(result);
  } catch (error) {
    console.error('Error revealing card details:', error);
    res.status(400).json({ error: error.message });
  }
});

cardsRouter.post('/debit/:id/details', async (req, res) => {
  try {
    const { backupCode } = req.body;
    if (!backupCode) {
      return res.status(400).json({ error: 'Backup code is required' });
    }
    const result = await getFullCardDetails(req.params.id, req.user.userId, backupCode);
    res.json(result);
  } catch (error) {
    console.error('Error getting card details:', error);
    res.status(403).json({ error: error.message });
  }
});

cardsRouter.post('/debit/:id/freeze', async (req, res) => {
  try {
    const result = await freezeDebitCard(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error freezing debit card:', error);
    res.status(500).json({ error: error.message });
  }
});

cardsRouter.post('/debit/:id/unfreeze', async (req, res) => {
  try {
    const result = await unfreezeDebitCard(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error unfreezing debit card:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== CREDIT CARD ROUTES ==========

cardsRouter.post('/credit/apply', async (req, res) => {
  try {
    const { requestedLimit, backupCode } = req.body;
    if (!requestedLimit) {
      return res.status(400).json({ error: 'Requested limit is required' });
    }
    
    // Verify backup code - REQUIRED for card creation
    if (!backupCode) {
      return res.status(400).json({ error: 'Backup code is required to create a card' });
    }
    
    const backupResult = await verifyBackupCode(req.user.userId, backupCode);
    if (!backupResult.valid) {
      return res.status(401).json({ error: backupResult.error || 'Invalid backup code', alreadyUsed: backupResult.alreadyUsed });
    }
    
    // Get user's name from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { firstName: true, lastName: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const cardHolderName = `${user.firstName} ${user.lastName}`.toUpperCase();
    const result = await applyCreditCard(req.user.userId, requestedLimit, cardHolderName);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error applying for credit card:', error);
    res.status(500).json({ error: error.message });
  }
});

cardsRouter.get('/credit', async (req, res) => {
  try {
    const result = await getUserCreditCards(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error getting credit cards:', error);
    res.status(500).json({ error: error.message });
  }
});

cardsRouter.post('/credit/:id/fund', async (req, res) => {
  try {
    const { accountId, amount } = req.body;
    if (!accountId || !amount) {
      return res.status(400).json({ error: 'Account ID and amount are required' });
    }
    const result = await fundCreditCard(req.params.id, accountId, amount, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error funding credit card:', error);
    res.status(500).json({ error: error.message });
  }
});

cardsRouter.post('/credit/:id/freeze', async (req, res) => {
  try {
    const result = await freezeCreditCard(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error freezing credit card:', error);
    res.status(500).json({ error: error.message });
  }
});

cardsRouter.post('/credit/:id/unfreeze', async (req, res) => {
  try {
    const result = await unfreezeCreditCard(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error unfreezing credit card:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== CARD TRANSACTION ROUTES ==========

/**
 * GET /api/v1/cards/:id/transactions
 * Get transactions for a specific card (debit or credit)
 */
cardsRouter.get('/:id/transactions', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const cardId = req.params.id;
    
    // Check if it's a debit or credit card and get transactions
    const debitCard = await prisma.debitCard.findFirst({
      where: { id: cardId, userId: req.user.userId }
    });
    
    const creditCard = await prisma.creditCard.findFirst({
      where: { id: cardId, userId: req.user.userId }
    });
    
    if (!debitCard && !creditCard) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    const transactions = await prisma.cardTransaction.findMany({
      where: {
        userId: req.user.userId,
        OR: [
          { debitCardId: cardId },
          { creditCardId: cardId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });
    
    res.json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error('Error getting card transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/cards/all/combined
 * Get all debit and credit cards combined for the user
 */
cardsRouter.get('/all/combined', async (req, res) => {
  try {
    const debitCards = await prisma.debitCard.findMany({
      where: { userId: req.user.userId },
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
    
    const creditCards = await prisma.creditCard.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });
    
    // Format cards with type indicator
    const formattedDebitCards = debitCards.map(card => ({
      ...card,
      cardType: 'DEBIT',
      cardNumber: card.cardNumber,
      expiryDate: card.expiryDate,
      isActive: card.isActive,
      isFrozen: card.isFrozen,
      dailyLimit: card.dailyLimit
    }));
    
    const formattedCreditCards = creditCards.map(card => ({
      ...card,
      cardType: 'CREDIT',
      cardNumber: card.cardNumber,
      expiryDate: card.expiryDate,
      isActive: card.isActive,
      isFrozen: card.isFrozen,
      status: card.status,
      approvalStatus: card.approvalStatus,
      creditLimit: card.creditLimit,
      availableCredit: card.availableCredit,
      currentBalance: card.currentBalance,
      apr: card.apr
    }));
    
    const allCards = [...formattedDebitCards, ...formattedCreditCards];
    
    res.json({
      success: true,
      count: allCards.length,
      cards: allCards,
      debitCount: debitCards.length,
      creditCount: creditCards.length
    });
  } catch (error) {
    console.error('Error getting combined cards:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/cards/debit/:cardId/change-pin
 * Change PIN for debit card
 */
cardsRouter.put('/debit/:cardId/change-pin', async (req, res) => {
  try {
    const { cardId } = req.params;
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin) {
      return res.status(400).json({ error: 'Current PIN and new PIN are required' });
    }

    if (!/^\d{4}$/.test(newPin)) {
      return res.status(400).json({ error: 'PIN must be 4 digits' });
    }

    // Get card and verify ownership
    const card = await prisma.debitCard.findFirst({
      where: {
        id: cardId,
        userId: req.user.userId
      }
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Verify current PIN
    if (card.pin !== currentPin) {
      return res.status(401).json({ error: 'Current PIN is incorrect' });
    }

    // Update PIN
    await prisma.debitCard.update({
      where: { id: cardId },
      data: { pin: newPin }
    });

    res.json({
      success: true,
      message: 'PIN changed successfully'
    });
  } catch (error) {
    console.error('Error changing debit card PIN:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/cards/credit/:cardId/change-pin
 * Change PIN for credit card
 */
cardsRouter.put('/credit/:cardId/change-pin', async (req, res) => {
  try {
    const { cardId } = req.params;
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin) {
      return res.status(400).json({ error: 'Current PIN and new PIN are required' });
    }

    if (!/^\d{4}$/.test(newPin)) {
      return res.status(400).json({ error: 'PIN must be 4 digits' });
    }

    // Get card and verify ownership
    const card = await prisma.creditCard.findFirst({
      where: {
        id: cardId,
        userId: req.user.userId
      }
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Verify current PIN
    if (card.pin !== currentPin) {
      return res.status(401).json({ error: 'Current PIN is incorrect' });
    }

    // Update PIN
    await prisma.creditCard.update({
      where: { id: cardId },
      data: { pin: newPin }
    });

    res.json({
      success: true,
      message: 'PIN changed successfully'
    });
  } catch (error) {
    console.error('Error changing credit card PIN:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/cards/debit/:cardId/transactions
 * Get transactions for debit card
 */
cardsRouter.get('/debit/:cardId/transactions', async (req, res) => {
  try {
    const { cardId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    // Get card and verify ownership
    const card = await prisma.debitCard.findFirst({
      where: {
        id: cardId,
        userId: req.user.userId
      },
      include: {
        account: true
      }
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Get transactions for the linked account
    const transactions = await prisma.transaction.findMany({
      where: {
        accountId: card.accountId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error fetching debit card transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/cards/credit/:cardId/transactions
 * Get transactions for credit card
 */
cardsRouter.get('/credit/:cardId/transactions', async (req, res) => {
  try {
    const { cardId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    // Get card and verify ownership
    const card = await prisma.creditCard.findFirst({
      where: {
        id: cardId,
        userId: req.user.userId
      }
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Get credit card transactions (purchases, payments, etc.)
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { description: { contains: card.cardNumber.slice(-4) } },
          { reference: { contains: cardId } }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error fetching credit card transactions:', error);
    res.status(500).json({ error: error.message });
  }
});
