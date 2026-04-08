import { Router } from 'express';
import { verifyAuth, isAdmin } from '../middleware/auth.js';
import {
  getPendingTransfers,
  approveTransfer,
  declineTransfer,
  reverseTransfer
} from '../services/transferService.js';

export const adminTransfersRouter = Router();

// Protect all routes with auth and admin check
adminTransfersRouter.use(verifyAuth);
adminTransfersRouter.use(isAdmin);

/**
 * GET /api/v1/admin/transfers/pending
 * Get pending transfers
 */
adminTransfersRouter.get('/pending', async (req, res) => {
  try {
    const result = await getPendingTransfers();
    res.json(result);
  } catch (error) {
    console.error('Error getting pending transfers:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/admin/transfers/:id/approve
 * Approve transfer
 */
adminTransfersRouter.post('/:id/approve', async (req, res) => {
  try {
    const { notes } = req.body;
    const result = await approveTransfer(req.params.id, req.user.userId, notes);
    res.json(result);
  } catch (error) {
    console.error('Error approving transfer:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/admin/transfers/:id/decline
 * Decline transfer
 */
adminTransfersRouter.post('/:id/decline', async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Decline reason is required' });
    }
    
    const result = await declineTransfer(req.params.id, req.user.userId, reason);
    res.json(result);
  } catch (error) {
    console.error('Error declining transfer:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/admin/transfers/:id/reverse
 * Reverse transfer
 */
adminTransfersRouter.post('/:id/reverse', async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Reversal reason is required' });
    }
    
    const result = await reverseTransfer(req.params.id, req.user.userId, reason);
    res.json(result);
  } catch (error) {
    console.error('Error reversing transfer:', error);
    res.status(500).json({ error: error.message });
  }
});

export default adminTransfersRouter;
