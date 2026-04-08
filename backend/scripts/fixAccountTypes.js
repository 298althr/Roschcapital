import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fix account types for both Brokard Williams users
 * Should be: CHECKING, CRYPTO_WALLET, SAVINGS
 */
async function fixAccountTypes() {
  console.log('\n🔧 Fixing account types for Brokard Williams users...');

  try {
    // Find both Brokard Williams users
    const brokardUsers = await prisma.user.findMany({
      where: {
        firstName: 'Brokard',
        lastName: 'Williams'
      },
      include: {
        accounts: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    console.log(`\n📊 Found ${brokardUsers.length} Brokard Williams users`);

    for (const user of brokardUsers) {
      console.log(`\n👤 Processing: ${user.email}`);
      console.log(`   Accounts: ${user.accounts.length}`);

      if (user.accounts.length !== 3) {
        console.log(`   ⚠️  Skipped: Expected 3 accounts, found ${user.accounts.length}`);
        continue;
      }

      const [account1, account2, account3] = user.accounts;

      console.log(`\n   Current account types:`);
      console.log(`   1. ${account1.accountNumber}: ${account1.accountType}`);
      console.log(`   2. ${account2.accountNumber}: ${account2.accountType}`);
      console.log(`   3. ${account3.accountNumber}: ${account3.accountType}`);

      // Update to: CHECKING, CRYPTO_WALLET, SAVINGS
      await prisma.account.update({
        where: { id: account1.id },
        data: { accountType: 'CHECKING' }
      });

      await prisma.account.update({
        where: { id: account2.id },
        data: { accountType: 'CRYPTO_WALLET' }
      });

      await prisma.account.update({
        where: { id: account3.id },
        data: { accountType: 'SAVINGS' }
      });

      console.log(`\n   ✅ Updated account types:`);
      console.log(`   1. ${account1.accountNumber}: ${account1.accountType} → CHECKING`);
      console.log(`   2. ${account2.accountNumber}: ${account2.accountType} → CRYPTO_WALLET`);
      console.log(`   3. ${account3.accountNumber}: ${account3.accountType} → SAVINGS`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ACCOUNT TYPES FIXED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\nAll Brokard Williams users now have:');
    console.log('  1. CHECKING account');
    console.log('  2. CRYPTO_WALLET account');
    console.log('  3. SAVINGS account');
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error fixing account types:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixAccountTypes()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
