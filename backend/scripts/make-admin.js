import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  try {
    console.log('Making gonnyzalowski@gmail.com an admin...');
    
    const result = await prisma.$executeRaw`
      UPDATE users 
      SET "isAdmin" = true 
      WHERE email = 'gonnyzalowski@gmail.com'
    `;
    
    console.log(`✅ Updated ${result} user(s)`);
    
    // Verify the change
    const user = await prisma.user.findUnique({
      where: { email: 'gonnyzalowski@gmail.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        accountStatus: true,
        kycStatus: true
      }
    });
    
    console.log('\n📋 User details:');
    console.log(user);
    
    if (user?.isAdmin) {
      console.log('\n✅ SUCCESS! User is now an admin.');
    } else {
      console.log('\n❌ User not found or not updated.');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
