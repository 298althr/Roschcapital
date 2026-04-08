import prisma from '../config/prisma.js';
import { validateRoutingNumber, validateAccountNumber, validateBankName, validateRecipientName } from '../utils/bankValidation.js';

/**
 * Create a beneficiary
 */
export const createBeneficiary = async (userId, data) => {
  const { bankName, routingNumber, accountNumber, accountName, nickname } = data;

  // Validate bank name
  const bankValidation = validateBankName(bankName);
  if (!bankValidation.valid) {
    throw new Error(bankValidation.error);
  }

  // Validate routing number
  const routingValidation = validateRoutingNumber(routingNumber);
  if (!routingValidation.valid) {
    throw new Error(routingValidation.error);
  }

  // Validate account number
  const accountValidation = validateAccountNumber(accountNumber);
  if (!accountValidation.valid) {
    throw new Error(accountValidation.error);
  }

  // Validate account name
  const nameValidation = validateRecipientName(accountName);
  if (!nameValidation.valid) {
    throw new Error(nameValidation.error);
  }

  // Check for duplicate beneficiary
  const existing = await prisma.beneficiary.findFirst({
    where: {
      userId,
      routingNumber: routingValidation.formatted,
      accountNumber: accountValidation.formatted,
      isActive: true
    }
  });

  if (existing) {
    throw new Error('This beneficiary already exists');
  }

  // Create beneficiary
  const beneficiary = await prisma.beneficiary.create({
    data: {
      userId,
      bankName: bankValidation.formatted,
      routingNumber: routingValidation.formatted,
      accountNumber: accountValidation.formatted,
      accountName: nameValidation.formatted,
      nickname: nickname ? nickname.trim() : null,
      isActive: true
    }
  });

  return beneficiary;
};

/**
 * Get user's beneficiaries
 */
export const getUserBeneficiaries = async (userId, includeInactive = false) => {
  const where = { userId };

  if (!includeInactive) {
    where.isActive = true;
  }

  const beneficiaries = await prisma.beneficiary.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    }
  });

  return beneficiaries;
};

/**
 * Get beneficiary by ID
 */
export const getBeneficiaryById = async (beneficiaryId, userId) => {
  const beneficiary = await prisma.beneficiary.findFirst({
    where: {
      id: beneficiaryId,
      userId
    }
  });

  if (!beneficiary) {
    throw new Error('Beneficiary not found');
  }

  return beneficiary;
};

/**
 * Update beneficiary
 */
export const updateBeneficiary = async (beneficiaryId, userId, data) => {
  // Verify ownership
  await getBeneficiaryById(beneficiaryId, userId);

  const { bankName, routingNumber, accountNumber, accountName, nickname } = data;

  const updateData = {};

  // Validate and update bank name if provided
  if (bankName) {
    const bankValidation = validateBankName(bankName);
    if (!bankValidation.valid) {
      throw new Error(bankValidation.error);
    }
    updateData.bankName = bankValidation.formatted;
  }

  // Validate and update routing number if provided
  if (routingNumber) {
    const routingValidation = validateRoutingNumber(routingNumber);
    if (!routingValidation.valid) {
      throw new Error(routingValidation.error);
    }
    updateData.routingNumber = routingValidation.formatted;
  }

  // Validate and update account number if provided
  if (accountNumber) {
    const accountValidation = validateAccountNumber(accountNumber);
    if (!accountValidation.valid) {
      throw new Error(accountValidation.error);
    }
    updateData.accountNumber = accountValidation.formatted;
  }

  // Validate and update account name if provided
  if (accountName) {
    const nameValidation = validateRecipientName(accountName);
    if (!nameValidation.valid) {
      throw new Error(nameValidation.error);
    }
    updateData.accountName = nameValidation.formatted;
  }

  // Update nickname if provided
  if (nickname !== undefined) {
    updateData.nickname = nickname ? nickname.trim() : null;
  }

  const beneficiary = await prisma.beneficiary.update({
    where: { id: beneficiaryId },
    data: updateData
  });

  return beneficiary;
};

/**
 * Delete (deactivate) beneficiary
 */
export const deleteBeneficiary = async (beneficiaryId, userId) => {
  // Verify ownership
  await getBeneficiaryById(beneficiaryId, userId);

  const beneficiary = await prisma.beneficiary.update({
    where: { id: beneficiaryId },
    data: {
      isActive: false
    }
  });

  return beneficiary;
};

/**
 * Permanently delete beneficiary
 */
export const permanentlyDeleteBeneficiary = async (beneficiaryId, userId) => {
  // Verify ownership
  await getBeneficiaryById(beneficiaryId, userId);

  await prisma.beneficiary.delete({
    where: { id: beneficiaryId }
  });

  return { success: true };
};

/**
 * Reactivate beneficiary
 */
export const reactivateBeneficiary = async (beneficiaryId, userId) => {
  // Verify ownership
  await getBeneficiaryById(beneficiaryId, userId);

  const beneficiary = await prisma.beneficiary.update({
    where: { id: beneficiaryId },
    data: {
      isActive: true
    }
  });

  return beneficiary;
};
