import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'gonnyzalowski@gmail.com';
  const newAnswer = process.argv[3] || 'tyga';
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: { securityQuestions: true }
  });
  
  if (!user) {
    console.log('❌ User not found:', email);
    return;
  }
  
  const hashedAnswer = await bcrypt.hash(newAnswer.toLowerCase().trim(), 10);
  
  await prisma.securityQuestion.updateMany({
    where: { userId: user.id },
    data: { answerHash: hashedAnswer }
  });
  
  console.log(`✅ Security answer updated for ${email}`);
  console.log(`   New answer: ${newAnswer}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
