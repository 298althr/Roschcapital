import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'brianmerker3@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: { securityQuestions: true }
  });
  
  if (!user) {
    console.log('❌ User not found:', email);
    return;
  }
  
  // Update password
  const newPassword = await bcrypt.hash('emilokan1122', 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: newPassword }
  });
  console.log('✅ Password updated to: emilokan1122');
  
  // Update security questions
  const newAnswers = ['jax', 'miami', 'gigi'];
  const questions = user.securityQuestions;
  
  for (let i = 0; i < questions.length && i < newAnswers.length; i++) {
    const hashedAnswer = await bcrypt.hash(newAnswers[i].toLowerCase().trim(), 10);
    await prisma.securityQuestion.update({
      where: { id: questions[i].id },
      data: { answerHash: hashedAnswer }
    });
    console.log(`✅ Security Q${i+1} answer updated to: ${newAnswers[i]}`);
  }
  
  console.log('\n🎉 Brian Merker credentials updated!');
  console.log('   Email: brianmerker3@gmail.com');
  console.log('   Password: emilokan1122');
  console.log('   Security Q1: jax');
  console.log('   Security Q2: miami');
  console.log('   Security Q3: gigi');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
