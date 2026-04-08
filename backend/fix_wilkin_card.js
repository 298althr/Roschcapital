import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixWilkinCard() {
  try {
    console.log('🔧 Fixing Wilkin Jammy card and password...');
    
    // Find Wilkin
    const wilkin = await prisma.user.findFirst({
      where: { email: 'wilkinhha@gmail.com' }
    });
    
    if (!wilkin) {
      console.error('❌ Wilkin not found!');
      return;
    }
    
    console.log('✅ Found Wilkin:', wilkin.email);
    
    // Reset password to Password123!
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    await prisma.user.update({
      where: { id: wilkin.id },
      data: { password: hashedPassword }
    });
    console.log('✅ Password reset to: Password123!');
    
    // Find Wilkin's credit card
    const creditCard = await prisma.creditCard.findFirst({
      where: { userId: wilkin.id }
    });
    
    if (!creditCard) {
      console.log('❌ No credit card found for Wilkin');
      return;
    }
    
    console.log('📇 Credit Card found:', creditCard.id);
    console.log('   Current status:', creditCard.status);
    console.log('   Current approvalStatus:', creditCard.approvalStatus);
    
    // Update both status fields to APPROVED/ACTIVE
    const updated = await prisma.creditCard.update({
      where: { id: creditCard.id },
      data: {
        status: 'ACTIVE',
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
        isActive: true
      }
    });
    
    console.log('✅ Credit card updated!');
    console.log('   New status:', updated.status);
    console.log('   New approvalStatus:', updated.approvalStatus);
    console.log('   Approved at:', updated.approvedAt);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixWilkinCard()
  .then(() => {
    console.log('\n🎉 Done! Wilkin can now login and see approved card');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
