/**
 * Script to authenticate as admin and call the user cloning API
 * Uses the production Railway database directly via Prisma
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL || 'postgresql://postgres:sFqCqKHQhTFBPXTVZTUxJSdpECTFVQZl@junction.proxy.rlwy.net:17662/railway'
});

async function cloneUserViaAPI() {
  const SOURCE_EMAIL = 'brokardw@gmail.com';
  const TARGET_EMAIL = 'brokardwilliams@gmail.com';

  console.log('\n🔐 Connecting to production database...');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Step 1: Find source user
    console.log(`\n📋 Step 1: Finding source user ${SOURCE_EMAIL}...`);
    const sourceUser = await prisma.user.findUnique({
      where: { email: SOURCE_EMAIL },
      include: {
        accounts: {
          include: {
            transactions: true,
            debitCards: true,
            loans: true,
            withdrawals: true
          }
        },
        kycDocuments: true,
        loans: true,
        deposits: true,
        cheques: true,
        debitCards: true,
        creditCards: true,
        transferRequests: true,
        beneficiaries: true,
        cardTransactions: true,
        supportTickets: {
          include: {
            messages: true
          }
        },
        withdrawals: true,
        recurringPayments: true
      }
    });

    if (!sourceUser) {
      throw new Error(`Source user not found: ${SOURCE_EMAIL}`);
    }

    const loginData = { user: sourceUser };

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginData.error || loginResponse.statusText}`);
    }

    console.log('✅ Step 1 login successful');

    // Step 2: Answer security question
    console.log('\n🔐 Step 2: Answering security question...');
    const step2Response = await fetch(`${API_BASE}/auth/login/step2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        answer: 'fluffy' // Admin's security answer
      })
    });

    const step2Data = await step2Response.json();

    if (!step2Response.ok) {
      throw new Error(`Step 2 failed: ${step2Data.error || step2Response.statusText}`);
    }

    const authToken = step2Data.token;
    console.log('✅ Authentication successful, got token');

    // Step 3: Call clone-user endpoint
    console.log(`\n🔄 Step 3: Cloning user from ${SOURCE_EMAIL} to ${TARGET_EMAIL}...`);
    const cloneResponse = await fetch(`${API_BASE}/mybanker/clone-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        sourceEmail: SOURCE_EMAIL,
        targetEmail: TARGET_EMAIL
      })
    });

    const cloneData = await cloneResponse.json();

    if (!cloneResponse.ok) {
      throw new Error(`Clone failed: ${cloneData.error || cloneResponse.statusText}`);
    }

    // Success!
    console.log('\n' + '='.repeat(60));
    console.log('✅ USER CLONING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`\n📊 Results:`);
    console.log(`   Source: ${SOURCE_EMAIL}`);
    console.log(`   Target: ${TARGET_EMAIL}`);
    console.log(`   New User ID: ${cloneData.newUserId}`);
    console.log(`\n📈 Cloned Data:`);
    console.log(`   ✅ Accounts: ${cloneData.stats.accounts}`);
    console.log(`   ✅ Transactions: ${cloneData.stats.transactions}`);
    console.log(`   ✅ Debit Cards: ${cloneData.stats.debitCards}`);
    console.log(`   ✅ Credit Cards: ${cloneData.stats.creditCards}`);
    console.log(`   ✅ KYC Documents: ${cloneData.stats.kycDocuments}`);
    console.log(`   ✅ Loans: ${cloneData.stats.loans}`);
    console.log(`   ✅ Beneficiaries: ${cloneData.stats.beneficiaries}`);
    console.log(`   ✅ Recurring Payments: ${cloneData.stats.recurringPayments}`);
    console.log(`\n⚠️  ${cloneData.note}`);
    console.log(`\n🔑 Login Credentials:`);
    console.log(`   Email: ${TARGET_EMAIL}`);
    console.log(`   Password: Same as ${SOURCE_EMAIL}`);
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
cloneUserViaAPI()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
