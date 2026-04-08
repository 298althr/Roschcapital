import prisma from '../config/prisma.js';



async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        accountStatus: true,
        kycStatus: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log('\n📋 All Users in Database:\n');
    console.log('Total users:', users.length);
    console.log('─'.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Admin: ${user.isAdmin ? '✅ YES' : '❌ NO'}`);
      console.log(`   Status: ${user.accountStatus}`);
      console.log(`   KYC: ${user.kycStatus}`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
    });
    
    console.log('\n' + '─'.repeat(80));
    console.log(`\nAdmin users: ${users.filter(u => u.isAdmin).length}`);
    console.log(`Non-admin users: ${users.filter(u => !u.isAdmin).length}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
