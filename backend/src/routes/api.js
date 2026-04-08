import express from 'express';
import authRouter from './auth.js';
import { accountsRouter } from './accounts.js';
import { cardsRouter } from './cards.js';
import { transactionsRouter } from './transactions.js';
import { paymentsRouter } from './payments.js';
import { invoicesRouter } from './invoices.js';
import adminRouter from './admin.js';
import adminCardsRouter from './adminCards.js';
import adminTransfersRouter from './adminTransfers.js';
import notificationsRouter from './notifications.js';
import kycRouter from './kyc.js';
import transfersRouter from './transfers.js';
import marketsRouter from './markets.js';
import supportRouter from './support.js';
import gatewaysRouter from './gateways.js';
import supportTicketsRouter from './supportTickets.js';
import fixUsersRouter from './fix-users.js';
import fixAccountsRouter from './fix-accounts.js';
import runFixRouter from './run-fix.js';
import currenciesRouter from './currencies.js';
import { chequesRouter } from './cheques.js';
import { loansRouter } from './loans.js';
import { beneficiariesRouter } from './beneficiaries.js';
import backupRouter from './backup.js';
import generateTransactionsRouter from './generateTransactions.js';
import recurringPaymentsRouter from './recurringPayments.js';
import fixedDepositsRouter from './fixedDeposits.js';
import { verifyAuth } from '../middleware/auth.js';
import { getAccountSummary } from '../services/accountService.js';

const router = express.Router();

// API versioning: /api/v1/*
router.use('/auth', authRouter);
router.use('/accounts', accountsRouter);
router.use('/cards', cardsRouter);
router.use('/transactions', transactionsRouter);
router.use('/payments', paymentsRouter);
router.use('/invoices', invoicesRouter);
router.use('/mybanker', adminRouter);
router.use('/admin/cards', adminCardsRouter);
router.use('/admin/transfers', adminTransfersRouter);
router.use('/transfers', transfersRouter);
router.use('/markets', marketsRouter);
router.use('/support', supportRouter);
router.use('/gateways', gatewaysRouter);
router.use('/support-tickets', supportTicketsRouter);
router.use('/notifications', notificationsRouter);
router.use('/kyc', kycRouter);
router.use('/currencies', currenciesRouter);
router.use('/cheques', chequesRouter);
router.use('/loans', loansRouter);
router.use('/beneficiaries', beneficiariesRouter);
router.use('/backup', backupRouter);
router.use('/recurring-payments', recurringPaymentsRouter);
router.use('/fixed-deposits', fixedDepositsRouter);
router.use('/admin/generate', generateTransactionsRouter);
router.use('/', fixUsersRouter); // Temporary fix route
router.use('/fix-accounts', fixAccountsRouter); // Temporary fix route
router.use('/run-fix', runFixRouter); // Temporary route to execute account fix

/**
 * GET /api/v1/dashboard
 * Get dashboard data (summary of all accounts, cards, transactions)
 */
router.get('/dashboard', verifyAuth, async (req, res) => {
	try {
		const summary = await getAccountSummary(req.user.userId);
		res.json({
			success: true,
			dashboard: {
				timestamp: new Date().toISOString(),
				summary: summary.summary,
				recentTransactions: summary.recentTransactions,
			},
		});
	} catch (error) {
		console.error('Error in GET /dashboard:', error);
		res.status(500).json({ error: error.message });
	}
});

export default router;
