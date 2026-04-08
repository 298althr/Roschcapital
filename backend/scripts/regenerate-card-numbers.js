import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate card number with specific prefix
function generateCardNumber(prefix) {
  // prefix is 4 digits (4062 for debit, 5175 for credit)
  // Generate remaining 12 digits
  let remaining = '';
  for (let i = 0; i < 12; i++) {
    remaining += Math.floor(Math.random() * 10);
  }
  return prefix + remaining;
}

// Generate CVV
function generateCVV() {
  return String(Math.floor(100 + Math.random() * 900));
}

// Generate expiry date (3 years from now) as DateTime
function generateExpiryDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 3);
  return date;
}

async function regenerateCardNumbers() {
  try {
    console.log('Starting card number regeneration...');
    
    // Update all debit cards with 4062 prefix
    const debitCards = await prisma.debitCard.findMany();
    console.log(`Found ${debitCards.length} debit cards`);
    
    for (const card of debitCards) {
      const newCardNumber = generateCardNumber('4062');
      const newCVV = generateCVV();
      const newExpiry = generateExpiryDate();
      
      await prisma.debitCard.update({
        where: { id: card.id },
        data: {
          cardNumber: newCardNumber,
          cvv: newCVV,
          expiryDate: newExpiry
        }
      });
      
      console.log(`Updated debit card ${card.id}: ${newCardNumber}`);
    }
    
    // Update all credit cards with 5175 prefix
    const creditCards = await prisma.creditCard.findMany();
    console.log(`Found ${creditCards.length} credit cards`);
    
    for (const card of creditCards) {
      const newCardNumber = generateCardNumber('5175');
      const newCVV = generateCVV();
      const newExpiry = generateExpiryDate();
      
      await prisma.creditCard.update({
        where: { id: card.id },
        data: {
          cardNumber: newCardNumber,
          cvv: newCVV,
          expiryDate: newExpiry
        }
      });
      
      console.log(`Updated credit card ${card.id}: ${newCardNumber}`);
    }
    
    console.log('✅ Card number regeneration complete!');
  } catch (error) {
    console.error('Error regenerating card numbers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

regenerateCardNumbers();
