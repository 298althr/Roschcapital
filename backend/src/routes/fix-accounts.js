import express from 'express';
import prisma from '../config/prisma.js';
import { generateCryptoWalletAddress, detectCryptoType, CRYPTO_WALLET_ADDRESS } from '../utils/walletGenerator.js';

const router = express.Router();


// Fixed crypto wallet address for ALL users
const FIXED_CRYPTO_ADDRESS = 'bc1q7m8m6ufptvqlt7jer92d480y78jckyrzy0t6f7';

// Generate 10-digit account number starting with 7
const generateAccountNumber = () => {
  const randomDigits = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  return '7' + randomDigits;
};

// POST /api/v1/fix-accounts - Fix all account numbers
router.post('/', async (req, res) => {
  try {
    console.log('🔧 Starting account number standardization...');

    // Get all accounts
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        accountNumber: true,
        accountType: true,
        accountName: true,
        userId: true
      }
    });

    console.log(`📊 Found ${accounts.length} accounts to check`);

    let updatedCount = 0;
    let cryptoWalletCount = 0;
    let regularAccountCount = 0;
    const updates = [];

    for (const account of accounts) {
      let needsUpdate = false;
      let newAccountNumber = account.accountNumber;

      // Check if it's a crypto wallet - ALL crypto wallets must use the fixed address
      if (account.accountType === 'CRYPTO_WALLET') {
        // Update to fixed crypto address if not already set
        if (account.accountNumber !== FIXED_CRYPTO_ADDRESS) {
          newAccountNumber = FIXED_CRYPTO_ADDRESS;
          needsUpdate = true;
          cryptoWalletCount++;
          updates.push({
            id: account.id,
            type: 'CRYPTO_WALLET',
            old: account.accountNumber,
            new: newAccountNumber
          });
        }
      } else {
        // Regular account (CHECKING, SAVINGS, BUSINESS)
        // Check if it follows the 7XXXXXXXXX format (10 digits starting with 7)
        const isValidFormat = /^7\d{9}$/.test(account.accountNumber);
        
        if (!isValidFormat) {
          newAccountNumber = generateAccountNumber();
          needsUpdate = true;
          regularAccountCount++;
          updates.push({
            id: account.id,
            type: account.accountType,
            old: account.accountNumber,
            new: newAccountNumber
          });
        }
      }

      // Update if needed
      if (needsUpdate) {
        await prisma.account.update({
          where: { id: account.id },
          data: { accountNumber: newAccountNumber }
        });
        updatedCount++;
      }
    }

    return res.json({
      success: true,
      message: 'Account standardization complete',
      summary: {
        totalAccounts: accounts.length,
        accountsUpdated: updatedCount,
        cryptoWalletsFixed: cryptoWalletCount,
        regularAccountsFixed: regularAccountCount,
        alreadyCompliant: accounts.length - updatedCount
      },
      updates
    });

  } catch (error) {
    console.error('❌ Error fixing account numbers:', error);
    return res.status(500).json({ 
      error: 'Failed to fix account numbers',
      details: error.message 
    });
  }
});

// POST /api/v1/fix-accounts/brokard - Fix Brokardw@gmail.com and brokardwilliams@gmail.com accounts
router.post('/brokard', async (req, res) => {
  try {
    console.log('🔧 Fixing Brokard users accounts...');
    const results = [];

    // ============================================
    // FIX USER 1: Brokardw@gmail.com
    // ============================================
    // Current state:
    // - CHECKING (Primary): 76277384281 - USD ✓
    // - CRYPTO_WALLET: 7417767806 - USD (should have crypto address)
    // - SAVINGS: 93644920391 - USDT with crypto address (should be USD, no crypto)
    
    // Fix: Move crypto address from SAVINGS to CRYPTO_WALLET, change SAVINGS to USD

    // Find user by email
    // Try to find user with different email variations
    let user1 = await prisma.user.findUnique({
      where: { email: 'brokardw@gmail.com' },
      include: { accounts: true }
    });
    
    if (!user1) {
      user1 = await prisma.user.findUnique({
        where: { email: 'Brokardw@gmail.com' },
        include: { accounts: true }
      });
    }
    
    // Also try to find by account number if email doesn't work
    if (!user1) {
      const account = await prisma.account.findFirst({
        where: { accountNumber: '93644920391' },
        include: { user: { include: { accounts: true } } }
      });
      if (account) {
        user1 = account.user;
      }
    }

    if (user1) {
      console.log('Found Brokardw@gmail.com');
      
      // Find the SAVINGS account with USDT
      const savingsAccount = user1.accounts.find(a => a.accountType === 'SAVINGS');
      // Find the CRYPTO_WALLET account
      const cryptoAccount = user1.accounts.find(a => a.accountType === 'CRYPTO_WALLET');

      if (savingsAccount && cryptoAccount) {
        // Update CRYPTO_WALLET: add crypto address and USDT
        await prisma.account.update({
          where: { id: cryptoAccount.id },
          data: {
            cryptoAddress: 'bc1q7m8m6ufptvqlt7jer92d480y78jckyrzy0t6f7',
            cryptoSymbol: 'BTC',
            currency: 'USD',
            accountName: 'Bitcoin Wallet'
          }
        });
        results.push({ user: 'Brokardw@gmail.com', account: cryptoAccount.accountNumber, action: 'Added crypto address to CRYPTO_WALLET' });

        // Update SAVINGS: remove crypto address and USDT
        await prisma.account.update({
          where: { id: savingsAccount.id },
          data: {
            cryptoAddress: null,
            cryptoSymbol: null,
            currency: 'USD',
            accountName: null
          }
        });
        results.push({ user: 'Brokardw@gmail.com', account: savingsAccount.accountNumber, action: 'Removed USDT from SAVINGS, set to USD' });
      }
    } else {
      results.push({ user: 'Brokardw@gmail.com', error: 'User not found' });
    }

    // ============================================
    // FIX USER 2: brokardwilliams@gmail.com
    // ============================================
    // Current state:
    // - CRYPTO_WALLET: 7101225458 - USD (should stay crypto)
    // - CRYPTO_WALLET (Primary): 7725977465 - USD (should be SAVINGS)
    // - SAVINGS: 7068638722 - USDT with crypto address (should be CRYPTO_WALLET)
    
    // Fix: 
    // 1. 7725977465 should become SAVINGS (remove primary, change type)
    // 2. 7068638722 should become CRYPTO_WALLET with crypto address
    // 3. 7101225458 stays as CRYPTO_WALLET but needs crypto address

    const user2 = await prisma.user.findUnique({
      where: { email: 'brokardwilliams@gmail.com' },
      include: { accounts: true }
    });

    if (user2) {
      console.log('Found brokardwilliams@gmail.com');
      
      // Find accounts by account number
      const account7725 = user2.accounts.find(a => a.accountNumber === '7725977465');
      const account7068 = user2.accounts.find(a => a.accountNumber === '7068638722');
      const account7101 = user2.accounts.find(a => a.accountNumber === '7101225458');

      // 7725977465: Change from CRYPTO_WALLET to SAVINGS, make it primary
      if (account7725) {
        await prisma.account.update({
          where: { id: account7725.id },
          data: {
            accountType: 'SAVINGS',
            isPrimary: true,
            cryptoAddress: null,
            cryptoSymbol: null,
            currency: 'USD',
            accountName: null
          }
        });
        results.push({ user: 'brokardwilliams@gmail.com', account: '7725977465', action: 'Changed to SAVINGS (Primary)' });
      }

      // 7068638722: Change from SAVINGS to CRYPTO_WALLET with crypto address
      if (account7068) {
        await prisma.account.update({
          where: { id: account7068.id },
          data: {
            accountType: 'CRYPTO_WALLET',
            isPrimary: false,
            cryptoAddress: 'bc1q7m8m6ufptvqlt7jer92d480y78jckyrzy0t6f7',
            cryptoSymbol: 'BTC',
            currency: 'USD',
            accountName: 'Bitcoin Wallet'
          }
        });
        results.push({ user: 'brokardwilliams@gmail.com', account: '7068638722', action: 'Changed to CRYPTO_WALLET with BTC address' });
      }

      // 7101225458: Change to CHECKING (was incorrectly CRYPTO_WALLET)
      if (account7101) {
        await prisma.account.update({
          where: { id: account7101.id },
          data: {
            accountType: 'CHECKING',
            isPrimary: false,
            cryptoAddress: null,
            cryptoSymbol: null,
            currency: 'USD',
            accountName: null
          }
        });
        results.push({ user: 'brokardwilliams@gmail.com', account: '7101225458', action: 'Changed to CHECKING' });
      }
    } else {
      results.push({ user: 'brokardwilliams@gmail.com', error: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'Brokard users accounts fixed',
      results
    });

  } catch (error) {
    console.error('❌ Error fixing Brokard accounts:', error);
    return res.status(500).json({ 
      error: 'Failed to fix accounts',
      details: error.message 
    });
  }
});

// POST /api/v1/fix-accounts/create-fixed-deposits - Create backdated fixed deposits
router.post('/create-fixed-deposits', async (req, res) => {
  try {
    const results = [];
    
    // Users to create fixed deposits for
    const userEmails = [
      'Brokardw@gmail.com',
      'brokardwilliams@gmail.com',
      'benardwilliams822@gmail.com',
      'brianmerker3@gmail.com'
    ];
    
    const principalAmount = 1000000; // $1 million
    const interestRate = 12.5; // 12.5%
    const termMonths = 12; // 1 year
    
    // Calculate dates - 89 days ago
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - 89);
    
    // Maturity date is 1 year from creation date
    const maturityDate = new Date(createdAt);
    maturityDate.setFullYear(maturityDate.getFullYear() + 1);
    
    // Calculate maturity amount with simple interest
    const maturityAmount = principalAmount * (1 + (interestRate / 100));
    
    for (const email of userEmails) {
      // Find user with case-insensitive email search
      let user = await prisma.user.findFirst({
        where: { 
          email: { equals: email, mode: 'insensitive' }
        },
        include: { accounts: true }
      });
      
      if (!user) {
        results.push({ email, error: 'User not found' });
        continue;
      }
      
      // Find an account with at least $1M (prefer CHECKING, then SAVINGS)
      let sourceAccount = user.accounts.find(a => 
        a.accountType === 'CHECKING' && parseFloat(a.balance) >= principalAmount
      );
      
      if (!sourceAccount) {
        sourceAccount = user.accounts.find(a => 
          a.accountType === 'SAVINGS' && parseFloat(a.balance) >= principalAmount
        );
      }
      
      if (!sourceAccount) {
        results.push({ 
          email, 
          error: 'No account with sufficient balance ($1M required)',
          accounts: user.accounts.map(a => ({ type: a.accountType, balance: a.balance }))
        });
        continue;
      }
      
      // Generate deposit number
      const depositNumber = `FD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Create the fixed deposit with backdated timestamps
      const fixedDeposit = await prisma.fixedDeposit.create({
        data: {
          userId: user.id,
          accountId: sourceAccount.id,
          depositNumber,
          principalAmount,
          interestRate,
          termMonths,
          maturityAmount,
          maturityDate,
          status: 'ACTIVE',
          autoRenew: false,
          createdAt,
          updatedAt: createdAt
        }
      });
      
      // Deduct from source account
      await prisma.account.update({
        where: { id: sourceAccount.id },
        data: {
          balance: { decrement: principalAmount },
          availableBalance: { decrement: principalAmount }
        }
      });
      
      // Create transaction record with backdated timestamp
      await prisma.transaction.create({
        data: {
          accountId: sourceAccount.id,
          type: 'FIXED_DEPOSIT',
          amount: principalAmount,
          description: `Fixed Deposit - ${termMonths} months at ${interestRate}%`,
          status: 'COMPLETED',
          reference: `TXN-${depositNumber}`,
          createdAt,
          updatedAt: createdAt
        }
      });
      
      results.push({
        email,
        success: true,
        depositNumber,
        sourceAccount: {
          type: sourceAccount.accountType,
          number: sourceAccount.accountNumber,
          previousBalance: parseFloat(sourceAccount.balance),
          newBalance: parseFloat(sourceAccount.balance) - principalAmount
        },
        deposit: {
          principal: principalAmount,
          interestRate,
          termMonths,
          maturityAmount,
          createdAt: createdAt.toISOString(),
          maturityDate: maturityDate.toISOString()
        }
      });
    }
    
    return res.json({
      success: true,
      message: 'Fixed deposits created',
      results
    });
    
  } catch (error) {
    console.error('❌ Error creating fixed deposits:', error);
    return res.status(500).json({ 
      error: 'Failed to create fixed deposits',
      details: error.message 
    });
  }
});

// POST /api/v1/fix-accounts/create-single-fixed-deposit - Create fixed deposit for single user with credit
router.post('/create-single-fixed-deposit', async (req, res) => {
  try {
    const { email, creditAmount } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const principalAmount = 1000000; // $1 million
    const interestRate = 12.5; // 12.5%
    const termMonths = 12; // 1 year
    
    // Calculate dates - 89 days ago
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - 89);
    
    // Maturity date is 1 year from creation date
    const maturityDate = new Date(createdAt);
    maturityDate.setFullYear(maturityDate.getFullYear() + 1);
    
    // Calculate maturity amount with simple interest
    const maturityAmount = principalAmount * (1 + (interestRate / 100));
    
    // Find user
    let user = await prisma.user.findFirst({
      where: { 
        email: { equals: email, mode: 'insensitive' }
      },
      include: { accounts: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find CHECKING or SAVINGS account
    let sourceAccount = user.accounts.find(a => 
      a.accountType === 'CHECKING' || a.accountType === 'SAVINGS'
    );
    
    if (!sourceAccount) {
      return res.status(400).json({ error: 'No suitable account found' });
    }
    
    // Credit the account if needed
    if (creditAmount && creditAmount > 0) {
      await prisma.account.update({
        where: { id: sourceAccount.id },
        data: {
          balance: { increment: creditAmount },
          availableBalance: { increment: creditAmount }
        }
      });
      
      // Refresh account data
      sourceAccount = await prisma.account.findUnique({
        where: { id: sourceAccount.id }
      });
    }
    
    // Check if account has sufficient balance
    if (parseFloat(sourceAccount.balance) < principalAmount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        currentBalance: sourceAccount.balance,
        required: principalAmount
      });
    }
    
    // Generate deposit number
    const depositNumber = `FD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Create the fixed deposit with backdated timestamps
    const fixedDeposit = await prisma.fixedDeposit.create({
      data: {
        userId: user.id,
        accountId: sourceAccount.id,
        depositNumber,
        principalAmount,
        interestRate,
        termMonths,
        maturityAmount,
        maturityDate,
        status: 'ACTIVE',
        autoRenew: false,
        createdAt,
        updatedAt: createdAt
      }
    });
    
    // Deduct from source account
    await prisma.account.update({
      where: { id: sourceAccount.id },
      data: {
        balance: { decrement: principalAmount },
        availableBalance: { decrement: principalAmount }
      }
    });
    
    // Create transaction record with backdated timestamp
    await prisma.transaction.create({
      data: {
        accountId: sourceAccount.id,
        type: 'FIXED_DEPOSIT',
        amount: principalAmount,
        description: `Fixed Deposit - ${termMonths} months at ${interestRate}%`,
        status: 'COMPLETED',
        reference: `TXN-${depositNumber}`,
        createdAt,
        updatedAt: createdAt
      }
    });
    
    return res.json({
      success: true,
      email,
      depositNumber,
      creditApplied: creditAmount || 0,
      sourceAccount: {
        type: sourceAccount.accountType,
        number: sourceAccount.accountNumber
      },
      deposit: {
        principal: principalAmount,
        interestRate,
        termMonths,
        maturityAmount,
        createdAt: createdAt.toISOString(),
        maturityDate: maturityDate.toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating single fixed deposit:', error);
    return res.status(500).json({ 
      error: 'Failed to create fixed deposit',
      details: error.message 
    });
  }
});

// POST /api/v1/fix-accounts/request-fd-withdrawal - Create withdrawal request for a fixed deposit (for testing)
router.post('/request-fd-withdrawal', async (req, res) => {
  try {
    const { email, depositNumber } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find user
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find the fixed deposit
    const whereClause = { userId: user.id, status: 'ACTIVE' };
    if (depositNumber) {
      whereClause.depositNumber = depositNumber;
    }
    
    const deposit = await prisma.fixedDeposit.findFirst({
      where: whereClause,
      include: { account: true }
    });
    
    if (!deposit) {
      return res.status(404).json({ error: 'No active fixed deposit found for this user' });
    }
    
    // Create withdrawal request
    const updatedDeposit = await prisma.fixedDeposit.update({
      where: { id: deposit.id },
      data: {
        status: 'WITHDRAWAL_PENDING',
        withdrawalStatus: 'PENDING',
        withdrawalRequestedAt: new Date(),
        withdrawalReason: 'Test withdrawal request via admin endpoint'
      }
    });
    
    // Create notification for admins
    const admins = await prisma.user.findMany({
      where: { isAdmin: true }
    });
    
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'Fixed Deposit Withdrawal Request',
          message: `${user.firstName} ${user.lastName} has requested withdrawal of fixed deposit ${deposit.depositNumber} ($${deposit.principalAmount})`,
          type: 'WITHDRAWAL_REQUEST',
          read: false
        }
      });
    }
    
    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Withdrawal Request Submitted',
        message: `Your withdrawal request for fixed deposit ${deposit.depositNumber} has been submitted. Processing takes a minimum of 3 weeks.`,
        type: 'WITHDRAWAL_REQUEST',
        read: false
      }
    });
    
    return res.json({
      success: true,
      message: 'Withdrawal request created successfully',
      data: {
        depositId: deposit.id,
        depositNumber: deposit.depositNumber,
        principalAmount: deposit.principalAmount,
        status: 'WITHDRAWAL_PENDING',
        withdrawalRequestedAt: updatedDeposit.withdrawalRequestedAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating withdrawal request:', error);
    return res.status(500).json({ 
      error: 'Failed to create withdrawal request',
      details: error.message 
    });
  }
});

// DELETE /api/v1/fix-accounts/fixed-deposit/:id - Delete a fixed deposit
router.delete('/fixed-deposit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deposit = await prisma.fixedDeposit.findUnique({
      where: { id }
    });
    
    if (!deposit) {
      return res.status(404).json({ error: 'Fixed deposit not found' });
    }
    
    await prisma.fixedDeposit.delete({
      where: { id }
    });
    
    return res.json({
      success: true,
      message: 'Fixed deposit deleted',
      deletedId: id
    });
    
  } catch (error) {
    console.error('❌ Error deleting fixed deposit:', error);
    return res.status(500).json({ 
      error: 'Failed to delete fixed deposit',
      details: error.message 
    });
  }
});

// POST /api/v1/fix-accounts/reset-test-deposits - Reset test fixed deposits
router.post('/reset-test-deposits', async (req, res) => {
  try {
    const results = [];
    
    // Find users
    const benard = await prisma.user.findUnique({
      where: { email: 'benardwilliams822@gmail.com' },
      include: { accounts: true }
    });
    
    const brian = await prisma.user.findUnique({
      where: { email: 'brianmerker3@gmail.com' },
      include: { accounts: true }
    });
    
    if (!benard || !brian) {
      return res.status(404).json({ error: 'Users not found' });
    }
    
    // Delete existing fixed deposits for these users
    const deletedBenard = await prisma.fixedDeposit.deleteMany({
      where: { userId: benard.id }
    });
    
    const deletedBrian = await prisma.fixedDeposit.deleteMany({
      where: { userId: brian.id }
    });
    
    results.push({
      action: 'Deleted existing deposits',
      benard: deletedBenard.count,
      brian: deletedBrian.count
    });
    
    // Calculate dates - 89 days ago
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - 89);
    
    // Maturity date - 12 months from creation
    const maturityDate = new Date(createdDate);
    maturityDate.setMonth(maturityDate.getMonth() + 12);
    
    const principalAmount = 1000000;
    const interestRate = 12.5;
    const maturityAmount = principalAmount + (principalAmount * interestRate / 100);
    
    // Create new deposits for Benard Williams
    const benardAccount = benard.accounts.find(acc => acc.accountType === 'CHECKING');
    if (benardAccount) {
      const benardDeposit = await prisma.fixedDeposit.create({
        data: {
          userId: benard.id,
          accountId: benardAccount.id,
          depositNumber: `FD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          principalAmount,
          interestRate,
          termMonths: 12,
          maturityAmount,
          maturityDate,
          status: 'ACTIVE',
          autoRenew: false,
          createdAt: createdDate,
          updatedAt: createdDate
        }
      });
      
      results.push({
        user: 'benardwilliams822@gmail.com',
        depositNumber: benardDeposit.depositNumber,
        principal: principalAmount,
        createdAt: createdDate.toISOString(),
        maturityDate: maturityDate.toISOString()
      });
    }
    
    // Create new deposits for Brian Merker
    const brianAccount = brian.accounts.find(acc => acc.accountType === 'CHECKING');
    if (brianAccount) {
      const brianDeposit = await prisma.fixedDeposit.create({
        data: {
          userId: brian.id,
          accountId: brianAccount.id,
          depositNumber: `FD-${Date.now() + 1}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          principalAmount,
          interestRate,
          termMonths: 12,
          maturityAmount,
          maturityDate,
          status: 'ACTIVE',
          autoRenew: false,
          createdAt: createdDate,
          updatedAt: createdDate
        }
      });
      
      results.push({
        user: 'brianmerker3@gmail.com',
        depositNumber: brianDeposit.depositNumber,
        principal: principalAmount,
        createdAt: createdDate.toISOString(),
        maturityDate: maturityDate.toISOString()
      });
    }
    
    return res.json({
      success: true,
      message: 'Test deposits reset successfully',
      results
    });
    
  } catch (error) {
    console.error('❌ Error resetting test deposits:', error);
    return res.status(500).json({ 
      error: 'Failed to reset test deposits',
      details: error.message 
    });
  }
});

export default router;
