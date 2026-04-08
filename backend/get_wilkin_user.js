import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getWilkinUser() {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: 'Wilkin', mode: 'insensitive' } },
          { lastName: { contains: 'Jammy', mode: 'insensitive' } },
          { email: { contains: 'wilkin', mode: 'insensitive' } },
          { email: { contains: 'jammy', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });
    
    console.log('Found users:', users);
    
    if (users.length === 0) {
      console.log('\nNo user found with name Wilkin Jammy');
      console.log('Listing all users:');
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        },
        take: 10
      });
      console.log(allUsers);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getWilkinUser();
