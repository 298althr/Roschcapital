import prisma from './prisma.js';

/**
 * Universal utility to sync an account's balances (balance, availableBalance, pendingBalance)
 * based on all completed and pending transactions.
 * This should be called whenever a transaction status changes.
 */
export const syncAccountBalance = async (accountId) => {
  const transactions = await prisma.transaction.findMany({
    where: { accountId }
  });

  let available = 0;
  let pending = 0;

  transactions.forEach(tx => {
    // Normalizing amount - some logic stores negative for debits, 
    // but the status/type tells the truth.
    // If type is DEBIT/WITHDRAWAL/PAYMENT, amount should be subtracted if positive, or added if negative.
    // To simplify: if 'type' is CREDIT/DEPOSIT, add it. If DEBIT/etc, subtract it.
    
    // BUT! transferService uses negative amounts for DEBIT.
    // So we use the rule: 
    // If amount is negative, it's always an outflow (debit).
    // If amount is positive:
    //   if type is CREDIT/DEPOSIT -> inflow
    //   if type is DEBIT/WITHDRAWAL -> outflow
    
    let amount = Number(tx.amount);
    let flow = 0;
    
    if (amount < 0) {
      flow = amount; // Negative amount is already an outflow
    } else {
      const type = tx.type?.toUpperCase();
      if (['CREDIT', 'DEPOSIT', 'INCOME'].includes(type)) {
        flow = amount;
      } else {
        flow = -amount;
      }
    }

    if (tx.status === 'COMPLETED') {
      available += flow;
    } else if (tx.status === 'PENDING') {
      pending += flow;
    }
  });

  const totalBalance = available + pending;

  const updated = await prisma.account.update({
    where: { id: accountId },
    data: {
      availableBalance: available,
      pendingBalance: Math.abs(pending), // Store pending as positive magnitude traditionally in this schema
      balance: totalBalance
    }
  });

  console.log(`Synced account ${accountId}: Balance=${totalBalance}, Available=${available}, Pending=${pending}`);
  return updated;
};
