import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addBitcoinGateway() {
  try {
    console.log('🚀 Adding Bitcoin payment gateway...');
    
    // Check if Bitcoin gateway already exists
    const existing = await prisma.paymentGateway.findFirst({
      where: { name: 'Bitcoin' }
    });
    
    if (existing) {
      console.log('✅ Bitcoin gateway already exists:', existing);
      return existing;
    }
    
    // Create Bitcoin gateway
    const gateway = await prisma.paymentGateway.create({
      data: {
        name: 'Bitcoin',
        type: 'CRYPTO',
        walletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        network: 'BTC',
        instructions: 'payment may take up to 24 hours',
        displayOrder: 1,
        isActive: true
      }
    });
    
    console.log('✅ Bitcoin gateway created successfully!');
    console.log('Gateway ID:', gateway.id);
    console.log('Name:', gateway.name);
    console.log('Wallet:', gateway.walletAddress);
    console.log('Network:', gateway.network);
    
    return gateway;
  } catch (error) {
    console.error('❌ Error adding Bitcoin gateway:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addBitcoinGateway()
  .then(() => {
    console.log('\n🎉 Done! Bitcoin is now available for deposits/withdrawals');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
