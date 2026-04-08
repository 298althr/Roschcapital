// Transaction History Generator for Brokard Williams
// Run with: node scripts/generate-brokard-transactions.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to generate random reference
function generateRef(prefix) {
  return ${prefix}--;
}

// Helper to get random amount in range
function randomAmount(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// Helper to get random date in range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper to add days to date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function main() {
  console.log('Starting transaction history generation for Brokard Williams...');

  // Find the user
  const user = await prisma.user.findFirst({
    where: { email: 'Brokardw@gmail.com' },
    include: { accounts: true }
  });

  if (!user) {
    console.error('User not found!');
    return;
  }

  console.log(Found user:   ());

  // Get primary account
  const account = user.accounts.find(a => a.isPrimary) || user.accounts[0];
  if (!account) {
    console.error('No account found!');
    return;
  }

  console.log(Using account:  ());

  // Define the date range - 3 years back from today
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 3);

  const transactions = [];

  // ============================================
  // 1. CONOCOPHILLIPS SALARY PAYMENTS (3x yearly)
  // ,000 - ,000,000 per payment
  // ============================================
  console.log('Generating ConocoPhillips salary payments...');
  for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
    // 3 payments per year: March, July, November
    const salaryMonths = [2, 6, 10]; // 0-indexed
    for (const month of salaryMonths) {
      const payDate = new Date(year, month, randomAmount(10, 25));
      if (payDate >= startDate && payDate <= endDate) {
        const amount = randomAmount(900000, 2000000);
        transactions.push({
          accountId: account.id,
          amount: amount,
          type: 'CREDIT',
          description: ConocoPhillips - Contractor Payment Q ,
          category: 'SALARY',
          merchantName: 'ConocoPhillips Company',
          merchantCategory: 'Oil & Gas',
          status: 'COMPLETED',
          reference: generateRef('COP'),
          createdAt: payDate
        });
      }
    }
  }

  // ============================================
  // 2. BITENDERS LLC INVESTMENT RETURNS (quarterly)
  // ,000 every 3 months
  // ============================================
  console.log('Generating Bitenders LLC investment returns...');
  let investDate = new Date(startDate);
  while (investDate <= endDate) {
    transactions.push({
      accountId: account.id,
      amount: 150000,
      type: 'CREDIT',
      description: Bitenders LLC - Quarterly Investment Return,
      category: 'INVESTMENT',
      merchantName: 'Bitenders LLC',
      merchantCategory: 'Investment Company',
      status: 'COMPLETED',
      reference: generateRef('BIT'),
      createdAt: new Date(investDate)
    });
    investDate.setMonth(investDate.getMonth() + 3);
  }

  // ============================================
  // 3. DAUGHTER UPKEEP (monthly) - Canada
  // ,000 - ,000 per month for school/living
  // ============================================
  console.log('Generating daughter upkeep payments...');
  let upkeepDate = new Date(startDate);
  while (upkeepDate <= endDate) {
    const amount = randomAmount(3000, 5000);
    transactions.push({
      accountId: account.id,
      amount: amount,
      type: 'DEBIT',
      description: International Wire Transfer - Daughter Upkeep (Canada),
      category: 'FAMILY',
      merchantName: 'TD Bank Canada',
      merchantCategory: 'Wire Transfer',
      status: 'COMPLETED',
      reference: generateRef('WIRE'),
      createdAt: new Date(upkeepDate)
    });
    
    // Tuition payments (January and September)
    if (upkeepDate.getMonth() === 0 || upkeepDate.getMonth() === 8) {
      transactions.push({
        accountId: account.id,
        amount: randomAmount(15000, 25000),
        type: 'DEBIT',
        description: University of Toronto - Tuition Payment  Semester,
        category: 'EDUCATION',
        merchantName: 'University of Toronto',
        merchantCategory: 'Education',
        status: 'COMPLETED',
        reference: generateRef('EDU'),
        createdAt: addDays(upkeepDate, 5)
      });
    }
    upkeepDate.setMonth(upkeepDate.getMonth() + 1);
  }

  // ============================================
  // 4. SUBCONTRACTOR PAYMENTS (17 people, 3x yearly)
  // ,000 - ,000 per person during contract periods
  // ============================================
  console.log('Generating subcontractor payments...');
  const subcontractors = [
    'James Mitchell', 'Robert Chen', 'Michael Torres', 'David Okonkwo',
    'William Patel', 'Richard Nguyen', 'Joseph Kim', 'Thomas Anderson',
    'Christopher Lee', 'Daniel Martinez', 'Matthew Brown', 'Anthony Davis',
    'Mark Wilson', 'Steven Taylor', 'Paul Jackson', 'Andrew White', 'Joshua Harris'
  ];
  
  for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
    // Contract periods: Feb-Mar, Jun-Jul, Oct-Nov
    const contractMonths = [[1, 2], [5, 6], [9, 10]];
    for (const [startMonth, endMonth] of contractMonths) {
      const payDate = new Date(year, endMonth, randomAmount(25, 28));
      if (payDate >= startDate && payDate <= endDate) {
        for (const contractor of subcontractors) {
          const amount = randomAmount(11000, 19000);
          transactions.push({
            accountId: account.id,
            amount: amount,
            type: 'DEBIT',
            description: Subcontractor Payment - ,
            category: 'BUSINESS',
            merchantName: contractor,
            merchantCategory: 'Contractor Services',
            status: 'COMPLETED',
            reference: generateRef('SUB'),
            createdAt: addDays(payDate, Math.random() * 3)
          });
        }
      }
    }
  }

  // ============================================
  // 5. MONTHLY SUBSCRIPTIONS
  // Netflix, AT&T, Apple TV
  // ============================================
  console.log('Generating monthly subscriptions...');
  let subDate = new Date(startDate);
  while (subDate <= endDate) {
    // Netflix - .99
    transactions.push({
      accountId: account.id,
      amount: 15.99,
      type: 'DEBIT',
      description: 'Netflix Premium Subscription',
      category: 'ENTERTAINMENT',
      merchantName: 'Netflix Inc',
      merchantCategory: 'Streaming Services',
      status: 'COMPLETED',
      reference: generateRef('NFLX'),
      createdAt: new Date(subDate.getFullYear(), subDate.getMonth(), 1)
    });
    
    // AT&T - .99
    transactions.push({
      accountId: account.id,
      amount: 189.99,
      type: 'DEBIT',
      description: 'AT&T Wireless & Internet Bundle',
      category: 'UTILITIES',
      merchantName: 'AT&T',
      merchantCategory: 'Telecommunications',
      status: 'COMPLETED',
      reference: generateRef('ATT'),
      createdAt: new Date(subDate.getFullYear(), subDate.getMonth(), 5)
    });
    
    // Apple TV+ - .99
    transactions.push({
      accountId: account.id,
      amount: 9.99,
      type: 'DEBIT',
      description: 'Apple TV+ Monthly Subscription',
      category: 'ENTERTAINMENT',
      merchantName: 'Apple Inc',
      merchantCategory: 'Streaming Services',
      status: 'COMPLETED',
      reference: generateRef('APTV'),
      createdAt: new Date(subDate.getFullYear(), subDate.getMonth(), 8)
    });
    
    // Spotify - .99
    transactions.push({
      accountId: account.id,
      amount: 10.99,
      type: 'DEBIT',
      description: 'Spotify Premium Family',
      category: 'ENTERTAINMENT',
      merchantName: 'Spotify AB',
      merchantCategory: 'Streaming Services',
      status: 'COMPLETED',
      reference: generateRef('SPOT'),
      createdAt: new Date(subDate.getFullYear(), subDate.getMonth(), 12)
    });
    
    subDate.setMonth(subDate.getMonth() + 1);
  }

  // ============================================
  // 6. GOVERNMENT TAXES
  // Federal, State, Property taxes
  // ============================================
  console.log('Generating tax payments...');
  for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
    // Federal Tax (April 15)
    const fedTaxDate = new Date(year, 3, 15);
    if (fedTaxDate >= startDate && fedTaxDate <= endDate) {
      transactions.push({
        accountId: account.id,
        amount: randomAmount(180000, 350000),
        type: 'DEBIT',
        description: IRS Federal Income Tax Payment - Tax Year ,
        category: 'TAXES',
        merchantName: 'Internal Revenue Service',
        merchantCategory: 'Government',
        status: 'COMPLETED',
        reference: generateRef('IRS'),
        createdAt: fedTaxDate
      });
    }
    
    // Missouri State Tax (April 15)
    const stateTaxDate = new Date(year, 3, 15);
    if (stateTaxDate >= startDate && stateTaxDate <= endDate) {
      transactions.push({
        accountId: account.id,
        amount: randomAmount(25000, 55000),
        type: 'DEBIT',
        description: Missouri Dept of Revenue - State Income Tax ,
        category: 'TAXES',
        merchantName: 'Missouri Dept of Revenue',
        merchantCategory: 'Government',
        status: 'COMPLETED',
        reference: generateRef('MOTR'),
        createdAt: addDays(stateTaxDate, 1)
      });
    }
    
    // Property Tax (June and December)
    for (const month of [5, 11]) {
      const propTaxDate = new Date(year, month, 15);
      if (propTaxDate >= startDate && propTaxDate <= endDate) {
        transactions.push({
          accountId: account.id,
          amount: randomAmount(4500, 6500),
          type: 'DEBIT',
          description: Cole County - Property Tax  ,
          category: 'TAXES',
          merchantName: 'Cole County Collector',
          merchantCategory: 'Government',
          status: 'COMPLETED',
          reference: generateRef('PROP'),
          createdAt: propTaxDate
        });
      }
    }
    
    // Quarterly Estimated Tax Payments
    for (const month of [0, 3, 6, 9]) {
      const estTaxDate = new Date(year, month, 15);
      if (estTaxDate >= startDate && estTaxDate <= endDate) {
        transactions.push({
          accountId: account.id,
          amount: randomAmount(45000, 85000),
          type: 'DEBIT',
          description: IRS Quarterly Estimated Tax Payment Q ,
          category: 'TAXES',
          merchantName: 'Internal Revenue Service',
          merchantCategory: 'Government',
          status: 'COMPLETED',
          reference: generateRef('ESTX'),
          createdAt: estTaxDate
        });
      }
    }
  }

  // ============================================
  // 7. AMAZON & EBAY PURCHASES (monthly)
  // ============================================
  console.log('Generating Amazon & eBay purchases...');
  let shopDate = new Date(startDate);
  while (shopDate <= endDate) {
    // Amazon purchases (2-4 per month)
    const amazonCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < amazonCount; i++) {
      transactions.push({
        accountId: account.id,
        amount: randomAmount(25, 450),
        type: 'DEBIT',
        description: 'Amazon.com Purchase',
        category: 'SHOPPING',
        merchantName: 'Amazon.com',
        merchantCategory: 'Online Retail',
        status: 'COMPLETED',
        reference: generateRef('AMZN'),
        createdAt: randomDate(shopDate, addDays(shopDate, 28))
      });
    }
    
    // eBay purchases (1-2 per month)
    const ebayCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < ebayCount; i++) {
      transactions.push({
        accountId: account.id,
        amount: randomAmount(15, 300),
        type: 'DEBIT',
        description: 'eBay Purchase',
        category: 'SHOPPING',
        merchantName: 'eBay Inc',
        merchantCategory: 'Online Marketplace',
        status: 'COMPLETED',
        reference: generateRef('EBAY'),
        createdAt: randomDate(shopDate, addDays(shopDate, 28))
      });
    }
    
    shopDate.setMonth(shopDate.getMonth() + 1);
  }

  // ============================================
  // 8. CAR MAINTENANCE & FUEL
  // ============================================
  console.log('Generating car expenses...');
  let carDate = new Date(startDate);
  while (carDate <= endDate) {
    // Fuel (weekly)
    for (let week = 0; week < 4; week++) {
      transactions.push({
        accountId: account.id,
        amount: randomAmount(55, 95),
        type: 'DEBIT',
        description: 'Shell Gas Station - Fuel',
        category: 'TRANSPORTATION',
        merchantName: 'Shell Oil',
        merchantCategory: 'Gas Station',
        status: 'COMPLETED',
        reference: generateRef('FUEL'),
        createdAt: addDays(carDate, week * 7 + Math.random() * 3)
      });
    }
    
    // Car maintenance (every 3 months)
    if (carDate.getMonth() % 3 === 0) {
      transactions.push({
        accountId: account.id,
        amount: randomAmount(150, 800),
        type: 'DEBIT',
        description: 'Firestone Complete Auto Care - Service',
        category: 'TRANSPORTATION',
        merchantName: 'Firestone',
        merchantCategory: 'Auto Service',
        status: 'COMPLETED',
        reference: generateRef('AUTO'),
        createdAt: addDays(carDate, 10)
      });
    }
    
    // Car insurance (monthly)
    transactions.push({
      accountId: account.id,
      amount: 285.00,
      type: 'DEBIT',
      description: 'State Farm Insurance - Auto Premium',
      category: 'INSURANCE',
      merchantName: 'State Farm',
      merchantCategory: 'Insurance',
      status: 'COMPLETED',
      reference: generateRef('INSUR'),
      createdAt: new Date(carDate.getFullYear(), carDate.getMonth(), 20)
    });
    
    carDate.setMonth(carDate.getMonth() + 1);
  }

  // ============================================
  // 9. HOUSE MAINTENANCE
  // ============================================
  console.log('Generating house maintenance expenses...');
  let houseDate = new Date(startDate);
  while (houseDate <= endDate) {
    // Utilities (monthly)
    transactions.push({
      accountId: account.id,
      amount: randomAmount(180, 350),
      type: 'DEBIT',
      description: 'Ameren Missouri - Electric Bill',
      category: 'UTILITIES',
      merchantName: 'Ameren Missouri',
      merchantCategory: 'Utilities',
      status: 'COMPLETED',
      reference: generateRef('ELEC'),
      createdAt: new Date(houseDate.getFullYear(), houseDate.getMonth(), 18)
    });
    
    transactions.push({
      accountId: account.id,
      amount: randomAmount(45, 120),
      type: 'DEBIT',
      description: 'Spire Missouri - Natural Gas',
      category: 'UTILITIES',
      merchantName: 'Spire Missouri',
      merchantCategory: 'Utilities',
      status: 'COMPLETED',
      reference: generateRef('GAS'),
      createdAt: new Date(houseDate.getFullYear(), houseDate.getMonth(), 22)
    });
    
    transactions.push({
      accountId: account.id,
      amount: 85.00,
      type: 'DEBIT',
      description: 'Jefferson City Water - Water & Sewer',
      category: 'UTILITIES',
      merchantName: 'Jefferson City Utilities',
      merchantCategory: 'Utilities',
      status: 'COMPLETED',
      reference: generateRef('WATR'),
      createdAt: new Date(houseDate.getFullYear(), houseDate.getMonth(), 25)
    });
    
    // Home maintenance (random, every 2-3 months)
    if (Math.random() > 0.6) {
      const stores = ['Home Depot', 'Lowes', 'Ace Hardware'];
      transactions.push({
        accountId: account.id,
        amount: randomAmount(50, 500),
        type: 'DEBIT',
        description: ${stores[Math.floor(Math.random() * stores.length)]} - Home Improvement,
        category: 'HOME',
        merchantName: stores[Math.floor(Math.random() * stores.length)],
        merchantCategory: 'Home Improvement',
        status: 'COMPLETED',
        reference: generateRef('HOME'),
        createdAt: randomDate(houseDate, addDays(houseDate, 28))
      });
    }
    
    // Lawn care (monthly during spring/summer)
    if (houseDate.getMonth() >= 3 && houseDate.getMonth() <= 9) {
      transactions.push({
        accountId: account.id,
        amount: 175.00,
        type: 'DEBIT',
        description: 'TruGreen Lawn Care - Monthly Service',
        category: 'HOME',
        merchantName: 'TruGreen',
        merchantCategory: 'Lawn Care',
        status: 'COMPLETED',
        reference: generateRef('LAWN'),
        createdAt: new Date(houseDate.getFullYear(), houseDate.getMonth(), 10)
      });
    }
    
    houseDate.setMonth(houseDate.getMonth() + 1);
  }

  // ============================================
  // 10. GIFTS & SPECIAL OCCASIONS
  // ============================================
  console.log('Generating gift purchases...');
  for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
    // Christmas gifts (December)
    const xmasDate = new Date(year, 11, randomAmount(10, 20));
    if (xmasDate >= startDate && xmasDate <= endDate) {
      transactions.push({
        accountId: account.id,
        amount: randomAmount(500, 2500),
        type: 'DEBIT',
        description: 'Nordstrom - Holiday Gifts',
        category: 'GIFTS',
        merchantName: 'Nordstrom',
        merchantCategory: 'Department Store',
        status: 'COMPLETED',
        reference: generateRef('GIFT'),
        createdAt: xmasDate
      });
    }
    
    // Birthday gifts (random dates)
    for (let i = 0; i < 4; i++) {
      const bday = randomDate(new Date(year, 0, 1), new Date(year, 11, 31));
      if (bday >= startDate && bday <= endDate) {
        transactions.push({
          accountId: account.id,
          amount: randomAmount(50, 300),
          type: 'DEBIT',
          description: 'Best Buy - Gift Purchase',
          category: 'GIFTS',
          merchantName: 'Best Buy',
          merchantCategory: 'Electronics',
          status: 'COMPLETED',
          reference: generateRef('GIFT'),
          createdAt: bday
        });
      }
    }
  }

  // ============================================
  // 11. SPECIFIC TRANSACTION: Avasflowers.net
  // November 17, 2025 - .96
  // ============================================
  console.log('Adding Avasflowers purchase...');
  transactions.push({
    accountId: account.id,
    amount: 209.96,
    type: 'DEBIT',
    description: 'Avasflowers.net - Flower Arrangement Delivery',
    category: 'GIFTS',
    merchantName: 'Avasflowers.net',
    merchantCategory: 'Florist',
    status: 'COMPLETED',
    reference: generateRef('FLWR'),
    createdAt: new Date(2025, 10, 17) // November 17, 2025
  });

  // ============================================
  // 12. DINING & GROCERIES
  // ============================================
  console.log('Generating dining and grocery expenses...');
  let dineDate = new Date(startDate);
  while (dineDate <= endDate) {
    // Groceries (weekly)
    for (let week = 0; week < 4; week++) {
      const groceryStores = ['Walmart', 'Hy-Vee', 'Schnucks', 'Costco'];
      transactions.push({
        accountId: account.id,
        amount: randomAmount(120, 350),
        type: 'DEBIT',
        description: ${groceryStores[Math.floor(Math.random() * groceryStores.length)]} - Groceries,
        category: 'GROCERIES',
        merchantName: groceryStores[Math.floor(Math.random() * groceryStores.length)],
        merchantCategory: 'Grocery Store',
        status: 'COMPLETED',
        reference: generateRef('GROC'),
        createdAt: addDays(dineDate, week * 7 + Math.random() * 2)
      });
    }
    
    // Dining out (2-4 times per month)
    const diningCount = Math.floor(Math.random() * 3) + 2;
    const restaurants = ['Olive Garden', 'Texas Roadhouse', 'Applebees', 'Outback Steakhouse', 'Red Lobster', 'The Capital Grille'];
    for (let i = 0; i < diningCount; i++) {
      transactions.push({
        accountId: account.id,
        amount: randomAmount(45, 250),
        type: 'DEBIT',
        description: ${restaurants[Math.floor(Math.random() * restaurants.length)]} - Dining,
        category: 'DINING',
        merchantName: restaurants[Math.floor(Math.random() * restaurants.length)],
        merchantCategory: 'Restaurant',
        status: 'COMPLETED',
        reference: generateRef('DINE'),
        createdAt: randomDate(dineDate, addDays(dineDate, 28))
      });
    }
    
    dineDate.setMonth(dineDate.getMonth() + 1);
  }

  // ============================================
  // 13. HEALTHCARE
  // ============================================
  console.log('Generating healthcare expenses...');
  let healthDate = new Date(startDate);
  while (healthDate <= endDate) {
    // Health insurance (monthly)
    transactions.push({
      accountId: account.id,
      amount: 650.00,
      type: 'DEBIT',
      description: 'Blue Cross Blue Shield - Health Insurance Premium',
      category: 'HEALTHCARE',
      merchantName: 'BCBS Missouri',
      merchantCategory: 'Insurance',
      status: 'COMPLETED',
      reference: generateRef('HLTH'),
      createdAt: new Date(healthDate.getFullYear(), healthDate.getMonth(), 1)
    });
    
    // Doctor visits (random, 1-2 per quarter)
    if (Math.random() > 0.7) {
      transactions.push({
        accountId: account.id,
        amount: randomAmount(25, 150),
        type: 'DEBIT',
        description: 'Capital Region Medical Center - Copay',
        category: 'HEALTHCARE',
        merchantName: 'Capital Region Medical',
        merchantCategory: 'Healthcare',
        status: 'COMPLETED',
        reference: generateRef('MED'),
        createdAt: randomDate(healthDate, addDays(healthDate, 28))
      });
    }
    
    // Pharmacy (monthly)
    transactions.push({
      accountId: account.id,
      amount: randomAmount(15, 85),
      type: 'DEBIT',
      description: 'CVS Pharmacy - Prescription',
      category: 'HEALTHCARE',
      merchantName: 'CVS Pharmacy',
      merchantCategory: 'Pharmacy',
      status: 'COMPLETED',
      reference: generateRef('RX'),
      createdAt: new Date(healthDate.getFullYear(), healthDate.getMonth(), 15)
    });
    
    healthDate.setMonth(healthDate.getMonth() + 1);
  }

  // ============================================
  // 14. BANK FEES & CHARGES
  // ============================================
  console.log('Generating bank fees...');
  let feeDate = new Date(startDate);
  while (feeDate <= endDate) {
    // Wire transfer fees (for daughter upkeep)
    transactions.push({
      accountId: account.id,
      amount: 45.00,
      type: 'DEBIT',
      description: 'International Wire Transfer Fee',
      category: 'FEES',
      merchantName: 'Gatwick Bank',
      merchantCategory: 'Bank Fee',
      status: 'COMPLETED',
      reference: generateRef('FEE'),
      createdAt: addDays(new Date(feeDate.getFullYear(), feeDate.getMonth(), 1), 1)
    });
    
    feeDate.setMonth(feeDate.getMonth() + 1);
  }

  // ============================================
  // 15. MISCELLANEOUS CREDITS (refunds, etc.)
  // ============================================
  console.log('Generating miscellaneous credits...');
  for (let i = 0; i < 20; i++) {
    const refundDate = randomDate(startDate, endDate);
    transactions.push({
      accountId: account.id,
      amount: randomAmount(25, 500),
      type: 'CREDIT',
      description: 'Amazon.com - Refund',
      category: 'REFUND',
      merchantName: 'Amazon.com',
      merchantCategory: 'Online Retail',
      status: 'COMPLETED',
      reference: generateRef('RFND'),
      createdAt: refundDate
    });
  }

  // Sort transactions by date
  transactions.sort((a, b) => a.createdAt - b.createdAt);

  console.log(\nTotal transactions to create: );

  // Calculate running balance to reach target of ,725,916
  let runningBalance = 0;
  for (const tx of transactions) {
    if (tx.type === 'CREDIT') {
      runningBalance += parseFloat(tx.amount);
    } else {
      runningBalance -= parseFloat(tx.amount);
    }
  }

  console.log(Calculated ending balance: 25{runningBalance.toFixed(2)});
  const targetBalance = 1725916;
  const adjustment = targetBalance - runningBalance;
  
  console.log(Target balance: 25{targetBalance});
  console.log(Adjustment needed: 25{adjustment.toFixed(2)});

  // Add adjustment transaction if needed
  if (adjustment > 0) {
    transactions.push({
      accountId: account.id,
      amount: Math.abs(adjustment),
      type: 'CREDIT',
      description: 'ConocoPhillips - Performance Bonus',
      category: 'BONUS',
      merchantName: 'ConocoPhillips Company',
      merchantCategory: 'Oil & Gas',
      status: 'COMPLETED',
      reference: generateRef('BONUS'),
      createdAt: new Date(2025, 11, 1) // December 1, 2025
    });
  } else if (adjustment < 0) {
    transactions.push({
      accountId: account.id,
      amount: Math.abs(adjustment),
      type: 'DEBIT',
      description: 'Investment - Bitenders LLC Additional Stake',
      category: 'INVESTMENT',
      merchantName: 'Bitenders LLC',
      merchantCategory: 'Investment',
      status: 'COMPLETED',
      reference: generateRef('INVEST'),
      createdAt: new Date(2025, 11, 1)
    });
  }

  // Insert all transactions
  console.log('\nInserting transactions into database...');
  
  let inserted = 0;
  for (const tx of transactions) {
    try {
      await prisma.transaction.create({ data: tx });
      inserted++;
      if (inserted % 100 === 0) {
        console.log(Inserted / transactions...);
      }
    } catch (err) {
      console.error(Failed to insert transaction: );
    }
  }

  // Update account balance
  await prisma.account.update({
    where: { id: account.id },
    data: { balance: targetBalance }
  });

  console.log(\n Successfully inserted  transactions);
  console.log( Account balance updated to 25{targetBalance.toLocaleString()});

  // ============================================
  // CREATE LOANS (3 this year, 2 defaulted, 0 active)
  // ============================================
  console.log('\nCreating loan history...');
  
  // Loan 1 - Defaulted (January 2025)
  await prisma.loan.create({
    data: {
      userId: user.id,
      accountId: account.id,
      loanType: 'PERSONAL',
      amount: 75000,
      interestRate: 8.5,
      termMonths: 24,
      monthlyPayment: 3412.50,
      remainingBalance: 68500,
      totalPaid: 6500,
      status: 'DEFAULTED',
      purpose: 'Home renovation project',
      createdAt: new Date(2025, 0, 15),
      approvedAt: new Date(2025, 0, 16),
      disbursedAt: new Date(2025, 0, 17)
    }
  });

  // Loan 2 - Defaulted (April 2025)
  await prisma.loan.create({
    data: {
      userId: user.id,
      accountId: account.id,
      loanType: 'BUSINESS',
      amount: 150000,
      interestRate: 7.25,
      termMonths: 36,
      monthlyPayment: 4625.00,
      remainingBalance: 141000,
      totalPaid: 9000,
      status: 'DEFAULTED',
      purpose: 'Equipment purchase for subcontractors',
      createdAt: new Date(2025, 3, 10),
      approvedAt: new Date(2025, 3, 12),
      disbursedAt: new Date(2025, 3, 13)
    }
  });

  // Loan 3 - Paid off (August 2025)
  await prisma.loan.create({
    data: {
      userId: user.id,
      accountId: account.id,
      loanType: 'PERSONAL',
      amount: 50000,
      interestRate: 9.0,
      termMonths: 12,
      monthlyPayment: 4378.00,
      remainingBalance: 0,
      totalPaid: 52536,
      status: 'PAID',
      purpose: 'Daughter education expenses',
      createdAt: new Date(2025, 7, 1),
      approvedAt: new Date(2025, 7, 2),
      disbursedAt: new Date(2025, 7, 3)
    }
  });

  console.log(' Created 3 loans (2 defaulted, 1 paid off)');

  console.log('\n Transaction history generation complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.\());
