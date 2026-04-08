import { PrismaClient } from '@prisma/client';
import { generateCryptoWalletAddress, detectCryptoType } from '../src/utils/walletGenerator.js';

const prisma = new PrismaClient();

// Generate 10-digit account number starting with 7
const generateAccountNumber = () => {
  const randomDigits = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  return '7' + randomDigits;
};

async function fixAccountNumbers() {
  console.log('🔧 Starting account number standardization...\n');

  try {
    // Get all accounts
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        accountNumber: true,
        accountType: true,
        accountName: true,
        userId: true
      }
    });

    console.log(`📊 Found ${accounts.length} accounts to check\n`);

    let updatedCount = 0;
    let cryptoWalletCount = 0;
    let regularAccountCount = 0;

    for (const account of accounts) {
      let needsUpdate = false;
      let newAccountNumber = account.accountNumber;

      // Check if it's a crypto wallet
      if (account.accountType === 'CRYPTO_WALLET') {
        // Check if it has a proper crypto address format
        const isBitcoinAddress = account.accountNumber.startsWith('bc1');
        const isEthereumAddress = account.accountNumber.startsWith('0x') && account.accountNumber.length === 42;
        
        if (!isBitcoinAddress && !isEthereumAddress) {
          // Generate proper crypto wallet address
          const cryptoType = detectCryptoType(account.accountName);
          newAccountNumber = generateCryptoWalletAddress(cryptoType);
          needsUpdate = true;
          cryptoWalletCount++;
          console.log(`🔐 Crypto Wallet: ${account.accountNumber} → ${newAccountNumber}`);
        }
      } else {
        // Regular account (CHECKING, SAVINGS, BUSINESS)
        // Check if it follows the 7XXXXXXXXX format (10 digits starting with 7)
        const isValidFormat = /^7\d{9}$/.test(account.accountNumber);
        
        if (!isValidFormat) {
          newAccountNumber = generateAccountNumber();
          needsUpdate = true;
          regularAccountCount++;
          console.log(`🏦 ${account.accountType}: ${account.accountNumber} → ${newAccountNumber}`);
        }
      }

      // Update if needed
      if (needsUpdate) {
        await prisma.account.update({
          where: { id: account.id },
          data: { accountNumber: newAccountNumber }
        });
        updatedCount++;
      }
    }

    console.log('\n✅ Account standardization complete!');
    console.log(`📈 Summary:`);
    console.log(`   - Total accounts checked: ${accounts.length}`);
    console.log(`   - Accounts updated: ${updatedCount}`);
    console.log(`   - Crypto wallets fixed: ${cryptoWalletCount}`);
    console.log(`   - Regular accounts fixed: ${regularAccountCount}`);
    console.log(`   - Already compliant: ${accounts.length - updatedCount}`);

  } catch (error) {
    console.error('❌ Error fixing account numbers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixAccountNumbers()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
