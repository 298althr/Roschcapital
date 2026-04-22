import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const usersPath = 'c:/Users/Sav-Dev/Documents/roschcapital/backend/data/users.json';
const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

const bankerEmail = 'banker@roschcapital.com';
const bankerPassword = 'Banker2024!';
const passHash = bcrypt.hashSync(bankerPassword, 10);

const banker = {
  id: `usr_banker_${crypto.randomBytes(4).toString('hex')}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  email: bankerEmail,
  password: passHash,
  firstName: 'Senior',
  lastName: 'Banker',
  isAdmin: true,
  accountStatus: 'ACTIVE',
  kycStatus: 'VERIFIED',
  routingNumber: '604003001',
  accountNumber: '0010000001'
};

// Check if banker already exists
if (!users.find(u => u.email === bankerEmail)) {
  users.push(banker);
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  console.log('✅ Banker user created successfully');
} else {
  console.log('ℹ️ Banker user already exists');
}
