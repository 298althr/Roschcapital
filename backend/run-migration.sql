-- Add all missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "profilePhoto" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "accountStatus" TEXT NOT NULL DEFAULT 'LIMITED';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "kycStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "totalSentAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "loginPreference" TEXT NOT NULL DEFAULT 'question';

-- Set admin user
UPDATE users SET "isAdmin" = true WHERE email = 'gonnyzalowski@gmail.com';

-- Create security_questions table
CREATE TABLE IF NOT EXISTS "security_questions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answerHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "security_questions_pkey" PRIMARY KEY ("id")
);

-- Create backup_codes table
CREATE TABLE IF NOT EXISTS "backup_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "usedFor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "backup_codes_pkey" PRIMARY KEY ("id")
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Create kyc_documents table
CREATE TABLE IF NOT EXISTS "kyc_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "nationality" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "sourceOfFunds" TEXT NOT NULL,
    "idFrontPath" TEXT NOT NULL,
    "idBackPath" TEXT,
    "selfiePath" TEXT NOT NULL,
    "proofAddressPath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "security_questions_userId_idx" ON "security_questions"("userId");
CREATE INDEX IF NOT EXISTS "backup_codes_userId_idx" ON "backup_codes"("userId");
CREATE INDEX IF NOT EXISTS "backup_codes_used_idx" ON "backup_codes"("used");
CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications"("read");
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "kyc_documents_userId_key" ON "kyc_documents"("userId");
CREATE INDEX IF NOT EXISTS "kyc_documents_status_idx" ON "kyc_documents"("status");

-- Add foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_questions_userId_fkey') THEN
        ALTER TABLE "security_questions" ADD CONSTRAINT "security_questions_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'backup_codes_userId_fkey') THEN
        ALTER TABLE "backup_codes" ADD CONSTRAINT "backup_codes_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_userId_fkey') THEN
        ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_userId_fkey') THEN
        ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kyc_documents_userId_fkey') THEN
        ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
