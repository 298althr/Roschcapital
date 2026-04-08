import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function addQRCode() {
  try {
    console.log('🚀 Adding QR code to Bitcoin gateway...');
    
    // Find Bitcoin gateway
    const gateway = await prisma.paymentGateway.findFirst({
      where: { name: 'Bitcoin' }
    });
    
    if (!gateway) {
      console.error('❌ Bitcoin gateway not found!');
      return;
    }
    
    console.log('✅ Found Bitcoin gateway:', gateway.id);
    
    // QR code source path
    const qrSourcePath = 'C:\\Users\\sayv\\Pictures\\Screenshots\\qrcode.png';
    
    // Check if QR code exists
    if (!fs.existsSync(qrSourcePath)) {
      console.error('❌ QR code file not found at:', qrSourcePath);
      return;
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, 'uploads', 'qr-codes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory');
    }
    
    // Copy QR code to uploads directory
    const qrFileName = `bitcoin-qr-${Date.now()}.png`;
    const qrDestPath = path.join(uploadsDir, qrFileName);
    fs.copyFileSync(qrSourcePath, qrDestPath);
    console.log('✅ QR code copied to:', qrDestPath);
    
    // Update gateway with QR code URL
    const qrCodeUrl = `/uploads/qr-codes/${qrFileName}`;
    const updated = await prisma.paymentGateway.update({
      where: { id: gateway.id },
      data: { qrCodeUrl }
    });
    
    console.log('✅ QR code added successfully!');
    console.log('QR Code URL:', updated.qrCodeUrl);
    
    return updated;
  } catch (error) {
    console.error('❌ Error adding QR code:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addQRCode()
  .then(() => {
    console.log('\n🎉 Done! QR code is now available for Bitcoin deposits');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
