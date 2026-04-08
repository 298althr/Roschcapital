import express from 'express';
import { verifyAuth, isAdmin } from '../middleware/auth.js';
import * as chequeService from '../services/chequeService.js';
import { generateChequeHTML } from '../utils/chequePdfGenerator.js';

const chequesRouter = express.Router();

/**
 * POST /api/v1/cheques
 * Create a new cheque
 */
chequesRouter.post('/', verifyAuth, async (req, res) => {
  try {
    const { amount, payee, memo } = req.body;

    const cheque = await chequeService.createCheque(req.user.userId, {
      amount,
      payee,
      memo
    });

    return res.status(201).json({
      success: true,
      message: 'Cheque created successfully',
      cheque
    });
  } catch (error) {
    console.error('Error in POST /cheques:', error);

    if (error.message.includes('Insufficient')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/cheques
 * Get user's cheques
 */
chequesRouter.get('/', verifyAuth, async (req, res) => {
  try {
    const { status } = req.query;

    const cheques = await chequeService.getUserCheques(req.user.userId, {
      status
    });

    return res.json({
      success: true,
      cheques
    });
  } catch (error) {
    console.error('Error in GET /cheques:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/cheques/:id
 * Get cheque details
 */
chequesRouter.get('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const cheque = await chequeService.getChequeById(id, req.user.userId);

    return res.json({
      success: true,
      cheque
    });
  } catch (error) {
    console.error('Error in GET /cheques/:id:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/cheques/:id/print
 * Generate printable cheque HTML
 */
chequesRouter.get('/:id/print', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const cheque = await chequeService.getChequeById(id, req.user.userId);

    const html = generateChequeHTML(cheque);

    return res.type('text/html').send(html);
  } catch (error) {
    console.error('Error in GET /cheques/:id/print:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/cheques/:id/cancel
 * Cancel a pending cheque
 */
chequesRouter.post('/:id/cancel', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const cheque = await chequeService.cancelCheque(id, req.user.userId);

    return res.json({
      success: true,
      message: 'Cheque cancelled successfully',
      cheque
    });
  } catch (error) {
    console.error('Error in POST /cheques/:id/cancel:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    if (error.message.includes('Cannot cancel')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/cheques/admin/all
 * Get all cheques (admin only)
 */
chequesRouter.get('/admin/all', verifyAuth, isAdmin, async (req, res) => {
  try {
    const { status, userId } = req.query;

    const cheques = await chequeService.getAllCheques({
      status,
      userId
    });

    return res.json({
      success: true,
      cheques
    });
  } catch (error) {
    console.error('Error in GET /cheques/admin/all:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/cheques/admin/pending
 * Get pending cheques (admin only)
 */
chequesRouter.get('/admin/pending', verifyAuth, isAdmin, async (req, res) => {
  try {
    const cheques = await chequeService.getPendingCheques();

    return res.json({
      success: true,
      cheques
    });
  } catch (error) {
    console.error('Error in GET /cheques/admin/pending:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/cheques/admin/:id/clear
 * Clear a cheque (admin only)
 */
chequesRouter.post('/admin/:id/clear', verifyAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await chequeService.clearCheque(id, req.user.userId);

    return res.json({
      success: true,
      message: 'Cheque cleared successfully',
      ...result
    });
  } catch (error) {
    console.error('Error in POST /cheques/admin/:id/clear:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    if (error.message.includes('Insufficient') || error.message.includes('already')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/cheques/admin/:id/bounce
 * Bounce a cheque (admin only)
 */
chequesRouter.post('/admin/:id/bounce', verifyAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const cheque = await chequeService.bounceCheque(id, req.user.userId, reason);

    return res.json({
      success: true,
      message: 'Cheque bounced',
      cheque
    });
  } catch (error) {
    console.error('Error in POST /cheques/admin/:id/bounce:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    if (error.message.includes('already')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/cheques/admin/:id/validate
 * Validate cheque before clearing (admin only)
 */
chequesRouter.post('/admin/:id/validate', verifyAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const validation = await chequeService.validateCheque(id);

    return res.json({
      success: true,
      validation
    });
  } catch (error) {
    console.error('Error in POST /cheques/admin/:id/validate:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

export { chequesRouter };
