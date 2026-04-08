import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import {
  getPendingApplications,
  approveCreditCard,
  declineCreditCard
} from '../services/creditCardService.js';

export const adminCardsRouter = Router();

// Protect all admin routes
adminCardsRouter.use(verifyAuth);

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

adminCardsRouter.use(isAdmin);

/**
 * GET /api/v1/admin/cards/credit/pending
 * Get pending credit card applications
 */
adminCardsRouter.get('/credit/pending', async (req, res) => {
  try {
    const result = await getPendingApplications();
    res.json(result);
  } catch (error) {
    console.error('Error getting pending applications:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/admin/cards/credit/:id/approve
 * Approve credit card application
 */
adminCardsRouter.post('/credit/:id/approve', async (req, res) => {
  try {
    const { approvedLimit, apr } = req.body;
    
    if (!approvedLimit || !apr) {
      return res.status(400).json({ error: 'Approved limit and APR are required' });
    }
    
    const result = await approveCreditCard(
      req.params.id,
      req.user.userId,
      parseFloat(approvedLimit),
      parseFloat(apr)
    );
    res.json(result);
  } catch (error) {
    console.error('Error approving credit card:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/admin/cards/credit/:id/decline
 * Decline credit card application
 */
adminCardsRouter.post('/credit/:id/decline', async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Decline reason is required' });
    }
    
    const result = await declineCreditCard(req.params.id, req.user.userId, reason);
    res.json(result);
  } catch (error) {
    console.error('Error declining credit card:', error);
    res.status(500).json({ error: error.message });
  }
});

export default adminCardsRouter;
