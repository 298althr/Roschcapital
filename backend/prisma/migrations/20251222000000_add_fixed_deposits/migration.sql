-- CreateTable
CREATE TABLE "fixed_deposits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "depositNumber" TEXT NOT NULL,
    "principalAmount" DECIMAL(15,2) NOT NULL,
    "interestRate" DECIMAL(5,2) NOT NULL DEFAULT 12.00,
    "termMonths" INTEGER NOT NULL,
    "maturityAmount" DECIMAL(15,2) NOT NULL,
    "maturityDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "withdrawnAmount" DECIMAL(15,2),
    "withdrawnAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fixed_deposits_depositNumber_key" ON "fixed_deposits"("depositNumber");

-- CreateIndex
CREATE INDEX "fixed_deposits_userId_idx" ON "fixed_deposits"("userId");

-- CreateIndex
CREATE INDEX "fixed_deposits_accountId_idx" ON "fixed_deposits"("accountId");

-- CreateIndex
CREATE INDEX "fixed_deposits_status_idx" ON "fixed_deposits"("status");

-- AddForeignKey
ALTER TABLE "fixed_deposits" ADD CONSTRAINT "fixed_deposits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_deposits" ADD CONSTRAINT "fixed_deposits_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_deposits" ADD CONSTRAINT "fixed_deposits_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
