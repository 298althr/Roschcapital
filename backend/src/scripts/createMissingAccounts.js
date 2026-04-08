import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createMissingAccounts() {
  try {
    console.log('Finding users without accounts...');
    
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        accounts: true
      }
    });

    let created = 0;
    
    for (const user of users) {
      // Check if user has no accounts
      if (user.accounts.length === 0) {
        console.log(`Creating account for user: ${user.email}`);
        
        // Use existing accountNumber or generate new one
        let accountNumber = user.accountNumber;
        if (!accountNumber) {
          const randomDigits = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
          accountNumber = `00${randomDigits}`;
          
          // Update user with account number
          await prisma.user.update({
            where: { id: user.id },
            data: { accountNumber }
          });
        }
        
        // Create primary account
        await prisma.account.create({
          data: {
            userId: user.id,
            accountType: 'CHECKING',
            accountNumber: accountNumber,
            balance: 0,
            isPrimary: true
          }
        });
        
        created++;
      }
    }
    
    console.log(`✅ Created ${created} accounts for users without accounts`);
    console.log(`Total users: ${users.length}`);
    
  } catch (error) {
    console.error('Error creating accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingAccounts();
