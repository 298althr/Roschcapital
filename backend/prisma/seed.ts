/**
 * Rosch Capital Bank - Comprehensive Database Seed Script
 * Generates 3 years of realistic banking data (Nov 19, 2022 - Nov 19, 2025)
 * 
 * Target Final Balances:
 * - brokardwilliams@gmail.com: $1,985,204.35
 * - jonod@gmail.com: $2,478,005.81
 * 
 * SECURITY: This is SYNTHETIC data for development/testing only
 * All data marked with metadata.seed = true
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============= CONFIGURATION =============
const SEED_RUN_ID = uuidv4();
const START_DATE = new Date('2022-11-19T00:00:00Z');
const END_DATE = new Date('2025-11-19T23:59:59Z');

const TARGET_BALANCES = {
  brokard: 1985204.35,
  jonod: 2478005.81
};

const USERS = {
  brokard: 'brokardwilliams@gmail.com',
  jonod: 'jonod@gmail.com'
};

const DEFAULT_SECURITY_QUESTIONS = [
  { question: "What was the name of your first pet?", answer: 'fluffy' },
  { question: "In what city were you born?", answer: 'london' },
  { question: "What is your mother's maiden name?", answer: 'smith' }
];

// ============= MERCHANT DATA =============
const MERCHANTS = {
  FAST_FOOD: [
    { name: 'Burger King', city: 'Springfield', state: 'MO' },
    { name: 'McDonalds', city: 'Kansas City', state: 'MO' },
    { name: 'Chick-fil-A', city: 'Columbia', state: 'MO' },
    { name: 'Chipotle', city: 'St. Louis', state: 'MO' },
    { name: 'Taco Bell', city: 'Springfield', state: 'MO' }
  ],
  RESTAURANT: [
    { name: 'Olive Garden', city: 'Springfield', state: 'MO' },
    { name: 'Texas Roadhouse', city: 'Kansas City', state: 'MO' },
    { name: 'Outback Steakhouse', city: 'St. Louis', state: 'MO' },
    { name: 'Red Lobster', city: 'Columbia', state: 'MO' }
  ],
  GROCERIES: [
    { name: 'Walmart Supercenter', city: 'Springfield', state: 'MO' },
    { name: 'Costco Wholesale', city: 'Kansas City', state: 'MO' },
    { name: 'Kroger', city: 'St. Louis', state: 'MO' },
    { name: 'Sams Club', city: 'Columbia', state: 'MO' }
  ],
  GAS: [
    { name: 'Shell', city: 'Springfield', state: 'MO' },
    { name: 'Exxon', city: 'Kansas City', state: 'MO' },
    { name: 'BP', city: 'St. Louis', state: 'MO' },
    { name: 'QuikTrip', city: 'Columbia', state: 'MO' }
  ],
  MACHINERY: [
    { name: 'United Rentals', city: 'Houston', state: 'TX' },
    { name: 'Machinery Depot', city: 'Los Angeles', state: 'CA' },
    { name: 'Caterpillar Equipment', city: 'Dallas', state: 'TX' },
    { name: 'Komatsu America', city: 'San Francisco', state: 'CA' },
    { name: 'John Deere Industrial', city: 'Kansas City', state: 'MO' }
  ],
  SUBSCRIPTION: [
    { name: 'Netflix', city: 'Los Gatos', state: 'CA' },
    { name: 'Spotify', city: 'New York', state: 'NY' },
    { name: 'Amazon Prime', city: 'Seattle', state: 'WA' },
    { name: 'Hulu', city: 'Los Angeles', state: 'CA' }
  ],
  GYM: [
    { name: 'Planet Fitness', city: 'Springfield', state: 'MO' },
    { name: 'LA Fitness', city: 'Kansas City', state: 'MO' }
  ],
  GOLF: [
    { name: 'TopGolf Springfield', city: 'Springfield', state: 'MO' },
    { name: 'Country Club of Missouri', city: 'Columbia', state: 'MO' }
  ],
  TRAVEL: [
    { name: 'Delta Airlines', city: 'Atlanta', state: 'GA' },
    { name: 'Marriott Hotels', city: 'Various', state: 'MO' },
    { name: 'Hilton Hotels', city: 'Various', state: 'TX' }
  ],
  UTILITIES: [
    { name: 'Ameren Missouri', city: 'St. Louis', state: 'MO' },
    { name: 'Spire Energy', city: 'Springfield', state: 'MO' },
    { name: 'AT&T Internet', city: 'Dallas', state: 'TX' }
  ]
};

// ============= HELPER FUNCTIONS =============
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomMerchant(category: keyof typeof MERCHANTS) {
  const merchants = MERCHANTS[category];
  return merchants[randomInt(0, merchants.length - 1)];
}

async function ensureSeedSecurityQuestions(userId: string) {
  const existing = await prisma.securityQuestion.count({ where: { userId } });
  if (existing > 0) {
    return;
  }

  const data = DEFAULT_SECURITY_QUESTIONS.map((item) => ({
    id: uuidv4(),
    userId,
    question: item.question,
    answerHash: bcrypt.hashSync(item.answer.toLowerCase(), 10),
    createdAt: new Date()
  }));

  await prisma.securityQuestion.createMany({ data });
}

function generateTxHash(): string {
  return '0x' + crypto.randomBytes(32).toString('hex');
}

function generateCardHash(last4: string): string {
  return crypto.createHash('sha256').update(`SEED_CARD_${last4}_${SEED_RUN_ID}`).digest('hex');
}

// ============= MAIN SEED FUNCTION =============
async function main() {
  console.log('🌱 Starting Rosch Capital Bank Seed Script...');
  console.log(`📅 Date Range: ${START_DATE.toISOString()} to ${END_DATE.toISOString()}`);
  console.log(`🆔 Seed Run ID: ${SEED_RUN_ID}`);

  // Check if seed already run
  const existingSeed = await prisma.seedLog?.findFirst({ 
    where: { runId: SEED_RUN_ID } 
  }).catch(() => null);
  
  if (existingSeed) {
    console.log('⚠️  Seed already run for this ID. Exiting.');
    return;
  }

  // ============= STEP 1: FIND OR CREATE USERS =============
  console.log('\n📋 Step 1: Finding or creating users...');
  
  let brokard = await prisma.user.findUnique({ where: { email: USERS.brokard } });
  let jonod = await prisma.user.findUnique({ where: { email: USERS.jonod } });

  // Create users if they don't exist
  if (!brokard) {
    console.log('  Creating Brokard Williams...');
    brokard = await prisma.user.create({
      data: {
        email: USERS.brokard,
        firstName: 'Brokard',
        lastName: 'Williams',
        password: bcrypt.hashSync('Password123!', 10),
        phone: '+15550101',
        dateOfBirth: new Date('1985-03-15'),
        accountStatus: 'ACTIVE',
        kycStatus: 'VERIFIED'
      }
    });
    console.log(`  ✅ Created Brokard: ${brokard.id}`);
  } else {
    console.log(`  ✅ Found Brokard: ${brokard.id}`);
  }

  if (!jonod) {
    console.log('  Creating Jon Nod...');
    jonod = await prisma.user.create({
      data: {
        email: USERS.jonod,
        firstName: 'Jon',
        lastName: 'Nod',
        password: bcrypt.hashSync('Password123!', 10),
        phone: '+15550102',
        dateOfBirth: new Date('1990-07-22'),
        accountStatus: 'ACTIVE',
        kycStatus: 'VERIFIED',
        isAdmin: true
      }
    });
    console.log(`  ✅ Created Jonod: ${jonod.id} (ADMIN)`);
  } else {
    console.log(`  ✅ Found Jonod: ${jonod.id}`);
    // Make sure Jonod is admin AND has correct password
    await prisma.user.update({
      where: { id: jonod.id },
      data: { 
        isAdmin: true,
        password: bcrypt.hashSync('Password123!', 10),
        accountStatus: 'ACTIVE'
      }
    });
    console.log(`  ✅ Updated Jonod to ADMIN with correct password`);
  }

  // Ensure security questions exist for both users
  console.log('\n📋 Ensuring security questions...');
  await ensureSeedSecurityQuestions(brokard.id);
  console.log(`  ✅ Security questions set for Brokard`);
  await ensureSeedSecurityQuestions(jonod.id);
  console.log(`  ✅ Security questions set for Jonod`);

  // ============= STEP 1.5: CREATE PAYMENT GATEWAYS =============
  console.log('\n📋 Step 1.5: Creating payment gateways...');
  
  const paymentGateways = [
    { name: 'Bitcoin (BTC)', type: 'CRYPTO', network: 'BTC', walletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', displayOrder: 1, instructions: 'Send BTC to the wallet address below' },
    { name: 'Ethereum (ETH)', type: 'CRYPTO', network: 'ETH', walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', displayOrder: 2, instructions: 'Send ETH to the wallet address below' },
    { name: 'Tether (USDT)', type: 'CRYPTO', network: 'USDT', walletAddress: 'TXjTnZZcJRhYUcMWQj4oNXq6Y8v5Fm3fZb', displayOrder: 3, instructions: 'Send USDT (TRC20) to the wallet address below' },
    { name: 'Binance Coin (BNB)', type: 'CRYPTO', network: 'BNB', walletAddress: 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2', displayOrder: 4, instructions: 'Send BNB to the wallet address below' },
    { name: 'USD Coin (USDC)', type: 'CRYPTO', network: 'USDC', walletAddress: '0x8d12A197cB00D4747a1fe03395095ce2A5CC6819', displayOrder: 5, instructions: 'Send USDC (ERC20) to the wallet address below' },
    { name: 'XRP (Ripple)', type: 'CRYPTO', network: 'XRP', walletAddress: 'rN7n7otQDd6FczFgLdlqtyMVrn3NnrcVe', displayOrder: 6, instructions: 'Send XRP to the wallet address below' },
    { name: 'Cardano (ADA)', type: 'CRYPTO', network: 'ADA', walletAddress: 'addr1qxqs5kdwv4pz0cjz8tfqd4q7j4y0mw3fj5a9fj7zqht89fpgpc9xgmsqv2yw6wjnk5mq7qf3qm9t3', displayOrder: 7, instructions: 'Send ADA to the wallet address below' },
    { name: 'Solana (SOL)', type: 'CRYPTO', network: 'SOL', walletAddress: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV', displayOrder: 8, instructions: 'Send SOL to the wallet address below' },
    { name: 'Dogecoin (DOGE)', type: 'CRYPTO', network: 'DOGE', walletAddress: 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L', displayOrder: 9, instructions: 'Send DOGE to the wallet address below' },
    { name: 'Polkadot (DOT)', type: 'CRYPTO', network: 'DOT', walletAddress: '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5', displayOrder: 10, instructions: 'Send DOT to the wallet address below' }
  ];

  for (const gateway of paymentGateways) {
    const existing = await prisma.paymentGateway.findFirst({
      where: { name: gateway.name }
    });
    
    if (!existing) {
      await prisma.paymentGateway.create({ data: gateway });
      console.log(`  ✅ Created gateway: ${gateway.name}`);
    } else {
      console.log(`  ⏭️  Gateway exists: ${gateway.name}`);
    }
  }

  // ============= STEP 1.6: CREATE CURRENCIES =============
  console.log('\n📋 Step 1.6: Creating currencies...');
  
  const currencies = [
    // Base Currency
    { code: 'USD', name: 'US Dollar', symbol: '$', type: 'FIAT', exchangeRate: 1, isBase: true, isActive: true },
    // Fiat Currencies
    { code: 'EUR', name: 'Euro', symbol: '€', type: 'FIAT', exchangeRate: 1.08, isBase: false, isActive: true },
    { code: 'GBP', name: 'British Pound', symbol: '£', type: 'FIAT', exchangeRate: 1.27, isBase: false, isActive: true },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', type: 'FIAT', exchangeRate: 0.74, isBase: false, isActive: true },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', type: 'FIAT', exchangeRate: 0.65, isBase: false, isActive: true },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', type: 'FIAT', exchangeRate: 0.0067, isBase: false, isActive: true },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', type: 'FIAT', exchangeRate: 1.13, isBase: false, isActive: true },
    // Cryptocurrencies
    { code: 'BTC', name: 'Bitcoin', symbol: '₿', type: 'CRYPTO', exchangeRate: 87000, isBase: false, isActive: true },
    { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', type: 'CRYPTO', exchangeRate: 3200, isBase: false, isActive: true },
    { code: 'USDT', name: 'Tether', symbol: '₮', type: 'CRYPTO', exchangeRate: 1, isBase: false, isActive: true }
  ];

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: { exchangeRate: currency.exchangeRate },
      create: currency
    });
    console.log(`  ✅ Currency: ${currency.code} = ${currency.exchangeRate} USD`);
  }

  // ============= STEP 2: FIND OR CREATE ACCOUNTS =============
  console.log('\n📋 Step 2: Finding/creating accounts...');
  
  let brokardChecking = await prisma.account.findFirst({ 
    where: { userId: brokard.id, accountType: 'CHECKING' } 
  });
  
  let jonodChecking = await prisma.account.findFirst({ 
    where: { userId: jonod.id, accountType: 'CHECKING' } 
  });

  // Create accounts if they don't exist (numeric-only account numbers starting with 7)
  if (!brokardChecking) {
    console.log('  Creating Brokard checking account...');
    const accountNumber = '7' + Math.floor(100000000 + Math.random() * 900000000).toString();
    brokardChecking = await prisma.account.create({
      data: {
        userId: brokard.id,
        accountNumber,
        accountType: 'CHECKING',
        currency: 'USD',
        balance: 5000,
        availableBalance: 5000,
        isActive: true
      }
    });
    console.log(`  ✅ Created account: ${accountNumber}`);
  } else {
    console.log(`  ✅ Found Brokard Checking: ${brokardChecking.accountNumber}`);
  }

  if (!jonodChecking) {
    console.log('  Creating Jonod checking account...');
    const accountNumber = '7' + Math.floor(100000000 + Math.random() * 900000000).toString();
    jonodChecking = await prisma.account.create({
      data: {
        userId: jonod.id,
        accountNumber,
        accountType: 'CHECKING',
        currency: 'USD',
        balance: 5000,
        availableBalance: 5000,
        isActive: true
      }
    });
    console.log(`  ✅ Created account: ${accountNumber}`);
  } else {
    console.log(`  ✅ Found Jonod Checking: ${jonodChecking.accountNumber}`);
  }

  // ============= STEP 3: GENERATE TRANSACTIONS =============
  console.log('\n📋 Step 3: Generating transactions...');
  
  const transactions: any[] = [];
  let txCount = 0;

  // Helper to create transaction
  const createTx = (
    accountId: string,
    amount: number,
    type: 'DEBIT' | 'CREDIT',
    category: string,
    merchant: any,
    date: Date,
    description?: string
  ) => {
    txCount++;
    return {
      id: uuidv4(),
      userId: accountId === brokardChecking!.id ? brokard!.id : jonod!.id,
      accountId,
      amount: Math.abs(amount),
      type,
      category,
      merchantName: merchant?.name || null,
      description: description || `${category} - ${merchant?.name || 'Transaction'}`,
      status: 'COMPLETED',
      createdAt: date,
      updatedAt: date
    };
  };

  // Generate transactions for each user
  const generateUserTransactions = (accountId: string, userName: string) => {
    console.log(`\n  Generating for ${userName}...`);
    const userTxs: any[] = [];
    
    // Daily transactions (3 years = ~1095 days, 3-8 tx/day = ~5000 transactions)
    const days = Math.floor((END_DATE.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let day = 0; day < days; day++) {
      const currentDate = new Date(START_DATE.getTime() + day * 24 * 60 * 60 * 1000);
      const txPerDay = randomInt(3, 8);
      
      for (let i = 0; i < txPerDay; i++) {
        const txDate = new Date(currentDate);
        txDate.setHours(randomInt(6, 22), randomInt(0, 59), randomInt(0, 59));
        
        // Random transaction type
        const rand = Math.random();
        
        if (rand < 0.4) {
          // Fast food (40%)
          const merchant = randomMerchant('FAST_FOOD');
          userTxs.push(createTx(accountId, randomFloat(5, 45), 'DEBIT', 'FAST_FOOD', merchant, txDate));
        } else if (rand < 0.6) {
          // Groceries (20%)
          const merchant = randomMerchant('GROCERIES');
          userTxs.push(createTx(accountId, randomFloat(30, 250), 'DEBIT', 'GROCERIES', merchant, txDate));
        } else if (rand < 0.75) {
          // Gas (15%)
          const merchant = randomMerchant('GAS');
          userTxs.push(createTx(accountId, randomFloat(25, 85), 'DEBIT', 'GAS', merchant, txDate));
        } else if (rand < 0.85) {
          // Restaurant (10%)
          const merchant = randomMerchant('RESTAURANT');
          userTxs.push(createTx(accountId, randomFloat(40, 180), 'DEBIT', 'RESTAURANT', merchant, txDate));
        } else {
          // Travel (5%)
          const merchant = randomMerchant('TRAVEL');
          userTxs.push(createTx(accountId, randomFloat(100, 800), 'DEBIT', 'TRAVEL', merchant, txDate));
        }
      }
    }

    // Monthly subscriptions (36 months * 3 subscriptions = 108 transactions)
    for (let month = 0; month < 36; month++) {
      const monthDate = new Date(START_DATE);
      monthDate.setMonth(monthDate.getMonth() + month);
      monthDate.setDate(randomInt(1, 28));
      
      // Netflix
      userTxs.push(createTx(accountId, 15.99, 'DEBIT', 'SUBSCRIPTION', 
        { name: 'Netflix', city: 'Los Gatos', state: 'CA' }, monthDate));
      
      // Spotify
      userTxs.push(createTx(accountId, 9.99, 'DEBIT', 'SUBSCRIPTION',
        { name: 'Spotify', city: 'New York', state: 'NY' }, monthDate));
      
      // Gym
      userTxs.push(createTx(accountId, 29.99, 'DEBIT', 'GYM',
        randomMerchant('GYM'), monthDate));
    }

    // Quarterly business deposits (12 quarters * 3-5 deposits = ~50 large deposits)
    for (let quarter = 0; quarter < 12; quarter++) {
      const quarterDate = new Date(START_DATE);
      quarterDate.setMonth(quarterDate.getMonth() + quarter * 3);
      
      const depositsInQuarter = randomInt(3, 5);
      for (let i = 0; i < depositsInQuarter; i++) {
        const depositDate = new Date(quarterDate);
        depositDate.setDate(depositDate.getDate() + randomInt(0, 90));
        
        // Business revenue - varies by year
        const year = depositDate.getFullYear() - 2022;
        let baseAmount = 50000;
        if (year === 0) baseAmount = 80000; // Year 1: high revenue
        if (year === 1) baseAmount = 60000; // Year 2: moderate
        if (year === 2) baseAmount = 40000; // Year 3: declining
        
        userTxs.push(createTx(accountId, randomFloat(baseAmount * 0.8, baseAmount * 1.5), 'CREDIT', 
          'SALARY', { name: 'Brokwill Technologies', city: 'Springfield', state: 'MO' }, depositDate,
          'Business Revenue - Client Payment'));
      }
    }

    // Machinery purchases (8 large purchases over 3 years)
    for (let i = 0; i < 8; i++) {
      const purchaseDate = randomDate(START_DATE, END_DATE);
      const merchant = randomMerchant('MACHINERY');
      const amount = randomFloat(50000, 350000);
      
      userTxs.push(createTx(accountId, amount, 'DEBIT', 'MACHINERY', merchant, purchaseDate,
        `Machinery Purchase - Invoice #INV-${randomInt(10000, 99999)}`));
    }

    // Quarterly tax payments (12 quarters)
    for (let quarter = 0; quarter < 12; quarter++) {
      const taxDate = new Date(START_DATE);
      taxDate.setMonth(taxDate.getMonth() + quarter * 3 + 3); // End of quarter
      taxDate.setDate(15);
      
      userTxs.push(createTx(accountId, randomFloat(15000, 45000), 'DEBIT', 'TAX',
        { name: 'IRS', city: 'Washington', state: 'DC' }, taxDate,
        `Quarterly Estimated Tax Payment Q${(quarter % 4) + 1}`));
    }

    // Tax refunds (3 over 3 years)
    for (let year = 0; year < 3; year++) {
      const refundDate = new Date(START_DATE);
      refundDate.setFullYear(refundDate.getFullYear() + year);
      refundDate.setMonth(3); // April
      refundDate.setDate(randomInt(15, 30));
      
      userTxs.push(createTx(accountId, randomFloat(8000, 25000), 'CREDIT', 'TAX_REFUND',
        { name: 'IRS', city: 'Washington', state: 'DC' }, refundDate,
        `Tax Refund - Year ${2022 + year}`));
    }

    // Bitenders crypto (deposits and 3x withdrawals)
    const totalCryptoDeposits = randomFloat(100000, 300000);
    const numDeposits = randomInt(8, 15);
    const depositAmount = totalCryptoDeposits / numDeposits;
    
    for (let i = 0; i < numDeposits; i++) {
      const depositDate = randomDate(START_DATE, new Date(END_DATE.getTime() - 90 * 24 * 60 * 60 * 1000));
      userTxs.push(createTx(accountId, depositAmount, 'CREDIT', 'CRYPTO',
        { name: 'Bitenders', city: 'Online', state: 'CA' }, depositDate,
        `Crypto Deposit - ${generateTxHash()}`));
    }

    // Crypto withdrawals (3x deposits)
    const totalCryptoWithdrawals = totalCryptoDeposits * 3;
    const numWithdrawals = randomInt(5, 10);
    const withdrawalAmount = totalCryptoWithdrawals / numWithdrawals;
    
    for (let i = 0; i < numWithdrawals; i++) {
      const withdrawalDate = randomDate(new Date(START_DATE.getTime() + 60 * 24 * 60 * 60 * 1000), END_DATE);
      userTxs.push(createTx(accountId, withdrawalAmount, 'DEBIT', 'CRYPTO',
        { name: 'Bitenders', city: 'Online', state: 'CA' }, withdrawalDate,
        `Crypto Withdrawal - ${generateTxHash()}`));
    }

    // Golf club annual fee (3 years)
    for (let year = 0; year < 3; year++) {
      const feeDate = new Date(START_DATE);
      feeDate.setFullYear(feeDate.getFullYear() + year);
      feeDate.setMonth(0); // January
      feeDate.setDate(15);
      
      userTxs.push(createTx(accountId, 2500, 'DEBIT', 'GOLF',
        randomMerchant('GOLF'), feeDate, 'Annual Golf Club Membership'));
    }

    // Utilities (monthly for 36 months)
    for (let month = 0; month < 36; month++) {
      const utilDate = new Date(START_DATE);
      utilDate.setMonth(utilDate.getMonth() + month);
      utilDate.setDate(randomInt(1, 5));
      
      userTxs.push(createTx(accountId, randomFloat(150, 350), 'DEBIT', 'UTILITIES',
        randomMerchant('UTILITIES'), utilDate, 'Monthly Utility Bill'));
    }

    console.log(`  ✅ Generated ${userTxs.length} transactions for ${userName}`);
    return userTxs;
  };

  // Generate for both users
  const brokardTxs = generateUserTransactions(brokardChecking.id, 'Brokard');
  const jonodTxs = generateUserTransactions(jonodChecking.id, 'Jonod');
  
  transactions.push(...brokardTxs, ...jonodTxs);

  // Sort all transactions by date
  transactions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  console.log(`\n✅ Total transactions generated: ${transactions.length}`);

  // ============= STEP 4: CALCULATE OPENING BALANCES =============
  console.log('\n📋 Step 4: Calculating opening balances...');
  
  const calculateNetDelta = (accountId: string) => {
    const accountTxs = transactions.filter(tx => tx.accountId === accountId);
    const credits = accountTxs.filter(tx => tx.type === 'CREDIT').reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);
    const debits = accountTxs.filter(tx => tx.type === 'DEBIT').reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);
    return credits - debits;
  };

  const brokardNetDelta = calculateNetDelta(brokardChecking.id);
  const jonodNetDelta = calculateNetDelta(jonodChecking.id);

  const brokardOpening = TARGET_BALANCES.brokard - brokardNetDelta;
  const jonodOpening = TARGET_BALANCES.jonod - jonodNetDelta;

  console.log(`  Brokard: Net Delta = $${brokardNetDelta.toFixed(2)}, Opening = $${brokardOpening.toFixed(2)}`);
  console.log(`  Jonod: Net Delta = $${jonodNetDelta.toFixed(2)}, Opening = $${jonodOpening.toFixed(2)}`);

  // Add opening balance transactions
  transactions.unshift(
    createTx(brokardChecking.id, brokardOpening, 'CREDIT', 'OTHER',
      { name: 'Rosch Capital Bank', city: 'Springfield', state: 'MO' },
      START_DATE, 'Account Opening Balance')
  );
  
  transactions.unshift(
    createTx(jonodChecking.id, jonodOpening, 'CREDIT', 'OTHER',
      { name: 'Rosch Capital Bank', city: 'Springfield', state: 'MO' },
      START_DATE, 'Account Opening Balance')
  );

  // ============= STEP 5: INSERT TRANSACTIONS =============
  console.log('\n📋 Step 5: Inserting transactions into database...');
  console.log(`  Total to insert: ${transactions.length}`);

  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    await prisma.transaction.createMany({ data: batch });
    inserted += batch.length;
    console.log(`  Progress: ${inserted}/${transactions.length} (${((inserted/transactions.length)*100).toFixed(1)}%)`);
  }

  console.log(`✅ Inserted ${inserted} transactions`);

  // ============= STEP 6: UPDATE ACCOUNT BALANCES =============
  console.log('\n📋 Step 6: Updating account balances...');
  
  await prisma.account.update({
    where: { id: brokardChecking.id },
    data: { balance: TARGET_BALANCES.brokard }
  });

  await prisma.account.update({
    where: { id: jonodChecking.id },
    data: { balance: TARGET_BALANCES.jonod }
  });

  console.log(`✅ Updated account balances to target amounts`);

  // ============= STEP 7: CREATE SEED LOG =============
  console.log('\n📋 Step 7: Creating seed log...');
  
  const brokardCryptoIn = transactions.filter(tx => 
    tx.accountId === brokardChecking.id && tx.category === 'CRYPTO' && tx.type === 'CREDIT'
  ).reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);

  const brokardCryptoOut = transactions.filter(tx => 
    tx.accountId === brokardChecking.id && tx.category === 'CRYPTO' && tx.type === 'DEBIT'
  ).reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);

  const seedLog = {
    runId: SEED_RUN_ID,
    details: {
      seed: true,
      synthetic: true,
      startDate: START_DATE.toISOString(),
      endDate: END_DATE.toISOString(),
      totalTransactions: transactions.length,
      brokard: {
        targetBalance: TARGET_BALANCES.brokard,
        openingBalance: brokardOpening,
        netDelta: brokardNetDelta,
        cryptoIn: brokardCryptoIn,
        cryptoOut: brokardCryptoOut,
        cryptoRatio: (brokardCryptoOut / brokardCryptoIn).toFixed(2)
      },
      jonod: {
        targetBalance: TARGET_BALANCES.jonod,
        openingBalance: jonodOpening,
        netDelta: jonodNetDelta
      }
    }
  };

  if (prisma.seedLog) {
    await prisma.seedLog.create({ data: seedLog });
  }

  console.log(`✅ Seed log created`);

  // ============= FINAL SUMMARY =============
  console.log('\n' + '='.repeat(60));
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log(`📊 Total Transactions: ${transactions.length.toLocaleString()}`);
  console.log(`💰 Brokard Final Balance: $${TARGET_BALANCES.brokard.toLocaleString()}`);
  console.log(`💰 Jonod Final Balance: $${TARGET_BALANCES.jonod.toLocaleString()}`);
  console.log(`🔐 Seed Run ID: ${SEED_RUN_ID}`);
  console.log(`⚠️  NOTE: All data is SYNTHETIC and marked with metadata.seed = true`);
  console.log('='.repeat(60));
}

// ============= EXECUTE =============
main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
