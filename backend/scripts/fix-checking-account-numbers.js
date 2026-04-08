import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCheckingAccountNumbers() {
  try {
    console.log('Starting checking account number migration...');
    
    // Get all checking accounts
    const checkingAccounts = await prisma.account.findMany({
      where: {
        accountType: 'CHECKING'
      }
    });
    
    console.log(`Found ${checkingAccounts.length} checking accounts`);
    
    for (const account of checkingAccounts) {
      const currentNumber = account.accountNumber;
      
      // Check if already in correct format (11 digits starting with 03)
      if (currentNumber && currentNumber.startsWith('03') && currentNumber.length === 11) {
        console.log(`Account ${currentNumber} already in correct format, skipping`);
        continue;
      }
      
      // Generate new 11-digit number starting with 03
      const randomNineDigits = Math.floor(100000000 + Math.random() * 900000000);
      const newAccountNumber = `03${randomNineDigits}`;
      
      await prisma.account.update({
        where: { id: account.id },
        data: { accountNumber: newAccountNumber }
      });
      
      console.log(`Updated account ${currentNumber} → ${newAccountNumber}`);
    }
    
    console.log('✅ Checking account number migration complete!');
  } catch (error) {
    console.error('Error fixing checking account numbers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixCheckingAccountNumbers();
