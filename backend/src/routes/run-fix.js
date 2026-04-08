// Temporary route to execute the account fix - DELETE AFTER USE
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/run-fix (no auth required for quick execution)
router.get('/', async (req, res) => {
  try {
    console.log('🔧 Starting account type fix...');
    
    // Find both Brokard Williams users
    const brokardUsers = await prisma.user.findMany({
      where: {
        firstName: 'Brokard',
        lastName: 'Williams'
      },
      include: {
        accounts: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    console.log(`Found ${brokardUsers.length} Brokard Williams users`);

    const results = [];

    for (const user of brokardUsers) {
      console.log(`Processing: ${user.email}`);
      
      if (user.accounts.length !== 3) {
        results.push({
          email: user.email,
          status: 'skipped',
          reason: `Expected 3 accounts, found ${user.accounts.length}`
        });
        continue;
      }

      const [account1, account2, account3] = user.accounts;

      console.log(`Current types: ${account1.accountType}, ${account2.accountType}, ${account3.accountType}`);

      // Update to: CHECKING, CRYPTO_WALLET, SAVINGS
      await prisma.account.update({
        where: { id: account1.id },
        data: { accountType: 'CHECKING' }
      });

      await prisma.account.update({
        where: { id: account2.id },
        data: { accountType: 'CRYPTO_WALLET' }
      });

      await prisma.account.update({
        where: { id: account3.id },
        data: { accountType: 'SAVINGS' }
      });

      console.log(`Updated to: CHECKING, CRYPTO_WALLET, SAVINGS`);

      results.push({
        email: user.email,
        status: 'updated',
        changes: [
          { accountNumber: account1.accountNumber, oldType: account1.accountType, newType: 'CHECKING' },
          { accountNumber: account2.accountNumber, oldType: account2.accountType, newType: 'CRYPTO_WALLET' },
          { accountNumber: account3.accountNumber, oldType: account3.accountType, newType: 'SAVINGS' }
        ]
      });
    }

    console.log('✅ Fix completed successfully!');

    return res.json({
      success: true,
      message: `Fixed account types for ${results.filter(r => r.status === 'updated').length} users`,
      results
    });

  } catch (error) {
    console.error('Fix error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fix account types', 
      details: error.message 
    });
  }
});

export default router;
