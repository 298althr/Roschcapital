import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupAdminSecurity() {
  try {
    const adminEmail = 'gonnyzalowski@gmail.com';
    
    // Find admin user
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Found admin user:', admin.email);

    // Check if security questions already exist
    const existingQuestions = await prisma.securityQuestion.findMany({
      where: { userId: admin.id }
    });

    if (existingQuestions.length > 0) {
      console.log('⚠️ Admin already has security questions. Deleting old ones...');
      await prisma.securityQuestion.deleteMany({
        where: { userId: admin.id }
      });
    }

    // Create 3 simple security questions with easy answers
    const questions = [
      { question: "What is your favorite color?", answer: "blue" },
      { question: "What city were you born in?", answer: "london" },
      { question: "What is your mother's maiden name?", answer: "smith" }
    ];

    console.log('\n📝 Creating security questions...');
    
    for (const q of questions) {
      const answerHash = await bcrypt.hash(q.answer.toLowerCase(), 10);
      await prisma.securityQuestion.create({
        data: {
          userId: admin.id,
          question: q.question,
          answerHash: answerHash
        }
      });
      console.log(`✅ Created: "${q.question}" - Answer: "${q.answer}"`);
    }

    console.log('\n🎉 Admin security setup complete!');
    console.log('\n📋 Your Login Credentials:');
    console.log('Email: gonnyzalowski@gmail.com');
    console.log('Password: [your password]');
    console.log('\n🔐 Security Question Answers:');
    console.log('1. What is your favorite color? → blue');
    console.log('2. What city were you born in? → london');
    console.log('3. What is your mother\'s maiden name? → smith');
    console.log('\n💡 Use any of these answers when logging in!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminSecurity();
