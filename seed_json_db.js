import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'backend/data');

async function seed() {
  const usersPath = path.join(DATA_DIR, 'users.json');
  const accountsPath = path.join(DATA_DIR, 'accounts.json');
  const currenciesPath = path.join(DATA_DIR, 'currencies.json');
  const bankListPath = path.join(DATA_DIR, 'bank_list.json');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = {
    id: 'admin_initial',
    email: 'admin@roschcapital.com',
    password: hashedPassword,
    firstName: 'System',
    lastName: 'Admin',
    isAdmin: true,
    accountStatus: 'ACTIVE',
    kycStatus: 'VERIFIED',
    routingNumber: '604003001',
    accountNumber: '0012345678',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const adminAccount = {
    id: 'admin_acc_1',
    userId: 'admin_initial',
    accountType: 'SAVINGS',
    accountNumber: '7000000001',
    balance: 1000000.00,
    availableBalance: 1000000.00,
    pendingBalance: 0.00,
    accountName: 'Treasury Account',
    currency: 'USD',
    isActive: true,
    isPrimary: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const currencies = [
    { id: 'cur_usd', code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1.0, isBase: true, isActive: true },
    { id: 'cur_eur', code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.92, isBase: false, isActive: true },
    { id: 'cur_gbp', code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.79, isBase: false, isActive: true }
  ];

  const banks = [
    { id: 'bank_1', bankName: 'Rosch Capital Main', routingNumber: '604003000', swiftCode: 'ROSCUSB3', isActive: true },
    { id: 'bank_2', bankName: 'JPMorgan Chase', routingNumber: '021000021', swiftCode: 'CHASUS33', isActive: true }
  ];

  fs.writeFileSync(usersPath, JSON.stringify([adminUser], null, 2));
  fs.writeFileSync(accountsPath, JSON.stringify([adminAccount], null, 2));
  fs.writeFileSync(currenciesPath, JSON.stringify(currencies, null, 2));
  fs.writeFileSync(bankListPath, JSON.stringify(banks, null, 2));

  console.log('✅ Seeded Admin User: admin@roschcapital.com / admin123');
  console.log('✅ Seeded Currencies and Bank List');
}

seed();
