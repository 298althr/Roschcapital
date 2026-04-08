import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from './src/config/prisma.js';

const firstNames = ["James", "Emma", "Liam", "Olivia", "Noah", "Ava", "William", "Sophia", "Oliver", "Isabella", "Elias", "Mia", "Lucas", "Charlotte", "Mason", "Amelia", "Logan", "Harper", "Alexander", "Evelyn", "Michael", "Abigail", "Ethan", "Emily", "Daniel"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris"];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomAmount(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
  console.log('🌱 Starting comprehensive data seed...');

  const passHash = await bcrypt.hash('Password123!', 10);

  // 1. Generate 25 users
  for(let i=0; i<25; i++) {
    const fn = randomChoice(firstNames);
    const ln = randomChoice(lastNames);
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`;

    // Privilege & identity logic
    const isVIP = Math.random() > 0.8;
    const kycStatus = Math.random() > 0.3 ? 'VERIFIED' : 'PENDING';
    const accountStatus = Math.random() > 0.9 ? 'LIMITED' : 'ACTIVE';

    const reqUser = await prisma.user.create({
      data: {
        id: `usr_${crypto.randomBytes(6).toString('hex')}`,
        email,
        password: passHash,
        firstName: fn,
        lastName: ln,
        isAdmin: false,
        accountStatus,
        kycStatus,
        routingNumber: '604003001',
        accountNumber: `00${randomAmount(10000000, 99999999)}`,
      }
    });

    const userId = reqUser.id;

    // 2. Generate Accounts (1 Checking, 1 Savings usually)
    const chkBal = randomAmount(500, 15000);
    const checkingAcc = await prisma.account.create({
      data: {
        userId,
        accountType: 'CHECKING',
        accountNumber: `CHK${randomAmount(1000, 9999)}`,
        balance: chkBal,
        availableBalance: chkBal,
        pendingBalance: 0,
        accountName: 'Primary Checking',
        currency: 'USD',
        isActive: true,
        isPrimary: true
      }
    });

    let savBal = 0;
    let savAcc = null;
    if (isVIP || Math.random() > 0.5) {
      savBal = randomAmount(10000, 250000);
      savAcc = await prisma.account.create({
        data: {
          userId,
          accountType: 'SAVINGS',
          accountNumber: `SAV${randomAmount(1000, 9999)}`,
          balance: savBal,
          availableBalance: savBal,
          pendingBalance: 0,
          accountName: 'High Yield Savings',
          currency: 'USD',
          isActive: true,
          isPrimary: false
        }
      });
    }

    // 3. Transactions (approx 15-30 per user)
    const txCount = randomAmount(15, 30);
    let runningChk = chkBal;
    
    for (let t=0; t<txCount; t++) {
      const isDeposit = Math.random() > 0.6;
      const amt = randomAmount(10, 2000);
      
      const type = isDeposit ? 'CREDIT' : 'DEBIT';
      const desc = isDeposit ? 'Direct Deposit / Transfer' : 'POS Purchase / Bill Pay';
      
      await prisma.transaction.create({
        data: {
          userId,
          accountId: checkingAcc.id,
          amount: amt,
          type,
          description: `${desc} ${t+1}`,
          status: 'COMPLETED',
          reference: `REF${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
          createdAt: new Date(Date.now() - randomAmount(0, 30 * 24 * 60 * 60 * 1000)).toISOString() // past 30 days
        }
      });
    }

    // 4. Cards
    await prisma.debitCard.create({
      data: {
        userId,
        accountId: checkingAcc.id,
        cardNumber: `4${randomAmount(100000000000000, 999999999999999)}`,
        cardHolder: `${fn} ${ln}`,
        expiryMonth: '12',
        expiryYear: '2028',
        cvv: '123',
        status: 'ACTIVE'
      }
    });

    // 5. KYC Docs if PENDING
    if (kycStatus === 'PENDING') {
      await prisma.kycDocument.create({
        data: {
          userId,
          documentType: 'PASSPORT',
          fileUrl: '/uploads/sample_doc.jpg',
          status: 'PENDING'
        }
      });
    }

    // 6. Audit Logs
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGIN',
        description: `User ${email} securely logged in via web platform`,
        severity: 'LOW',
        ipAddress: '192.168.1.4',
        createdAt: new Date(Date.now() - randomAmount(0, 1000000)).toISOString()
      }
    });
  }

  // Create an explicit SUSPICIOUS_ACTIVITY log for the admin to see
  const adminAcc = prisma.user._read().find(u => u.isAdmin);
  if (adminAcc) {
     await prisma.auditLog.create({
        data: {
          userId: adminAcc.id,
          action: 'SUSPICIOUS_ACTIVITY',
          description: `Multiple failed login attempts outside typical geo perimeter`,
          severity: 'HIGH',
          ipAddress: '109.22.45.1',
          createdAt: new Date().toISOString()
        }
     });
     
     await prisma.auditLog.create({
        data: {
          userId: adminAcc.id,
          action: 'FAILED_LOGIN',
          description: `Login failed for ${adminAcc.email}: Invalid password`,
          severity: 'MEDIUM',
          ipAddress: '109.22.45.1',
          createdAt: new Date().toISOString()
        }
     });
  }

  console.log('✅ Value populated! Dashboard now has deep, extensive relational data.');
}

run().catch(console.error);
