import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  const email = 'gonnyzalowski@gmail.com';
  
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!existingUser) {
      console.log('❌ User not found with email:', email);
      console.log('\n📝 Please register this user first at:');
      console.log('   https://roschcapital.com/register');
      console.log('\nThen run this script again.');
      return;
    }

    // Update user to admin
    const user = await prisma.user.update({
      where: { email },
      data: { isAdmin: true }
    });

    console.log('✅ User updated successfully!');
    console.log('Email:', user.email);
    console.log('Name:', user.firstName, user.lastName);
    console.log('Is Admin:', user.isAdmin);
    console.log('\n✅ User is now an admin!');
    console.log('\n📌 Next steps:');
    console.log('1. Log out from the website');
    console.log('2. Log back in');
    console.log('3. Try accessing /mybanker');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
