import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import * as invoiceService from '../services/invoiceService.js';

const invoicesRouter = express.Router();

/**
 * GET /api/v1/invoices/payment/:paymentId
 * Generate invoice from a single payment (JSON)
 */
invoicesRouter.get('/payment/:paymentId', verifyAuth, async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'Payment ID is required' });
    }

    const invoice = await invoiceService.generatePaymentInvoice(req.user.userId, paymentId);

    return res.json({ success: true, invoice });
  } catch (error) {
    console.error('Error in GET /payment/:paymentId:', error);

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/invoices/payment/:paymentId/json
 * Get invoice as JSON
 */
invoicesRouter.get('/payment/:paymentId/json', verifyAuth, async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'Payment ID is required' });
    }

    const invoice = await invoiceService.generatePaymentInvoice(req.user.userId, paymentId);

    return res.json({ success: true, invoice });
  } catch (error) {
    console.error('Error in GET /payment/:paymentId/json:', error);

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/invoices/payment/:paymentId/html
 * Get invoice as printable HTML
 */
invoicesRouter.get('/payment/:paymentId/html', verifyAuth, async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'Payment ID is required' });
    }

    const invoice = await invoiceService.generatePaymentInvoice(req.user.userId, paymentId);
    const html = invoiceService.generateInvoiceHTML(invoice);

    return res.type('text/html').send(html);
  } catch (error) {
    console.error('Error in GET /payment/:paymentId/html:', error);

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/invoices/batch
 * Generate batch invoice from multiple payments
 */
invoicesRouter.post('/batch', verifyAuth, async (req, res) => {
  try {
    const { paymentIds } = req.body;

    if (!paymentIds || !Array.isArray(paymentIds)) {
      return res.status(400).json({ success: false, message: 'paymentIds array is required' });
    }

    const invoice = await invoiceService.generateBatchInvoice(req.user.userId, paymentIds);

    return res.json({ success: true, invoice });
  } catch (error) {
    console.error('Error in POST /batch:', error);

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

export { invoicesRouter };
