import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigration() {
  console.log('Checking if recurring_payments table exists...');
  
  try {
    // Check if table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recurring_payments'
      );
    `;
    
    if (tableExists[0].exists) {
      console.log('recurring_payments table already exists, skipping migration');
      return;
    }
    
    console.log('Creating recurring_payments table...');
    
    // Create recurring_payments table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "recurring_payments" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "fromAccountId" TEXT NOT NULL,
        "paymentType" TEXT NOT NULL,
        "recipientName" TEXT NOT NULL,
        "recipientBank" TEXT,
        "recipientAccount" TEXT,
        "recipientRouting" TEXT,
        "toAccountId" TEXT,
        "amount" DECIMAL(15,2) NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'USD',
        "description" TEXT,
        "reference" TEXT NOT NULL,
        "frequency" TEXT NOT NULL,
        "startDate" TIMESTAMP(3) NOT NULL,
        "endDate" TIMESTAMP(3),
        "nextExecutionDate" TIMESTAMP(3) NOT NULL,
        "lastExecutionDate" TIMESTAMP(3),
        "dayOfMonth" INTEGER,
        "dayOfWeek" INTEGER,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "executionCount" INTEGER NOT NULL DEFAULT 0,
        "maxExecutions" INTEGER,
        "failedCount" INTEGER NOT NULL DEFAULT 0,
        "lastError" TEXT,
        "createdBy" TEXT,
        "pausedBy" TEXT,
        "pausedAt" TIMESTAMP(3),
        "cancelledBy" TEXT,
        "cancelledAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "recurring_payments_pkey" PRIMARY KEY ("id")
      )
    `;
    
    console.log('Creating recurring_payment_executions table...');
    
    // Create recurring_payment_executions table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "recurring_payment_executions" (
        "id" TEXT NOT NULL,
        "recurringPaymentId" TEXT NOT NULL,
        "executionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "amount" DECIMAL(15,2) NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "transactionId" TEXT,
        "errorMessage" TEXT,
        "retryCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "recurring_payment_executions_pkey" PRIMARY KEY ("id")
      )
    `;
    
    console.log('Creating indexes...');
    
    // Create indexes
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "recurring_payments_reference_key" ON "recurring_payments"("reference")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "recurring_payments_userId_idx" ON "recurring_payments"("userId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "recurring_payments_fromAccountId_idx" ON "recurring_payments"("fromAccountId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "recurring_payments_status_idx" ON "recurring_payments"("status")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "recurring_payments_nextExecutionDate_idx" ON "recurring_payments"("nextExecutionDate")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "recurring_payment_executions_recurringPaymentId_idx" ON "recurring_payment_executions"("recurringPaymentId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "recurring_payment_executions_status_idx" ON "recurring_payment_executions"("status")`;
    
    console.log('Adding foreign keys...');
    
    // Add foreign keys (with IF NOT EXISTS workaround)
    try {
      await prisma.$executeRaw`ALTER TABLE "recurring_payments" ADD CONSTRAINT "recurring_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
    } catch (e) { console.log('userId FK already exists or error:', e.message); }
    
    try {
      await prisma.$executeRaw`ALTER TABLE "recurring_payments" ADD CONSTRAINT "recurring_payments_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
    } catch (e) { console.log('fromAccountId FK already exists or error:', e.message); }
    
    try {
      await prisma.$executeRaw`ALTER TABLE "recurring_payments" ADD CONSTRAINT "recurring_payments_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE`;
    } catch (e) { console.log('toAccountId FK already exists or error:', e.message); }
    
    try {
      await prisma.$executeRaw`ALTER TABLE "recurring_payment_executions" ADD CONSTRAINT "recurring_payment_executions_recurringPaymentId_fkey" FOREIGN KEY ("recurringPaymentId") REFERENCES "recurring_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
    } catch (e) { console.log('recurringPaymentId FK already exists or error:', e.message); }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration()
  .then(() => {
    console.log('Recurring payments migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
