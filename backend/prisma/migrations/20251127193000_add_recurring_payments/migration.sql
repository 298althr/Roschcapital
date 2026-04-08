-- CreateTable
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
);

-- CreateTable
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
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "recurring_payments_reference_key" ON "recurring_payments"("reference");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "recurring_payments_userId_idx" ON "recurring_payments"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "recurring_payments_fromAccountId_idx" ON "recurring_payments"("fromAccountId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "recurring_payments_status_idx" ON "recurring_payments"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "recurring_payments_nextExecutionDate_idx" ON "recurring_payments"("nextExecutionDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "recurring_payment_executions_recurringPaymentId_idx" ON "recurring_payment_executions"("recurringPaymentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "recurring_payment_executions_status_idx" ON "recurring_payment_executions"("status");

-- AddForeignKey
ALTER TABLE "recurring_payments" ADD CONSTRAINT "recurring_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_payments" ADD CONSTRAINT "recurring_payments_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_payments" ADD CONSTRAINT "recurring_payments_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_payment_executions" ADD CONSTRAINT "recurring_payment_executions_recurringPaymentId_fkey" FOREIGN KEY ("recurringPaymentId") REFERENCES "recurring_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
