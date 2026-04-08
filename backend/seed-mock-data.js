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

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

async function run() {
  console.log('🌱 Starting comprehensive mathematical data seed (27 Users)...');

  const passHash = await bcrypt.hash('Password123!', 10);
  const now = new Date();

  // 1. Generate precisely 27 distinct users
  for(let i=0; i<27; i++) {
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

    // 2. Mathematically sound Base Account
    const checkingAcc = await prisma.account.create({
      data: {
        userId,
        accountType: 'CHECKING',
        accountNumber: `CHK${randomAmount(1000, 9999)}`,
        balance: 0,
        availableBalance: 0,
        pendingBalance: 0,
        accountName: 'Primary Checking',
        currency: 'USD',
        isActive: true,
        isPrimary: true
      }
    });

    // 3. Transactions - Mathematically strict timeline simulation
    const txCount = randomAmount(25, 45);
    let cumulativeBalance = 0;
    
    // Inject starting anchor balance
    const startDeposit = randomAmount(5000, 25000);
    cumulativeBalance += startDeposit;
    await prisma.transaction.create({
        data: {
          userId,
          accountId: checkingAcc.id,
          amount: startDeposit,
          type: 'CREDIT',
          description: `Initial Payroll Setup`,
          status: 'COMPLETED',
          reference: `REF${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
          createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()
        }
    });

    for (let t=0; t<txCount; t++) {
      const isDeposit = Math.random() > 0.7;
      let amt = 0;
      let desc = '';
      
      if (isDeposit) {
          amt = randomAmount(500, 3000);
          cumulativeBalance += amt;
          desc = randomChoice(['Salary Deposit', 'External Transfer Credit', 'Dividend Payout']);
      } else {
          amt = randomAmount(20, 800);
          cumulativeBalance -= amt;
          desc = randomChoice(['POS Purchase Apple', 'Utility Electric', 'Supermarket', 'Amazon Shopping']);
      }
      
      await prisma.transaction.create({
        data: {
          userId,
          accountId: checkingAcc.id,
          amount: amt,
          type: isDeposit ? 'CREDIT' : 'DEBIT',
          description: desc,
          status: 'COMPLETED',
          reference: `REF${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
          createdAt: randomDate(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), now)
        }
      });
    }

    // Write deterministic ledger net balances
    checkingAcc.balance = cumulativeBalance;
    checkingAcc.availableBalance = cumulativeBalance;
    await prisma.account.update({ 
      where: { id: checkingAcc.id }, 
      data: { balance: cumulativeBalance, availableBalance: cumulativeBalance }
    });

    // Savings Account Allocation
    if (isVIP || Math.random() > 0.5) {
      const savBal = randomAmount(10000, 250000);
      await prisma.account.create({
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

    // 4. Heavy Financial Architecture Instantiation
    if (isVIP || Math.random() > 0.4) {
       await prisma.loan.create({
           data: {
             userId,
             loanNumber: `L${randomAmount(10000, 99999)}`,
             loanType: randomChoice(['PERSONAL', 'MORTGAGE', 'AUTO']),
             principalAmount: randomAmount(15000, 300000),
             remainingBalance: randomAmount(5000, 150000),
             interestRate: 5.5,
             termMonths: 72,
             monthlyPayment: randomAmount(250, 1500),
             status: randomChoice(['ACTIVE', 'PENDING']),
             nextPaymentDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString()
           }
       });
       
       await prisma.fixedDeposit.create({
           data: {
             userId,
             depositNumber: `FD${randomAmount(10000, 99999)}`,
             principalAmount: randomAmount(50000, 1500000),
             maturityAmount: randomAmount(55000, 1600000),
             interestRate: 4.5,
             termMonths: 12,
             interestPayout: 'MATURITY',
             status: 'ACTIVE',
             startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
             maturityDate: new Date(now.getTime() + 330 * 24 * 60 * 60 * 1000).toISOString()
           }
       });
    }

    // 5. Instantiating Cross-Institutional Requests
    if (Math.random() > 0.3) {
        await prisma.transferRequest.create({
            data: {
                userId,
                reference: `TX${randomAmount(10000, 99999)}`,
                type: 'EXTERNAL',
                amount: randomAmount(1000, 8000),
                currency: 'USD',
                destinationBank: randomChoice(['Chase Bank', 'Bank of America', 'Wells Fargo', 'Citibank', 'Barclays']),
                accountName: `${fn} ${ln}`,
                accountNumber: `********${randomAmount(1000, 9999)}`,
                routingNumber: '021000021',
                swiftCode: '',
                status: randomChoice(['PENDING', 'APPROVED', 'COMPLETED', 'DECLINED']),
                transferMethod: 'WIRE'
            }
        });
    }

    // 6. Security Identifiers and Access Interfaces
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

  // Explicit Alarm Simulation for Admin Dashboard Diagnostics
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
          description: `Login failed for ${adminAcc.email}: Geo-block active`,
          severity: 'MEDIUM',
          ipAddress: '109.22.45.1',
          createdAt: new Date().toISOString()
        }
     });
  }

  console.log('✅ Architecture completely built! Fully scaled robust 27 entity mockup constructed.');
}

run().catch(console.error);
