-- Manual SQL Script to Add Bitcoin Payment Gateway and Currency
-- Use this if the frontend form keeps failing due to token issues
-- Run this in your database (Railway PostgreSQL or local)

-- ============================================
-- 1. ADD BITCOIN PAYMENT GATEWAY
-- ============================================

INSERT INTO "PaymentGateway" (
  id,
  name,
  type,
  "walletAddress",
  network,
  "qrCodeUrl",
  instructions,
  "displayOrder",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'btc_gateway_' || floor(random() * 1000000)::text,
  'Bitcoin',
  'CRYPTO',
  'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  'BTC',
  NULL, -- QR code URL - you can upload manually later
  'payment may take up to 24 hours',
  1,
  true,
  NOW(),
  NOW()
);

-- ============================================
-- 2. VERIFY THE ADDITION
-- ============================================

-- Check if Bitcoin gateway was added
SELECT * FROM "PaymentGateway" WHERE name = 'Bitcoin';

-- ============================================
-- NOTES:
-- ============================================
-- 1. Currency table doesn't exist in schema - currencies are handled differently
-- 2. QR code can be uploaded later through admin panel
-- 3. This adds Bitcoin as a payment gateway for deposits/withdrawals
-- 4. Users will be able to select Bitcoin when making deposits
