import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import {
  createSupportTicket,
  getUserTickets,
  getTicketById,
  addTicketMessage,
  getAllTickets,
  updateTicketStatus,
  addAdminMessage
} from '../services/supportService.js';

export const supportRouter = Router();

// Protect all routes
supportRouter.use(verifyAuth);

/**
 * POST /api/v1/support/tickets
 * Create support ticket
 */
supportRouter.post('/tickets', async (req, res) => {
  try {
    const { subject, category, priority, description, message } = req.body;
    const ticketDescription = description || message; // Accept both field names
    
    if (!subject || !category || !ticketDescription) {
      return res.status(400).json({ error: 'Missing required fields: subject, category, and description/message are required' });
    }
    
    const result = await createSupportTicket(req.user.userId, {
      subject,
      category,
      priority,
      description: ticketDescription
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/support/tickets
 * Get user's tickets
 */
supportRouter.get('/tickets', async (req, res) => {
  try {
    const result = await getUserTickets(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error getting tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/support/tickets/:id
 * Get ticket by ID
 */
supportRouter.get('/tickets/:id', async (req, res) => {
  try {
    const result = await getTicketById(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error getting ticket:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * POST /api/v1/support/tickets/:id/messages
 * Add message to ticket
 */
supportRouter.post('/tickets/:id/messages', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const result = await addTicketMessage(
      req.params.id,
      req.user.userId,
      message
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin routes
const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

/**
 * GET /api/v1/support/admin/tickets
 * Get all tickets (admin)
 */
supportRouter.get('/admin/tickets', isAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const result = await getAllTickets(status);
    res.json(result);
  } catch (error) {
    console.error('Error getting tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/v1/support/admin/tickets/:id/status
 * Update ticket status (admin)
 */
supportRouter.patch('/admin/tickets/:id/status', isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const result = await updateTicketStatus(
      req.params.id,
      status,
      req.user.userId
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/support/admin/tickets/:id/messages
 * Add admin message to ticket
 */
supportRouter.post('/admin/tickets/:id/messages', isAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const result = await addAdminMessage(
      req.params.id,
      req.user.userId,
      message
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding admin message:', error);
    res.status(500).json({ error: error.message });
  }
});

export default supportRouter;
