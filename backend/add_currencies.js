import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addCurrencies() {
  try {
    console.log('🚀 Adding currencies...');
    
    // 1. Add USD as base currency
    const usdExists = await prisma.currency.findUnique({
      where: { code: 'USD' }
    });
    
    if (!usdExists) {
      const usd = await prisma.currency.create({
        data: {
          code: 'USD',
          name: 'US Dollar',
          symbol: '$',
          type: 'FIAT',
          exchangeRate: 1.0,
          isBase: true,
          isActive: true,
          lastUpdated: new Date()
        }
      });
      console.log('✅ USD currency created:', usd.code);
    } else {
      console.log('✅ USD currency already exists');
    }
    
    // 2. Add Bitcoin currency
    const btcExists = await prisma.currency.findUnique({
      where: { code: 'BTC' }
    });
    
    if (!btcExists) {
      const btc = await prisma.currency.create({
        data: {
          code: 'BTC',
          name: 'Bitcoin',
          symbol: '₿',
          type: 'CRYPTO',
          exchangeRate: 86900.00, // 1 BTC = $86,900 USD
          isBase: false,
          isActive: true,
          lastUpdated: new Date()
        }
      });
      console.log('✅ Bitcoin currency created!');
      console.log('   Code:', btc.code);
      console.log('   Name:', btc.name);
      console.log('   Symbol:', btc.symbol);
      console.log('   Exchange Rate: $', btc.exchangeRate.toString(), 'USD per BTC');
    } else {
      console.log('✅ Bitcoin currency already exists');
    }
    
    // 3. Verify all currencies
    const allCurrencies = await prisma.currency.findMany({
      orderBy: { isBase: 'desc' }
    });
    
    console.log('\n📊 All Currencies:');
    allCurrencies.forEach(curr => {
      console.log(`   ${curr.code} (${curr.symbol}) - ${curr.name} - Rate: ${curr.exchangeRate} - ${curr.isActive ? 'Active' : 'Inactive'}`);
    });
    
    return allCurrencies;
  } catch (error) {
    console.error('❌ Error adding currencies:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addCurrencies()
  .then(() => {
    console.log('\n🎉 Done! Currencies are now available');
    console.log('Users can now toggle between USD and BTC in crypto accounts');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
