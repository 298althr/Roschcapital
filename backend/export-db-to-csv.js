// Export entire database to CSV files
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Helper function to convert array of objects to CSV
function arrayToCSV(data, headers) {
  if (!data || data.length === 0) {
    return headers.join(',') + '\n';
  }

  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      
      if (value instanceof Date) {
        return `"${value.toISOString()}"`;
      }
      
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      
      // Escape quotes and wrap in quotes if contains comma or quote
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    });
    
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

async function exportDatabase() {
  console.log('📊 EXPORTING DATABASE TO CSV FILES');
  console.log('===================================\n');

  // Create exports directory
  const exportDir = path.join(__dirname, 'database-exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const exportPath = path.join(exportDir, `export-${timestamp}`);
  fs.mkdirSync(exportPath);

  console.log(`📁 Export directory: ${exportPath}\n`);

  try {
    // 1. Export Users
    console.log('1️⃣ Exporting Users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        accountStatus: true,
        kycStatus: true,
        isAdmin: true,
        loginPreference: true,
        createdAt: true,
        updatedAt: true
        // Note: Excluding password for security
      }
    });
    
    const usersCSV = arrayToCSV(users, [
      'id', 'email', 'firstName', 'lastName', 'phone', 'dateOfBirth',
      'accountStatus', 'kycStatus', 'isAdmin', 'loginPreference', 'createdAt', 'updatedAt'
    ]);
    
    fs.writeFileSync(path.join(exportPath, 'users.csv'), usersCSV);
    console.log(`   ✅ Exported ${users.length} users`);

    // 2. Export Security Questions
    console.log('2️⃣ Exporting Security Questions...');
    const securityQuestions = await prisma.securityQuestion.findMany({
      include: {
        user: {
          select: { email: true }
        }
      }
    });
    
    const sqData = securityQuestions.map(sq => ({
      id: sq.id,
      userId: sq.userId,
      userEmail: sq.user.email,
      question: sq.question,
      createdAt: sq.createdAt
      // Note: Excluding answerHash for security
    }));
    
    const sqCSV = arrayToCSV(sqData, ['id', 'userId', 'userEmail', 'question', 'createdAt']);
    fs.writeFileSync(path.join(exportPath, 'security_questions.csv'), sqCSV);
    console.log(`   ✅ Exported ${securityQuestions.length} security questions`);

    // 3. Export Accounts
    console.log('3️⃣ Exporting Accounts...');
    const accounts = await prisma.account.findMany({
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true }
        }
      }
    });
    
    const accountsData = accounts.map(acc => ({
      id: acc.id,
      accountNumber: acc.accountNumber,
      accountType: acc.accountType,
      balance: acc.balance,
      currency: acc.currency,
      status: acc.status,
      userId: acc.userId,
      userEmail: acc.user.email,
      userName: `${acc.user.firstName} ${acc.user.lastName}`,
      isPrimary: acc.isPrimary,
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt
    }));
    
    const accountsCSV = arrayToCSV(accountsData, [
      'id', 'accountNumber', 'accountType', 'balance', 'currency', 'status',
      'userId', 'userEmail', 'userName', 'isPrimary', 'createdAt', 'updatedAt'
    ]);
    
    fs.writeFileSync(path.join(exportPath, 'accounts.csv'), accountsCSV);
    console.log(`   ✅ Exported ${accounts.length} accounts`);

    // 4. Export Transactions
    console.log('4️⃣ Exporting Transactions...');
    const transactions = await prisma.transaction.findMany({
      include: {
        account: {
          select: { accountNumber: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const transactionsData = transactions.map(tx => ({
      id: tx.id,
      accountId: tx.accountId,
      accountNumber: tx.account.accountNumber,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      description: tx.description,
      category: tx.category,
      status: tx.status,
      balanceAfter: tx.balanceAfter,
      createdAt: tx.createdAt
    }));
    
    const transactionsCSV = arrayToCSV(transactionsData, [
      'id', 'accountId', 'accountNumber', 'type', 'amount', 'currency',
      'description', 'category', 'status', 'balanceAfter', 'createdAt'
    ]);
    
    fs.writeFileSync(path.join(exportPath, 'transactions.csv'), transactionsCSV);
    console.log(`   ✅ Exported ${transactions.length} transactions`);

    // 5. Export Cards
    console.log('5️⃣ Exporting Cards...');
    const cards = await prisma.card.findMany({
      include: {
        account: {
          select: { 
            accountNumber: true,
            user: {
              select: { email: true }
            }
          }
        }
      }
    });
    
    const cardsData = cards.map(card => ({
      id: card.id,
      cardNumber: card.cardNumber,
      cardType: card.cardType,
      cardholderName: card.cardholderName,
      expiryDate: card.expiryDate,
      status: card.status,
      accountId: card.accountId,
      accountNumber: card.account.accountNumber,
      userEmail: card.account.user.email,
      creditLimit: card.creditLimit,
      currentBalance: card.currentBalance,
      createdAt: card.createdAt
      // Note: Excluding CVV for security
    }));
    
    const cardsCSV = arrayToCSV(cardsData, [
      'id', 'cardNumber', 'cardType', 'cardholderName', 'expiryDate', 'status',
      'accountId', 'accountNumber', 'userEmail', 'creditLimit',
      'currentBalance', 'createdAt'
    ]);
    
    fs.writeFileSync(path.join(exportPath, 'cards.csv'), cardsCSV);
    console.log(`   ✅ Exported ${cards.length} cards`);

    // 6. Export Transfers (if table exists)
    console.log('6️⃣ Exporting Transfers...');
    let transfers = [];
    try {
      transfers = await prisma.transfer.findMany({
      include: {
        fromAccount: {
          select: { accountNumber: true }
        },
        toAccount: {
          select: { accountNumber: true }
        }
      }
    });
    
    const transfersData = transfers.map(tf => ({
      id: tf.id,
      fromAccountId: tf.fromAccountId,
      fromAccountNumber: tf.fromAccount.accountNumber,
      toAccountId: tf.toAccountId,
      toAccountNumber: tf.toAccount.accountNumber,
      amount: tf.amount,
      currency: tf.currency,
      description: tf.description,
      status: tf.status,
      approvalStatus: tf.approvalStatus,
      createdAt: tf.createdAt,
      processedAt: tf.processedAt
    }));
    
    const transfersCSV = arrayToCSV(transfersData, [
      'id', 'fromAccountId', 'fromAccountNumber', 'toAccountId', 'toAccountNumber',
      'amount', 'currency', 'description', 'status', 'approvalStatus',
      'createdAt', 'processedAt'
    ]);
    
      fs.writeFileSync(path.join(exportPath, 'transfers.csv'), transfersCSV);
      console.log(`   ✅ Exported ${transfers.length} transfers`);
    } catch (error) {
      console.log(`   ⚠️ Transfers table not found or error: ${error.message}`);
    }

    // 7. Export Support Tickets (if table exists)
    console.log('7️⃣ Exporting Support Tickets...');
    let tickets = [];
    try {
      tickets = await prisma.supportTicket.findMany({
      include: {
        user: {
          select: { email: true }
        }
      }
    });
    
    const ticketsData = tickets.map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      userId: ticket.userId,
      userEmail: ticket.user.email,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      resolvedAt: ticket.resolvedAt
    }));
    
    const ticketsCSV = arrayToCSV(ticketsData, [
      'id', 'ticketNumber', 'userId', 'userEmail', 'subject', 'category',
      'priority', 'status', 'createdAt', 'updatedAt', 'resolvedAt'
    ]);
    
      fs.writeFileSync(path.join(exportPath, 'support_tickets.csv'), ticketsCSV);
      console.log(`   ✅ Exported ${tickets.length} support tickets`);
    } catch (error) {
      console.log(`   ⚠️ Support tickets table not found or error: ${error.message}`);
    }

    // 8. Export Audit Logs (if table exists)
    console.log('8️⃣ Exporting Audit Logs...');
    let auditLogs = [];
    try {
      auditLogs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: { email: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 10000 // Limit to last 10,000 logs
    });
    
    const logsData = auditLogs.map(log => ({
      id: log.id,
      userId: log.userId,
      userEmail: log.user?.email || 'N/A',
      action: log.action,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      timestamp: log.timestamp
    }));
    
    const logsCSV = arrayToCSV(logsData, [
      'id', 'userId', 'userEmail', 'action', 'ipAddress', 'userAgent', 'timestamp'
    ]);
    
      fs.writeFileSync(path.join(exportPath, 'audit_logs.csv'), logsCSV);
      console.log(`   ✅ Exported ${auditLogs.length} audit logs (last 10,000)`);
    } catch (error) {
      console.log(`   ⚠️ Audit logs table not found or error: ${error.message}`);
    }

    // Create summary file
    console.log('\n📄 Creating summary...');
    const summary = `DATABASE EXPORT SUMMARY
Generated: ${new Date().toISOString()}
Export Path: ${exportPath}

TABLES EXPORTED:
- Users: ${users.length} records
- Security Questions: ${securityQuestions.length} records
- Accounts: ${accounts.length} records
- Transactions: ${transactions.length} records
- Cards: ${cards.length} records
- Transfers: ${transfers.length} records
- Support Tickets: ${tickets.length} records
- Audit Logs: ${auditLogs.length} records (last 10,000)

SECURITY NOTES:
- User passwords are NOT exported
- Security question answer hashes are NOT exported
- Card CVV numbers are NOT exported

FILES CREATED:
- users.csv
- security_questions.csv
- accounts.csv
- transactions.csv
- cards.csv
- transfers.csv
- support_tickets.csv
- audit_logs.csv
- SUMMARY.txt (this file)
`;

    fs.writeFileSync(path.join(exportPath, 'SUMMARY.txt'), summary);
    
    console.log('\n✅ EXPORT COMPLETE!');
    console.log('===================');
    console.log(`📁 Location: ${exportPath}`);
    console.log('\n📊 Files created:');
    console.log('   - users.csv');
    console.log('   - security_questions.csv');
    console.log('   - accounts.csv');
    console.log('   - transactions.csv');
    console.log('   - cards.csv');
    console.log('   - transfers.csv');
    console.log('   - support_tickets.csv');
    console.log('   - audit_logs.csv');
    console.log('   - SUMMARY.txt');
    
    console.log('\n🔒 Security: Passwords, answer hashes, and CVVs excluded');
    console.log('\n💡 Tip: Open CSV files in Excel or any spreadsheet application');

  } catch (error) {
    console.error('❌ Error exporting database:', error);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

exportDatabase();
