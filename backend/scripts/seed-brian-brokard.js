import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// ===== Helpers =====
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDateBetween(start, end) {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return new Date(startMs + Math.random() * (endMs - startMs));
}

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date, months) {
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

function monthIterator(start, end) {
  const dates = [];
  let current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const final = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  while (current <= final) {
    dates.push(new Date(current.getTime()));
    current.setMonth(current.getUTCMonth() + 1);
  }
  return dates;
}

function yearIterator(start, end) {
  const years = [];
  for (let y = start.getUTCFullYear(); y <= end.getUTCFullYear(); y++) {
    years.push(y);
  }
  return years;
}

function generateAccountNumber(prefix = '7') {
  // 12-digit number starting with prefix
  const body = Math.floor(10 ** 10 + Math.random() * 9 * 10 ** 10).toString();
  return prefix + body.slice(1); // ensure total 12 digits
}

function generateCryptoAddress() {
  // Simple pseudo crypto address
  return 'USDT' + randomUUID().replace(/-/g, '').slice(0, 30).toUpperCase();
}

function generateWorkerNames(count, options) {
  const chineseFirst = ['Wei', 'Li', 'Chen', 'Ming', 'Hao'];
  const chineseLast = ['Zhang', 'Li', 'Wang', 'Liu', 'Chen'];
  const spanishFirst = ['Carlos', 'Miguel', 'Sofia', 'Luis', 'Maria'];
  const spanishLast = ['Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez'];
  const westernFirst = ['James', 'Emily', 'Michael', 'Sarah', 'David', 'Olivia', 'Robert', 'Emma'];
  const westernLast = ['Smith', 'Johnson', 'Brown', 'Taylor', 'Anderson', 'Miller', 'Davis'];

  const workers = [];
  const chineseCount = options.chinese || 0;
  const spanishCount = options.spanish || 0;
  const caucasianCount = count - chineseCount - spanishCount;

  for (let i = 0; i < chineseCount; i++) {
    workers.push({
      name: `${chineseFirst[randomInt(0, chineseFirst.length - 1)]} ${
        chineseLast[randomInt(0, chineseLast.length - 1)]
      }`,
      nationality: 'Chinese',
    });
  }

  for (let i = 0; i < spanishCount; i++) {
    workers.push({
      name: `${spanishFirst[randomInt(0, spanishFirst.length - 1)]} ${
        spanishLast[randomInt(0, spanishLast.length - 1)]
      }`,
      nationality: 'Spanish',
    });
  }

  for (let i = 0; i < caucasianCount; i++) {
    workers.push({
      name: `${westernFirst[randomInt(0, westernFirst.length - 1)]} ${
        westernLast[randomInt(0, westernLast.length - 1)]
      }`,
      nationality: 'Caucasian',
    });
  }

  return workers;
}

async function ensureGonnyAdmin() {
  const email = 'gonnyzalowski@gmail.com';
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        firstName: 'gonny',
        lastName: 'zalowski',
        isAdmin: true,
        accountStatus: 'ACTIVE',
        kycStatus: 'VERIFIED',
      },
    });
  } else {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        isAdmin: true,
        accountStatus: 'ACTIVE',
        kycStatus: 'VERIFIED',
        password: passwordHash,
        loginPreference: 'question',
      },
    });
  }

  // Reset security questions
  await prisma.securityQuestion.deleteMany({ where: { userId: user.id } });

  const questions = [
    {
      question: 'What was the name of your first pet?',
      answer: 'fluffy',
    },
    {
      question: 'In what city were you born?',
      answer: 'london',
    },
    {
      question: "What is your mother's maiden name?",
      answer: 'smith',
    },
  ];

  for (const q of questions) {
    await prisma.securityQuestion.create({
      data: {
        userId: user.id,
        question: q.question,
        answerHash: await bcrypt.hash(q.answer.toLowerCase(), 10),
      },
    });
  }

  console.log('\n✅ Gonny admin ensured. Login details:');
  console.log('   Email:   ', email);
  console.log('   Password:', 'Password123!');
  console.log('   Security Q1: What was the name of your first pet?  Answer: fluffy');
  console.log('   Security Q2: In what city were you born?          Answer: london');
  console.log("   Security Q3: What is your mother's maiden name?   Answer: smith");
}

async function deleteSystemAdmin() {
  const email = 'admin@mybanker.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
    console.log('✅ Deleted system admin user:', email);
  } else {
    console.log('ℹ️ System admin user not found, nothing to delete.');
  }
}

async function seedUserWithHistory(options) {
  const {
    email,
    firstName,
    lastName,
    city,
    state,
    employerName,
    charityNames,
    workerCount,
    workerComposition,
    workerPayRange,
    startDate,
    endDate,
  } = options;

  console.log(`\n🌱 Seeding data for ${firstName} ${lastName} (${email})`);

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      firstName,
      lastName,
      city,
      state,
      country: 'United States',
      isAdmin: false,
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      loginPreference: 'question',
    },
  });

  // Security questions (same as Gonny for now, user can change later)
  const secQs = [
    {
      question: 'What was the name of your first pet?',
      answer: 'fluffy',
    },
    {
      question: 'In what city were you born?',
      answer: 'london',
    },
    {
      question: "What is your mother's maiden name?",
      answer: 'smith',
    },
  ];

  for (const q of secQs) {
    await prisma.securityQuestion.create({
      data: {
        userId: user.id,
        question: q.question,
        answerHash: await bcrypt.hash(q.answer.toLowerCase(), 10),
      },
    });
  }

  // Accounts
  const checking = await prisma.account.create({
    data: {
      userId: user.id,
      accountType: 'CHECKING',
      accountNumber: generateAccountNumber('7'),
      currency: 'USD',
      isPrimary: true,
      balance: 0,
      availableBalance: 0,
    },
  });

  const savings = await prisma.account.create({
    data: {
      userId: user.id,
      accountType: 'SAVINGS',
      accountNumber: generateAccountNumber('8'),
      currency: 'USD',
      isPrimary: false,
      balance: 0,
      availableBalance: 0,
    },
  });

  const crypto = await prisma.account.create({
    data: {
      userId: user.id,
      accountType: 'CRYPTO_WALLET',
      accountNumber: generateAccountNumber('9'),
      currency: 'USDT',
      cryptoSymbol: 'USDT',
      cryptoAddress: generateCryptoAddress(),
      accountName: 'USDT Wallet',
      isPrimary: false,
      balance: 0,
      availableBalance: 0,
    },
  });

  let checkingBalance = 0;
  let savingsBalance = 0;
  let cryptoBalance = 0;
  const transactions = [];

  // ===== 1. Job income and payroll (2-3 jobs per year) =====
  const years = yearIterator(startDate, endDate);
  for (const year of years) {
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31));
    if (year === startDate.getUTCFullYear()) {
      yearStart.setUTCMonth(startDate.getUTCMonth(), startDate.getUTCDate());
    }
    if (year === endDate.getUTCFullYear()) {
      yearEnd.setUTCMonth(endDate.getUTCMonth(), endDate.getUTCDate());
    }

    const jobCount = randomInt(2, 3);
    const workers = generateWorkerNames(workerCount, workerComposition);

    for (let j = 0; j < jobCount; j++) {
      const latestStart = addDays(yearEnd, -80); // ensure room for duration
      const jobStart = randomDateBetween(yearStart, latestStart);
      const durationDays = randomInt(60, 75);
      const jobEnd = addDays(jobStart, durationDays);

      const totalAmount = randomFloat(1600000, 2200000, 2);
      const upfront = parseFloat((totalAmount * 0.4).toFixed(2));
      const balance = parseFloat((totalAmount * 0.6).toFixed(2));

      // Upfront payment
      transactions.push({
        userId: user.id,
        accountId: checking.id,
        amount: upfront,
        type: 'CREDIT',
        description: `${employerName} contract - 40% upfront`,
        category: 'BUSINESS_INCOME',
        merchantName: employerName,
        merchantCategory: 'BUSINESS_SERVICES',
        status: 'COMPLETED',
        createdAt: jobStart,
        updatedAt: jobStart,
      });
      checkingBalance += upfront;

      // Final balance payment
      transactions.push({
        userId: user.id,
        accountId: checking.id,
        amount: balance,
        type: 'CREDIT',
        description: `${employerName} contract - 60% completion payment`,
        category: 'BUSINESS_INCOME',
        merchantName: employerName,
        merchantCategory: 'BUSINESS_SERVICES',
        status: 'COMPLETED',
        createdAt: jobEnd,
        updatedAt: jobEnd,
      });
      checkingBalance += balance;

      // Payroll near job end
      for (const worker of workers) {
        const payAmount = randomFloat(workerPayRange.min, workerPayRange.max, 2);
        const payDate = addDays(jobEnd, randomInt(0, 5));
        transactions.push({
          userId: user.id,
          accountId: checking.id,
          amount: payAmount,
          type: 'DEBIT',
          description: `Payroll - ${worker.name}`,
          category: 'PAYROLL',
          merchantName: worker.name,
          merchantCategory: 'PAYROLL',
          status: 'COMPLETED',
          createdAt: payDate,
          updatedAt: payDate,
        });
        checkingBalance -= payAmount;
      }
    }
  }

  // ===== 2. Bitenders crypto dividends (monthly to crypto wallet) =====
  let currentDivDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 5));
  while (currentDivDate <= endDate) {
    const amount = randomFloat(67000, 94000, 2); // in USDT (1:1 to USD)
    transactions.push({
      userId: user.id,
      accountId: crypto.id,
      amount,
      type: 'CREDIT',
      description: 'Crypto dividend from Bitenders LLC',
      category: 'CRYPTO_DIVIDEND',
      merchantName: 'Bitenders LLC',
      merchantCategory: 'CRYPTO',
      status: 'COMPLETED',
      createdAt: currentDivDate,
      updatedAt: currentDivDate,
    });
    cryptoBalance += amount;

    currentDivDate = addMonths(currentDivDate, 1);
  }

  // ===== 3. Charity from savings (twice per year) =====
  for (const year of years) {
    for (let i = 0; i < 2; i++) {
      const month = randomInt(0, 11);
      const day = randomInt(5, 20);
      const charityDate = new Date(Date.UTC(year, month, day));
      if (charityDate < startDate || charityDate > endDate) continue;

      const charityName = charityNames[randomInt(0, charityNames.length - 1)];
      const amount = 30000;
      transactions.push({
        userId: user.id,
        accountId: savings.id,
        amount,
        type: 'DEBIT',
        description: 'Charity donation',
        category: 'CHARITY',
        merchantName: charityName,
        merchantCategory: 'CHARITY',
        status: 'COMPLETED',
        createdAt: charityDate,
        updatedAt: charityDate,
      });
      savingsBalance -= amount;
    }
  }

  // ===== 4. Monthly bills (checking, recurring-like) =====
  const billProfiles = [
    {
      name: 'AT&T',
      category: 'UTILITIES',
      min: 120,
      max: 220,
    },
    {
      name: 'Starlink',
      category: 'UTILITIES',
      min: 100,
      max: 180,
    },
  ];

  if (firstName.toLowerCase() === 'brokard') {
    billProfiles.push({
      name: 'Ameren Missouri',
      category: 'UTILITIES',
      min: 150,
      max: 350,
    });
  } else {
    billProfiles.push({
      name: 'Con Edison New York',
      category: 'UTILITIES',
      min: 150,
      max: 350,
    });
  }

  const months = monthIterator(startDate, endDate);
  for (const monthStart of months) {
    for (const bill of billProfiles) {
      const billDate = new Date(
        Date.UTC(
          monthStart.getUTCFullYear(),
          monthStart.getUTCMonth(),
          randomInt(2, 7),
        ),
      );
      if (billDate < startDate || billDate > endDate) continue;

      const amount = randomFloat(bill.min, bill.max, 2);
      transactions.push({
        userId: user.id,
        accountId: checking.id,
        amount,
        type: 'DEBIT',
        description: `${bill.name} AutoPay`,
        category: 'BILL',
        merchantName: bill.name,
        merchantCategory: bill.category,
        status: 'COMPLETED',
        createdAt: billDate,
        updatedAt: billDate,
      });
      checkingBalance -= amount;
    }

    // Amazon purchases (1–2 per month)
    const amazonPurchases = randomInt(1, 2);
    for (let i = 0; i < amazonPurchases; i++) {
      const day = randomInt(8, 25);
      const purchaseDate = new Date(
        Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), day),
      );
      if (purchaseDate < startDate || purchaseDate > endDate) continue;
      const amount = randomFloat(40, 450, 2);
      transactions.push({
        userId: user.id,
        accountId: checking.id,
        amount,
        type: 'DEBIT',
        description: 'Amazon Purchase',
        category: 'SHOPPING',
        merchantName: 'Amazon.com',
        merchantCategory: 'ECOMMERCE',
        status: 'COMPLETED',
        createdAt: purchaseDate,
        updatedAt: purchaseDate,
      });
      checkingBalance -= amount;
    }
  }

  // ===== 5. RecurringPayment records for bills =====
  for (const bill of billProfiles) {
    const firstBill = new Date(
      Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 5),
    );
    const nextExec = addMonths(endDate, 1);

    await prisma.recurringPayment.create({
      data: {
        userId: user.id,
        fromAccountId: checking.id,
        paymentType: 'BILL',
        recipientName: bill.name,
        amount: randomFloat(bill.min, bill.max, 2),
        currency: 'USD',
        description: `${bill.name} AutoPay`,
        reference: `REC-${randomInt(100000, 999999)}`,
        frequency: 'MONTHLY',
        startDate: firstBill,
        nextExecutionDate: nextExec,
        dayOfMonth: 5,
        status: 'ACTIVE',
      },
    });
  }

  // ===== Persist transactions and update balances =====
  transactions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  console.log(
    `   → Creating ${transactions.length} transactions for ${firstName} ${lastName}...`,
  );

  const BATCH_SIZE = 500;
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    await prisma.transaction.createMany({ data: batch });
  }

  await prisma.account.update({
    where: { id: checking.id },
    data: {
      balance: checkingBalance,
      availableBalance: checkingBalance,
    },
  });

  await prisma.account.update({
    where: { id: savings.id },
    data: {
      balance: savingsBalance,
      availableBalance: savingsBalance,
    },
  });

  await prisma.account.update({
    where: { id: crypto.id },
    data: {
      balance: cryptoBalance,
      availableBalance: cryptoBalance,
    },
  });

  console.log(
    `   ✅ Done for ${firstName} ${lastName}. Final balances: ` +
      `Checking $${checkingBalance.toFixed(2)}, ` +
      `Savings $${savingsBalance.toFixed(2)}, ` +
      `Crypto ${cryptoBalance.toFixed(2)} USDT`,
  );
}

// Engineering companies for equipment purchases
const engineeringCompanies = [
  { name: 'Caterpillar Inc', bank: 'JPMorgan Chase', country: 'USA' },
  { name: 'Siemens AG', bank: 'Deutsche Bank', country: 'Germany' },
  { name: 'ABB Ltd', bank: 'UBS Group', country: 'Switzerland' },
  { name: 'Schneider Electric', bank: 'BNP Paribas', country: 'France' },
  { name: 'Honeywell International', bank: 'Bank of America', country: 'USA' },
  { name: 'Emerson Electric', bank: 'Wells Fargo', country: 'USA' },
  { name: 'Rockwell Automation', bank: 'Citibank', country: 'USA' },
  { name: 'Parker Hannifin', bank: 'PNC Bank', country: 'USA' },
  { name: 'Illinois Tool Works', bank: 'Northern Trust', country: 'USA' },
  { name: 'Deere & Company', bank: 'US Bank', country: 'USA' },
  { name: 'Komatsu Ltd', bank: 'Mitsubishi UFJ', country: 'Japan' },
  { name: 'Atlas Copco', bank: 'SEB Bank', country: 'Sweden' },
  { name: 'Sandvik AB', bank: 'Handelsbanken', country: 'Sweden' },
  { name: 'Hitachi Construction', bank: 'Mizuho Bank', country: 'Japan' },
  { name: 'CNH Industrial', bank: 'Intesa Sanpaolo', country: 'Italy' },
  { name: 'FANUC Corporation', bank: 'Sumitomo Mitsui', country: 'Japan' },
  { name: 'Mitsubishi Heavy Industries', bank: 'Bank of Tokyo', country: 'Japan' },
  { name: 'Baker Hughes', bank: 'HSBC', country: 'UK' },
  { name: 'Schlumberger Limited', bank: 'Barclays', country: 'UK' },
  { name: 'Flowserve Corporation', bank: 'TD Bank', country: 'USA' },
];

async function seedEquipmentPurchases(userId, accountId, count = 24) {
  console.log(`   📦 Seeding ${count} equipment purchase transactions...`);
  
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const company = engineeringCompanies[randomInt(0, engineeringCompanies.length - 1)];
    const amount = randomFloat(25000, 782560); // Random amount between $25,000 and $782,560
    const purchaseDate = randomDateBetween(twoYearsAgo, now);
    const isInternational = company.country !== 'USA';
    
    // Create transaction for equipment purchase
    await prisma.transaction.create({
      data: {
        accountId,
        amount: -amount, // Negative for debit/expense
        type: 'DEBIT',
        category: 'EQUIPMENT',
        description: `Equipment purchase from ${company.name}`,
        reference: `EQP-${Date.now()}-${randomInt(1000, 9999)}`,
        status: 'COMPLETED',
        balanceAfter: 0, // Will be recalculated
        createdAt: purchaseDate,
        updatedAt: purchaseDate,
      },
    });
  }
  
  console.log(`   ✅ Created ${count} equipment purchase transactions`);
}

async function main() {
  console.log('🌱 Custom seeding for Brian Merker and Brokard Williams');

  const startDate = new Date(Date.UTC(2023, 11, 1)); // 2023-12-01
  const endDate = new Date(Date.UTC(2025, 10, 10, 23, 59, 59)); // 2025-11-10

  // 1. Remove system admin and ensure Gonny as sole admin
  await deleteSystemAdmin();
  await ensureGonnyAdmin();

  // 2. Delete existing Brian and Brokard users (if any)
  const deleteResult = await prisma.user.deleteMany({
    where: {
      email: { in: ['brianmerker3@gmail.com', 'Brokardw@gmail.com'] },
    },
  });
  console.log(`\n🧹 Deleted ${deleteResult.count} existing Brian/Brokard users (if any).`);

  // 3. Seed Brian
  await seedUserWithHistory({
    email: 'brianmerker3@gmail.com',
    firstName: 'Brian',
    lastName: 'Merker',
    city: 'New York',
    state: 'NY',
    employerName: 'Jetex Aviation',
    charityNames: [
      'New York Cares',
      'Robin Hood Foundation',
      "God's Love We Deliver",
    ],
    workerCount: 4,
    workerComposition: { chinese: 1, spanish: 3 },
    workerPayRange: { min: 105000, max: 210000 },
    startDate,
    endDate,
  });

  // 4. Seed Brokard
  await seedUserWithHistory({
    email: 'Brokardw@gmail.com',
    firstName: 'Brokard',
    lastName: 'Williams',
    city: 'Jefferson City',
    state: 'MO',
    employerName: 'ConocoPhillips',
    charityNames: [
      "Jefferson City Children's Home",
      'Central Missouri Food Bank',
      'Jefferson City Humane Society',
    ],
    workerCount: 17,
    workerComposition: { chinese: 1, spanish: 3 },
    workerPayRange: { min: 23000, max: 45000 },
    startDate,
    endDate,
  });

  // 5. Seed 48 equipment purchase transactions (24 each for Brian and Brokard)
  console.log('\n📦 Seeding equipment purchase transactions...');
  
  // Get Brian's checking account
  const brian = await prisma.user.findUnique({ 
    where: { email: 'brianmerker3@gmail.com' },
    include: { accounts: true }
  });
  if (brian) {
    const brianChecking = brian.accounts.find(a => a.accountType === 'CHECKING');
    if (brianChecking) {
      await seedEquipmentPurchases(brian.id, brianChecking.id, 24);
    }
  }

  // Get Brokard's checking account
  const brokard = await prisma.user.findUnique({ 
    where: { email: 'Brokardw@gmail.com' },
    include: { accounts: true }
  });
  if (brokard) {
    const brokardChecking = brokard.accounts.find(a => a.accountType === 'CHECKING');
    if (brokardChecking) {
      await seedEquipmentPurchases(brokard.id, brokardChecking.id, 24);
    }
  }

  console.log('\n🎉 Custom seeding complete (including 48 equipment purchases).');
}

main()
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
