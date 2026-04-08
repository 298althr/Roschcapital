import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateRoutingNumbers() {
  try {
    console.log('Starting routing number population...');
    
    // Get all users without routing numbers
    const users = await prisma.user.findMany({
      where: {
        routingNumber: null
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`Found ${users.length} users without routing numbers`);
    
    let counter = 1;
    
    for (const user of users) {
      // Generate routing number in format 604003XXX where XXX is 001-999
      const suffix = String(counter).padStart(3, '0');
      const routingNumber = `604003${suffix}`;
      
      await prisma.user.update({
        where: { id: user.id },
        data: { routingNumber }
      });
      
      console.log(`Updated user ${user.email} with routing number: ${routingNumber}`);
      
      counter++;
      
      // Reset counter if it exceeds 999
      if (counter > 999) {
        counter = 1;
      }
    }
    
    console.log('✅ Routing number population complete!');
  } catch (error) {
    console.error('Error populating routing numbers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

populateRoutingNumbers();
