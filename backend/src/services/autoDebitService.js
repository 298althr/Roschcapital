import prisma from '../config/prisma.js';

/**
 * Auto-Debit Service
 * Automatically covers negative balances from other accounts
 * Priority: Savings first, then Checking (excludes Crypto Wallet)
 */

/**
 * Check and auto-cover negative balances for a user
 * @param {string} userId - User ID to check
 * @returns {Object} Result of auto-debit operation
 */
export const processAutoDebit = async (userId) => {
  try {
    // Get all user accounts
    const accounts = await prisma.account.findMany({
      where: { userId, isActive: true },
      orderBy: { accountType: 'asc' }
    });

    // Find accounts with negative balance (excluding crypto)
    const negativeAccounts = accounts.filter(
      a => parseFloat(a.balance) < 0 && a.accountType !== 'CRYPTO_WALLET'
    );

    if (negativeAccounts.length === 0) {
      return { success: true, message: 'No negative balances found', transfers: [] };
    }

    const transfers = [];

    for (const negativeAccount of negativeAccounts) {
      const deficit = Math.abs(parseFloat(negativeAccount.balance));
      
      // Find source accounts with positive balance (priority: SAVINGS, CHECKING)
      // Exclude CRYPTO_WALLET from auto-debit sources
      const sourceAccounts = accounts
        .filter(a => 
          a.id !== negativeAccount.id && 
          parseFloat(a.balance) > 0 &&
          a.accountType !== 'CRYPTO_WALLET'
        )
        .sort((a, b) => {
          // Priority order: SAVINGS first, then CHECKING
          const priority = { 'SAVINGS': 1, 'CHECKING': 2, 'BUSINESS': 3 };
          return (priority[a.accountType] || 99) - (priority[b.accountType] || 99);
        });

      let remainingDeficit = deficit;

      for (const sourceAccount of sourceAccounts) {
        if (remainingDeficit <= 0) break;

        const sourceBalance = parseFloat(sourceAccount.balance);
        const transferAmount = Math.min(remainingDeficit, sourceBalance);

        if (transferAmount > 0) {
          // Create transfer transactions
          const reference = `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

          // Debit from source account
          await prisma.transaction.create({
            data: {
              accountId: sourceAccount.id,
              amount: -transferAmount,
              type: 'TRANSFER',
              status: 'COMPLETED',
              description: `Auto-debit: Cover ${negativeAccount.accountType} negative balance`,
              reference
            }
          });

          // Credit to negative account
          await prisma.transaction.create({
            data: {
              accountId: negativeAccount.id,
              amount: transferAmount,
              type: 'TRANSFER',
              status: 'COMPLETED',
              description: `Auto-debit: Received from ${sourceAccount.accountType}`,
              reference
            }
          });

          // Update balances
          await prisma.account.update({
            where: { id: sourceAccount.id },
            data: { balance: { decrement: transferAmount } }
          });

          await prisma.account.update({
            where: { id: negativeAccount.id },
            data: { balance: { increment: transferAmount } }
          });

          // Create notification
          await prisma.notification.create({
            data: {
              userId,
              type: 'transaction',
              title: 'Auto-Debit Transfer',
              message: `$${transferAmount.toFixed(2)} was automatically transferred from your ${sourceAccount.accountType} to cover your ${negativeAccount.accountType} negative balance.`,
              metadata: {
                sourceAccountId: sourceAccount.id,
                targetAccountId: negativeAccount.id,
                amount: transferAmount,
                reference
              }
            }
          });

          transfers.push({
            from: sourceAccount.accountType,
            to: negativeAccount.accountType,
            amount: transferAmount,
            reference
          });

          remainingDeficit -= transferAmount;
        }
      }
    }

    return {
      success: true,
      message: `Processed ${transfers.length} auto-debit transfer(s)`,
      transfers
    };
  } catch (error) {
    console.error('Auto-debit processing error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get auto-debit settings for a user
 */
export const getAutoDebitSettings = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { autoDebitEnabled: true }
    });
    
    return {
      enabled: user?.autoDebitEnabled ?? true, // Default enabled
      excludedAccountTypes: ['CRYPTO_WALLET'],
      priority: ['SAVINGS', 'CHECKING', 'BUSINESS']
    };
  } catch (error) {
    console.error('Get auto-debit settings error:', error);
    return { enabled: true, excludedAccountTypes: ['CRYPTO_WALLET'] };
  }
};

/**
 * Update auto-debit settings for a user
 */
export const updateAutoDebitSettings = async (userId, enabled) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { autoDebitEnabled: enabled }
    });
    
    return { success: true, enabled };
  } catch (error) {
    console.error('Update auto-debit settings error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  processAutoDebit,
  getAutoDebitSettings,
  updateAutoDebitSettings
};
