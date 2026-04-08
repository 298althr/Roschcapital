const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generate a unique 12-digit account number starting with 00
 * Format: 00XXXXXXXXXX (00 + 10 random digits)
 */
async function generateAccountNumber() {
  let accountNumber;
  let isUnique = false;

  while (!isUnique) {
    // Generate 10 random digits
    const randomDigits = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    accountNumber = `00${randomDigits}`;

    // Check if this account number already exists
    const existing = await prisma.user.findUnique({
      where: { accountNumber }
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return accountNumber;
}

module.exports = { generateAccountNumber };
