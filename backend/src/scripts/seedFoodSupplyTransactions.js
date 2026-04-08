import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// User email to account mapping
const USER_EMAILS = {
  brian: 'brianmerker3@gmail.com',
  benard: 'benardwilliams822@gmail.com',
  brokard: 'Brokardw@gmail.com'
};

async function getUserPrimaryAccount(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      accounts: {
        where: { isActive: true },
        orderBy: { isPrimary: 'desc' }
      }
    }
  });

  if (!user || user.accounts.length === 0) {
    console.error(`No account found for user: ${email}`);
    return null;
  }

  return { userId: user.id, account: user.accounts[0] };
}

function parseCSVFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  return records;
}

function generateReference(requestNumber) {
  return `TXN-${requestNumber}`;
}

async function seedTransactionsForUser(userName, csvFileName) {
  const email = USER_EMAILS[userName];
  const userAccount = await getUserPrimaryAccount(email);
  
  if (!userAccount) {
    console.error(`Skipping ${userName} - no account found`);
    return;
  }

  const { userId, account } = userAccount;
  const csvPath = path.join(__dirname, '..', '..', '..', 'Foodsupplytransactions', csvFileName);
  
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    return;
  }

  const records = parseCSVFile(csvPath);
  console.log(`\nProcessing ${records.length} records for ${userName} (${email})`);
  console.log(`Account: ${account.accountNumber} (${account.accountType})`);

  let created = 0;
  let skipped = 0;

  for (const record of records) {
    const requestNumber = record['Request Number'];
    const status = record['Status'];
    const discountedPrice = parseFloat(record['Discounted Price']) || 0;
    const supplyTypes = record['Supply Types'];
    const deliveryLocation = record['Delivery Location'];
    const createdAtStr = record['Created At'];
    
    // Skip if not completed
    if (status !== 'completed' && status !== 'transaction_completed') {
      skipped++;
      continue;
    }

    // Skip if no price
    if (discountedPrice <= 0) {
      skipped++;
      continue;
    }

    // Parse the date from Created At
    let transactionDate;
    if (createdAtStr) {
      transactionDate = new Date(createdAtStr);
    } else {
      transactionDate = new Date();
    }

    // Check if transaction already exists
    const reference = generateReference(requestNumber);
    const existingTx = await prisma.transaction.findUnique({
      where: { reference }
    });

    if (existingTx) {
      skipped++;
      continue;
    }

    // Create the transaction as a DEBIT (expense)
    const description = `Food Supply Request - ${supplyTypes.replace(/_/g, ' ').replace(/,/g, ', ')} (${deliveryLocation.replace(/_/g, ' ')})`;
    
    try {
      await prisma.transaction.create({
        data: {
          userId,
          accountId: account.id,
          reference,
          amount: discountedPrice,
          type: 'DEBIT',
          description,
          category: 'SUPPLIES',
          merchantName: 'Food Supply Services',
          merchantCategory: 'FOOD_SUPPLIES',
          status: 'COMPLETED',
          createdAt: transactionDate,
          updatedAt: transactionDate
        }
      });
      created++;
      console.log(`  Created: ${reference} - $${discountedPrice.toFixed(2)} on ${transactionDate.toISOString().split('T')[0]}`);
    } catch (error) {
      console.error(`  Error creating ${reference}:`, error.message);
      skipped++;
    }
  }

  console.log(`  Summary: ${created} created, ${skipped} skipped`);
}

async function main() {
  console.log('=== Food Supply Transactions Seeder ===\n');

  try {
    // Seed transactions for each user
    await seedTransactionsForUser('brian', 'brianfoodsupply.csv');
    await seedTransactionsForUser('benard', 'benardfoodsupply.csv');
    await seedTransactionsForUser('brokard', 'brokardfoodsupply.csv');

    console.log('\n=== Seeding Complete ===');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
