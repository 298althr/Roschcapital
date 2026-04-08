import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fix all crypto wallet addresses to match Brian Merker's wallet
 */
async function fixCryptoWallets() {
  console.log('\n🔧 Fixing crypto wallet addresses...');

  try {
    // Brian Merker's correct wallet info
    const CORRECT_ACCOUNT_NUMBER = 'bc1q7m8m6ufptvqlt7jer92d480y78jckyrzy0t6f7';
    const CORRECT_CRYPTO_ADDRESS = 'USDT144BBD7060AC47BA9446AA07597BD5';

    // Find all crypto wallet accounts
    const cryptoWallets = await prisma.account.findMany({
      where: {
        accountType: 'CRYPTO_WALLET'
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log(`\n📊 Found ${cryptoWallets.length} crypto wallets`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const wallet of cryptoWallets) {
      const userName = `${wallet.user.firstName} ${wallet.user.lastName}`;
      
      // Check if wallet already has correct address
      if (wallet.accountNumber === CORRECT_ACCOUNT_NUMBER && 
          wallet.cryptoAddress === CORRECT_CRYPTO_ADDRESS) {
        console.log(`   ✓ ${userName} - Already correct`);
        skippedCount++;
        continue;
      }

      // Update the wallet
      await prisma.account.update({
        where: { id: wallet.id },
        data: {
          accountNumber: CORRECT_ACCOUNT_NUMBER,
          cryptoAddress: CORRECT_CRYPTO_ADDRESS
        }
      });

      console.log(`   ✅ ${userName} - Updated`);
      console.log(`      Old: ${wallet.accountNumber}`);
      console.log(`      New: ${CORRECT_ACCOUNT_NUMBER}`);
      updatedCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ CRYPTO WALLET FIX COMPLETED!');
    console.log('='.repeat(60));
    console.log(`\n📈 Summary:`);
    console.log(`   Total wallets: ${cryptoWallets.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Already correct: ${skippedCount}`);
    console.log(`\n✓ All crypto wallets now have Brian Merker's address:`);
    console.log(`   ${CORRECT_ACCOUNT_NUMBER}`);
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error fixing crypto wallets:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixCryptoWallets()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
