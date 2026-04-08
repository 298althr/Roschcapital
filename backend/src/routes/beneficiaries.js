import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import * as beneficiaryService from '../services/beneficiaryService.js';

const beneficiariesRouter = express.Router();

/**
 * POST /api/v1/beneficiaries
 * Create a new beneficiary
 */
beneficiariesRouter.post('/', verifyAuth, async (req, res) => {
  try {
    const { bankName, routingNumber, accountNumber, accountName, nickname } = req.body;

    const beneficiary = await beneficiaryService.createBeneficiary(req.user.userId, {
      bankName,
      routingNumber,
      accountNumber,
      accountName,
      nickname
    });

    return res.status(201).json({
      success: true,
      message: 'Beneficiary added successfully',
      beneficiary
    });
  } catch (error) {
    console.error('Error in POST /beneficiaries:', error);

    if (error.message.includes('already exists') || error.message.includes('Invalid') || error.message.includes('must be')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/beneficiaries
 * Get user's beneficiaries
 */
beneficiariesRouter.get('/', verifyAuth, async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';

    const beneficiaries = await beneficiaryService.getUserBeneficiaries(req.user.userId, includeInactive);

    return res.json({
      success: true,
      beneficiaries
    });
  } catch (error) {
    console.error('Error in GET /beneficiaries:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/beneficiaries/:id
 * Get beneficiary by ID
 */
beneficiariesRouter.get('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const beneficiary = await beneficiaryService.getBeneficiaryById(id, req.user.userId);

    return res.json({
      success: true,
      beneficiary
    });
  } catch (error) {
    console.error('Error in GET /beneficiaries/:id:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/v1/beneficiaries/:id
 * Update beneficiary
 */
beneficiariesRouter.put('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { bankName, routingNumber, accountNumber, accountName, nickname } = req.body;

    const beneficiary = await beneficiaryService.updateBeneficiary(id, req.user.userId, {
      bankName,
      routingNumber,
      accountNumber,
      accountName,
      nickname
    });

    return res.json({
      success: true,
      message: 'Beneficiary updated successfully',
      beneficiary
    });
  } catch (error) {
    console.error('Error in PUT /beneficiaries/:id:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    if (error.message.includes('Invalid') || error.message.includes('must be')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/v1/beneficiaries/:id
 * Delete (deactivate) beneficiary
 */
beneficiariesRouter.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const permanent = req.query.permanent === 'true';

    if (permanent) {
      await beneficiaryService.permanentlyDeleteBeneficiary(id, req.user.userId);
      return res.json({
        success: true,
        message: 'Beneficiary permanently deleted'
      });
    } else {
      const beneficiary = await beneficiaryService.deleteBeneficiary(id, req.user.userId);
      return res.json({
        success: true,
        message: 'Beneficiary deactivated',
        beneficiary
      });
    }
  } catch (error) {
    console.error('Error in DELETE /beneficiaries/:id:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/beneficiaries/:id/reactivate
 * Reactivate a deactivated beneficiary
 */
beneficiariesRouter.post('/:id/reactivate', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const beneficiary = await beneficiaryService.reactivateBeneficiary(id, req.user.userId);

    return res.json({
      success: true,
      message: 'Beneficiary reactivated',
      beneficiary
    });
  } catch (error) {
    console.error('Error in POST /beneficiaries/:id/reactivate:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
});

export { beneficiariesRouter };
