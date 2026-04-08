import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function setAdmin() {
  try {
    const user = await prisma.user.update({
      where: { email: 'gonnyzalowski@gmail.com' },
      data: { isAdmin: true }
    });
    console.log('✅ Admin set successfully for:', user.email);
  } catch (error) {
    console.error('Error setting admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setAdmin();
