import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCardPins() {
  console.log('Starting card PIN migration...');

  try {
    // Update all debit cards without PIN
    const debitResult = await prisma.debitCard.updateMany({
      where: {
        OR: [
          { pin: null },
          { pin: '' }
        ]
      },
      data: {
        pin: '1234'
      }
    });

    console.log(`✅ Updated ${debitResult.count} debit cards with default PIN 1234`);

    // Update all credit cards without PIN
    const creditResult = await prisma.creditCard.updateMany({
      where: {
        OR: [
          { pin: null },
          { pin: '' }
        ]
      },
      data: {
        pin: '1234'
      }
    });

    console.log(`✅ Updated ${creditResult.count} credit cards with default PIN 1234`);
    console.log(`\n✅ Migration complete! Total cards updated: ${debitResult.count + creditResult.count}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateCardPins()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
