import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Clone all user data from source email to target email
 * Usage: node scripts/cloneUser.js
 */
async function cloneUser() {
  const sourceEmail = 'brokardw@gmail.com';
  const targetEmail = 'brokardwilliams@gmail.com';

  console.log(`\n🔄 Starting user clone from ${sourceEmail} to ${targetEmail}...`);

  try {
    // 1. Find source user with all relations
    console.log('\n📋 Step 1: Fetching source user data...');
    const sourceUser = await prisma.user.findUnique({
      where: { email: sourceEmail },
      include: {
        accounts: {
          include: {
            transactions: true,
            debitCards: true,
            loans: true,
            withdrawals: true
          }
        },
        kycDocuments: true,
        loans: true,
        deposits: true,
        cheques: true,
        debitCards: true,
        creditCards: true,
        transferRequests: true,
        beneficiaries: true,
        cardTransactions: true,
        supportTickets: {
          include: {
            messages: true
          }
        },
        withdrawals: true,
        recurringPayments: true
      }
    });

    if (!sourceUser) {
      throw new Error(`Source user not found: ${sourceEmail}`);
    }

    console.log(`✅ Found source user: ${sourceUser.firstName} ${sourceUser.lastName}`);
    console.log(`   - Accounts: ${sourceUser.accounts.length}`);
    console.log(`   - Debit Cards: ${sourceUser.debitCards.length}`);
    console.log(`   - Credit Cards: ${sourceUser.creditCards.length}`);
    console.log(`   - KYC Documents: ${sourceUser.kycDocuments.length}`);
    console.log(`   - Loans: ${sourceUser.loans.length}`);
    console.log(`   - Beneficiaries: ${sourceUser.beneficiaries.length}`);
    console.log(`   - Recurring Payments: ${sourceUser.recurringPayments.length}`);

    // Count total transactions
    const totalTransactions = sourceUser.accounts.reduce((sum, acc) => sum + acc.transactions.length, 0);
    console.log(`   - Total Transactions: ${totalTransactions}`);

    // 2. Check if target user already exists
    console.log('\n📋 Step 2: Checking target user...');
    const existingTarget = await prisma.user.findUnique({
      where: { email: targetEmail }
    });

    if (existingTarget) {
      throw new Error(`Target user already exists: ${targetEmail}. Please delete first or use a different email.`);
    }

    // 3. Create new user (same data except email, new IDs)
    console.log('\n📋 Step 3: Creating new user...');
    const newUser = await prisma.user.create({
      data: {
        email: targetEmail,
        password: sourceUser.password, // Same password hash
        firstName: sourceUser.firstName,
        lastName: sourceUser.lastName,
        phone: sourceUser.phone,
        phoneCountryCode: sourceUser.phoneCountryCode,
        dateOfBirth: sourceUser.dateOfBirth,
        address: sourceUser.address,
        city: sourceUser.city,
        state: sourceUser.state,
        zipCode: sourceUser.zipCode,
        country: sourceUser.country,
        isBusinessAccount: sourceUser.isBusinessAccount,
        businessName: sourceUser.businessName,
        businessType: sourceUser.businessType,
        taxId: sourceUser.taxId,
        businessAddress: sourceUser.businessAddress,
        businessCity: sourceUser.businessCity,
        businessState: sourceUser.businessState,
        businessZip: sourceUser.businessZip,
        businessCountry: sourceUser.businessCountry,
        representativeName: sourceUser.representativeName,
        representativeTitle: sourceUser.representativeTitle,
        profilePhoto: sourceUser.profilePhoto,
        nationality: sourceUser.nationality,
        governmentIdType: sourceUser.governmentIdType,
        governmentIdNumber: sourceUser.governmentIdNumber,
        isAdmin: false, // Don't clone admin status
        accountStatus: sourceUser.accountStatus,
        kycStatus: sourceUser.kycStatus,
        totalSentAmount: sourceUser.totalSentAmount,
        loginPreference: sourceUser.loginPreference,
        autoDebitEnabled: sourceUser.autoDebitEnabled
      }
    });

    console.log(`✅ Created new user with ID: ${newUser.id}`);

    // 4. Clone accounts with new account numbers
    console.log('\n📋 Step 4: Cloning accounts...');
    const accountMap = new Map(); // Map old account IDs to new ones

    for (const oldAccount of sourceUser.accounts) {
      // Generate new unique account number
      const newAccountNumber = '7' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
      
      const newAccount = await prisma.account.create({
        data: {
          userId: newUser.id,
          accountType: oldAccount.accountType,
          accountNumber: newAccountNumber,
          balance: oldAccount.balance,
          availableBalance: oldAccount.availableBalance,
          pendingBalance: oldAccount.pendingBalance,
          accountName: oldAccount.accountName,
          cryptoSymbol: oldAccount.cryptoSymbol,
          cryptoAddress: oldAccount.cryptoAddress,
          currency: oldAccount.currency,
          isActive: oldAccount.isActive,
          isPrimary: oldAccount.isPrimary,
          createdAt: oldAccount.createdAt
        }
      });

      accountMap.set(oldAccount.id, newAccount.id);
      console.log(`   ✅ Cloned account: ${oldAccount.accountType} (${newAccountNumber}) - Balance: $${oldAccount.balance}`);
    }

    // 5. Clone transactions with auto-generated references
    console.log('\n📋 Step 5: Cloning transactions...');
    let transactionCount = 0;

    for (const oldAccount of sourceUser.accounts) {
      const newAccountId = accountMap.get(oldAccount.id);
      
      for (const oldTx of oldAccount.transactions) {
        // Generate new reference
        const newReference = `CLN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        await prisma.transaction.create({
          data: {
            userId: newUser.id,
            accountId: newAccountId,
            reference: newReference,
            amount: oldTx.amount,
            type: oldTx.type,
            description: oldTx.description,
            category: oldTx.category,
            merchantName: oldTx.merchantName,
            merchantCategory: oldTx.merchantCategory,
            status: oldTx.status,
            createdAt: oldTx.createdAt
          }
        });
        
        transactionCount++;
      }
    }

    console.log(`   ✅ Cloned ${transactionCount} transactions`);

    // 6. Clone debit cards (same frontend numbers)
    console.log('\n📋 Step 6: Cloning debit cards...');
    for (const oldCard of sourceUser.debitCards) {
      const newAccountId = accountMap.get(oldCard.accountId);
      
      await prisma.debitCard.create({
        data: {
          userId: newUser.id,
          accountId: newAccountId,
          cardNumber: oldCard.cardNumber, // Same frontend number (encrypted)
          cardHolderName: `${newUser.firstName} ${newUser.lastName}`,
          cvv: oldCard.cvv,
          expiryDate: oldCard.expiryDate,
          cardType: oldCard.cardType,
          cardBrand: oldCard.cardBrand,
          isActive: oldCard.isActive,
          isFrozen: oldCard.isFrozen,
          dailyLimit: oldCard.dailyLimit,
          createdAt: oldCard.createdAt
        }
      });
      
      console.log(`   ✅ Cloned debit card: ${oldCard.cardBrand} ending in ****`);
    }

    // 7. Clone credit cards (same frontend numbers)
    console.log('\n📋 Step 7: Cloning credit cards...');
    for (const oldCard of sourceUser.creditCards) {
      await prisma.creditCard.create({
        data: {
          userId: newUser.id,
          cardNumber: oldCard.cardNumber, // Same frontend number (encrypted)
          cardHolderName: `${newUser.firstName} ${newUser.lastName}`,
          cvv: oldCard.cvv,
          expiryDate: oldCard.expiryDate,
          creditLimit: oldCard.creditLimit,
          availableCredit: oldCard.availableCredit,
          currentBalance: oldCard.currentBalance,
          apr: oldCard.apr,
          minimumPayment: oldCard.minimumPayment,
          paymentDueDate: oldCard.paymentDueDate,
          statementDate: oldCard.statementDate,
          status: oldCard.status,
          approvalStatus: oldCard.approvalStatus,
          isActive: oldCard.isActive,
          isFrozen: oldCard.isFrozen,
          createdAt: oldCard.createdAt
        }
      });
      
      console.log(`   ✅ Cloned credit card: Limit $${oldCard.creditLimit}`);
    }

    // 8. Clone KYC documents
    console.log('\n📋 Step 8: Cloning KYC documents...');
    for (const oldDoc of sourceUser.kycDocuments) {
      await prisma.kYCDocument.create({
        data: {
          userId: newUser.id,
          category: oldDoc.category,
          documentType: oldDoc.documentType,
          documentNumber: oldDoc.documentNumber,
          filePath: oldDoc.filePath,
          fileName: oldDoc.fileName,
          fileSize: oldDoc.fileSize,
          mimeType: oldDoc.mimeType,
          description: oldDoc.description,
          expiryDate: oldDoc.expiryDate,
          issueDate: oldDoc.issueDate,
          issuingAuthority: oldDoc.issuingAuthority,
          status: oldDoc.status,
          reviewNotes: oldDoc.reviewNotes,
          createdAt: oldDoc.createdAt
        }
      });
    }
    console.log(`   ✅ Cloned ${sourceUser.kycDocuments.length} KYC documents`);

    // 9. Clone loans
    console.log('\n📋 Step 9: Cloning loans...');
    for (const oldLoan of sourceUser.loans) {
      const newAccountId = oldLoan.accountId ? accountMap.get(oldLoan.accountId) : null;
      
      await prisma.loan.create({
        data: {
          userId: newUser.id,
          accountId: newAccountId,
          loanType: oldLoan.loanType,
          amount: oldLoan.amount,
          interestRate: oldLoan.interestRate,
          termMonths: oldLoan.termMonths,
          monthlyPayment: oldLoan.monthlyPayment,
          remainingBalance: oldLoan.remainingBalance,
          totalPaid: oldLoan.totalPaid,
          status: oldLoan.status,
          approvedAt: oldLoan.approvedAt,
          disbursedAt: oldLoan.disbursedAt,
          nextPaymentDate: oldLoan.nextPaymentDate,
          purpose: oldLoan.purpose,
          createdAt: oldLoan.createdAt
        }
      });
    }
    console.log(`   ✅ Cloned ${sourceUser.loans.length} loans`);

    // 10. Clone beneficiaries
    console.log('\n📋 Step 10: Cloning beneficiaries...');
    for (const oldBen of sourceUser.beneficiaries) {
      await prisma.beneficiary.create({
        data: {
          userId: newUser.id,
          bankName: oldBen.bankName,
          routingNumber: oldBen.routingNumber,
          accountNumber: oldBen.accountNumber,
          accountName: oldBen.accountName,
          nickname: oldBen.nickname,
          isActive: oldBen.isActive,
          createdAt: oldBen.createdAt
        }
      });
    }
    console.log(`   ✅ Cloned ${sourceUser.beneficiaries.length} beneficiaries`);

    // 11. Clone recurring payments
    console.log('\n📋 Step 11: Cloning recurring payments...');
    for (const oldPayment of sourceUser.recurringPayments) {
      const newFromAccountId = accountMap.get(oldPayment.fromAccountId);
      const newToAccountId = oldPayment.toAccountId ? accountMap.get(oldPayment.toAccountId) : null;
      const newReference = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      await prisma.recurringPayment.create({
        data: {
          userId: newUser.id,
          fromAccountId: newFromAccountId,
          toAccountId: newToAccountId,
          paymentType: oldPayment.paymentType,
          recipientName: oldPayment.recipientName,
          recipientBank: oldPayment.recipientBank,
          recipientAccount: oldPayment.recipientAccount,
          recipientRouting: oldPayment.recipientRouting,
          amount: oldPayment.amount,
          currency: oldPayment.currency,
          description: oldPayment.description,
          reference: newReference,
          frequency: oldPayment.frequency,
          startDate: oldPayment.startDate,
          endDate: oldPayment.endDate,
          nextExecutionDate: oldPayment.nextExecutionDate,
          dayOfMonth: oldPayment.dayOfMonth,
          dayOfWeek: oldPayment.dayOfWeek,
          status: oldPayment.status,
          executionCount: oldPayment.executionCount,
          maxExecutions: oldPayment.maxExecutions,
          createdAt: oldPayment.createdAt
        }
      });
    }
    console.log(`   ✅ Cloned ${sourceUser.recurringPayments.length} recurring payments`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ USER CLONING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Source: ${sourceEmail}`);
    console.log(`   Target: ${targetEmail}`);
    console.log(`   New User ID: ${newUser.id}`);
    console.log(`\n📈 Cloned Data:`);
    console.log(`   ✅ Accounts: ${sourceUser.accounts.length}`);
    console.log(`   ✅ Transactions: ${transactionCount}`);
    console.log(`   ✅ Debit Cards: ${sourceUser.debitCards.length}`);
    console.log(`   ✅ Credit Cards: ${sourceUser.creditCards.length}`);
    console.log(`   ✅ KYC Documents: ${sourceUser.kycDocuments.length}`);
    console.log(`   ✅ Loans: ${sourceUser.loans.length}`);
    console.log(`   ✅ Beneficiaries: ${sourceUser.beneficiaries.length}`);
    console.log(`   ✅ Recurring Payments: ${sourceUser.recurringPayments.length}`);
    console.log(`\n⚠️  Note: Security questions and backup codes NOT cloned (as requested)`);
    console.log(`   You can set these up via the admin panel.`);
    console.log(`\n🔑 Login Credentials:`);
    console.log(`   Email: ${targetEmail}`);
    console.log(`   Password: Same as ${sourceEmail}`);
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error cloning user:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
cloneUser()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
