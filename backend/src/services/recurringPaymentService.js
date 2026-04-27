import prisma from '../config/prisma.js';
import crypto from 'crypto';

/**
 * Recurring Payment Execution Service
 * Handles the background processing of scheduled transfers and bills
 */

const calculateNextDate = (frequency, currentNextDate) => {
  const date = new Date(currentNextDate);
  switch (frequency) {
    case 'DAILY': date.setDate(date.getDate() + 1); break;
    case 'WEEKLY': date.setDate(date.getDate() + 7); break;
    case 'BIWEEKLY': date.setDate(date.getDate() + 14); break;
    case 'MONTHLY': date.setMonth(date.getMonth() + 1); break;
    case 'QUARTERLY': date.setMonth(date.getMonth() + 3); break;
    case 'YEARLY': date.setFullYear(date.getFullYear() + 1); break;
    default: date.setMonth(date.getMonth() + 1);
  }
  return date;
};

let lastExecutionTime = 0;
const EXECUTION_COOLDOWN = 60 * 60 * 1000; // Only process once per hour to save resources

export const triggerRecurringPayments = () => {
  const now = Date.now();
  if (now - lastExecutionTime > EXECUTION_COOLDOWN) {
    lastExecutionTime = now;
    // Process in background, don't await to keep requests fast
    processDueRecurringPayments().catch(err => {
      console.error('Background recurring payment processing failed:', err);
    });
    return true;
  }
  return false;
};

export const processDueRecurringPayments = async () => {
  console.log('⏱️ Checking for due recurring payments...');
  const now = new Date();

  try {
    const duePayments = await prisma.recurringPayment.findMany({
      where: {
        status: 'ACTIVE',
        nextExecutionDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      },
      include: {
        fromAccount: true,
        toAccount: true
      }
    });

    console.log(`📌 Found ${duePayments.length} payments due for processing.`);

    for (const payment of duePayments) {
      await processSinglePayment(payment);
    }
  } catch (error) {
    console.error('❌ Error in recurring payment process:', error);
  }
};

const processSinglePayment = async (payment) => {
  return prisma.$transaction(async (tx) => {
    try {
      const { fromAccount, amount, userId, id, frequency, nextExecutionDate, executionsCount = 0, maxExecutions } = payment;

      // 1. Check Balance
      if (Number(fromAccount.balance) < amount) {
        console.warn(`⚠️ Insufficient funds for recurring payment ${id}. Skipping.`);
        // Optional: Update status to 'FAILED_FUNDS' or send notification
        return;
      }

      const reference = `REC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      // 2. Debit Account
      await tx.account.update({
        where: { id: fromAccount.id },
        data: {
          balance: { decrement: amount },
          availableBalance: { decrement: amount }
        }
      });

      // 3. Create Transaction
      await tx.transaction.create({
        data: {
          accountId: fromAccount.id,
          userId: userId,
          amount: -amount,
          type: 'DEBIT',
          category: 'RECURRING',
          description: `Recurring: ${payment.description || payment.recipientName}`,
          status: 'COMPLETED',
          reference
        }
      });

      // 4. If internal, credit the recipient
      if (payment.paymentType === 'INTERNAL' && payment.toAccountId) {
        await tx.account.update({
          where: { id: payment.toAccountId },
          data: {
            balance: { increment: amount },
            availableBalance: { increment: amount }
          }
        });
        
        await tx.transaction.create({
          data: {
            accountId: payment.toAccountId,
            userId: payment.toAccount.userId,
            amount: amount,
            type: 'CREDIT',
            category: 'RECURRING',
            description: `Recurring Deposit from ${payment.fromAccount.accountNumber}`,
            status: 'COMPLETED',
            reference
          }
        });
      }

      // 5. Update Recurring Payment Record
      const newNextDate = calculateNextDate(frequency, nextExecutionDate);
      const newCount = (executionsCount || 0) + 1;
      
      let newStatus = 'ACTIVE';
      if (maxExecutions && newCount >= maxExecutions) newStatus = 'COMPLETED';
      if (payment.endDate && newNextDate > payment.endDate) newStatus = 'COMPLETED';

      await tx.recurringPayment.update({
        where: { id },
        data: {
          nextExecutionDate: newNextDate,
          lastExecutionDate: new Date(),
          executionsCount: newCount,
          status: newStatus
        }
      });

      // 6. Log Execution
      await tx.recurringPaymentExecution.create({
        data: {
          recurringPaymentId: id,
          status: 'SUCCESS',
          amount,
          reference,
          executionDate: new Date()
        }
      });

      console.log(`✅ Processed recurring payment ${id} for user ${userId}`);

    } catch (err) {
      console.error(`❌ Failed to process recurring payment ${payment.id}:`, err);
      // Log failure
      await tx.recurringPaymentExecution.create({
        data: {
          recurringPaymentId: payment.id,
          status: 'FAILED',
          errorMessage: err.message,
          executionDate: new Date()
        }
      });
    }
  });
};

export default {
  processDueRecurringPayments,
  triggerRecurringPayments
};
