import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createBackupCode() {
  try {
    const wilkin = await prisma.user.findFirst({
      where: { email: 'wilkinhha@gmail.com' }
    });
    
    if (!wilkin) {
      console.error('Wilkin not found');
      return;
    }
    
    // Create a simple backup code
    const code = '345678';
    const codeHash = await bcrypt.hash(code, 10);
    
    const backupCode = await prisma.backupCode.create({
      data: {
        userId: wilkin.id,
        codeHash: codeHash,
        used: false
      }
    });
    
    console.log('✅ Backup code created:', code);
    console.log('   Code ID:', backupCode.id);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createBackupCode();
