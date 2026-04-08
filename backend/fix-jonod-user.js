// Fix jonod user - reset password and security questions
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const DEFAULT_SECURITY_QUESTIONS = [
  { question: "What was the name of your first pet?", answer: 'fluffy' },
  { question: "In what city were you born?", answer: 'london' },
  { question: "What is your mother's maiden name?", answer: 'smith' }
];

async function fixJonodUser() {
  console.log('🔧 Fixing jonod@gmail.com user...\n');

  try {
    // Find jonod
    const jonod = await prisma.user.findUnique({
      where: { email: 'jonod@gmail.com' }
    });

    if (!jonod) {
      console.log('❌ User jonod@gmail.com not found!');
      return;
    }

    console.log(`✅ Found user: ${jonod.email} (ID: ${jonod.id})`);

    // 1. Update password
    console.log('\n1️⃣ Updating password to "Password123!"...');
    const newPasswordHash = bcrypt.hashSync('Password123!', 10);
    await prisma.user.update({
      where: { id: jonod.id },
      data: { 
        password: newPasswordHash,
        accountStatus: 'ACTIVE' // Also fix status from LIMITED to ACTIVE
      }
    });
    console.log('✅ Password updated');

    // 2. Delete old security questions
    console.log('\n2️⃣ Deleting old security questions...');
    const deleted = await prisma.securityQuestion.deleteMany({
      where: { userId: jonod.id }
    });
    console.log(`✅ Deleted ${deleted.count} old questions`);

    // 3. Create new security questions
    console.log('\n3️⃣ Creating new security questions...');
    const questions = DEFAULT_SECURITY_QUESTIONS.map((item) => ({
      id: uuidv4(),
      userId: jonod.id,
      question: item.question,
      answerHash: bcrypt.hashSync(item.answer.toLowerCase(), 10),
      createdAt: new Date()
    }));

    await prisma.securityQuestion.createMany({ data: questions });
    console.log(`✅ Created ${questions.length} security questions:`);
    questions.forEach((q, idx) => {
      const answer = DEFAULT_SECURITY_QUESTIONS[idx].answer;
      console.log(`   ${idx + 1}. ${q.question} → ${answer}`);
    });

    // 4. Verify the fix
    console.log('\n4️⃣ Verifying fix...');
    
    // Test password
    const user = await prisma.user.findUnique({
      where: { id: jonod.id }
    });
    const passwordOk = await bcrypt.compare('Password123!', user.password);
    console.log(`   Password: ${passwordOk ? '✅ Correct' : '❌ Still wrong'}`);
    console.log(`   Status: ${user.accountStatus}`);

    // Test security questions
    const newQuestions = await prisma.securityQuestion.findMany({
      where: { userId: jonod.id }
    });
    console.log(`   Security Questions: ${newQuestions.length} questions`);

    // Test answers
    for (const answer of ['fluffy', 'london', 'smith']) {
      let matched = false;
      for (const q of newQuestions) {
        const isValid = await bcrypt.compare(answer.toLowerCase(), q.answerHash);
        if (isValid) {
          matched = true;
          break;
        }
      }
      console.log(`   Answer "${answer}": ${matched ? '✅ Valid' : '❌ Invalid'}`);
    }

    console.log('\n✅ Fix complete! jonod@gmail.com is now ready to use.');
    console.log('\n📧 Credentials:');
    console.log('   Email: jonod@gmail.com');
    console.log('   Password: Password123!');
    console.log('   Security Answers: fluffy, london, smith');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixJonodUser();
