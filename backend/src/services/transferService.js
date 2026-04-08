import prisma from '../config/prisma.js';

// Generate unique transfer reference
export const generateTransferReference = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TRF-${timestamp}${random}`.toUpperCase();
};

// Get all banks
export const getBankList = async () => {
  const banks = await prisma.bankList.findMany({
    where: { isActive: true },
    orderBy: { bankName: 'asc' }
  });

  return {
    success: true,
    count: banks.length,
    banks
  };
};

// Validate routing number
export const validateRoutingNumber = async (routingNumber) => {
  const bank = await prisma.bankList.findUnique({
    where: { routingNumber }
  });

  return {
    success: true,
    valid: !!bank,
    bank
  };
};

// Create transfer request
export const createTransferRequest = async (userId, transferData) => {
  const { fromAccountId, destinationBank, routingNumber, accountNumber, accountName, amount, description, saveBeneficiary, beneficiaryNickname } = transferData;

  // Verify account belongs to user
  const account = await prisma.account.findFirst({
    where: { id: fromAccountId, userId }
  });

  if (!account) {
    throw new Error('Account not found or unauthorized');
  }

  // Check sufficient balance - use balance if availableBalance is 0 or null
  const availableBalance = Number(account.availableBalance) > 0 
    ? Number(account.availableBalance) 
    : Number(account.balance);
  if (availableBalance < amount) {
    throw new Error(`Insufficient funds. Available: $${availableBalance.toFixed(2)}, Requested: $${amount.toFixed(2)}`);
  }

  // Verify bank exists (skip validation if routingNumber is a SWIFT code for international)
  if (routingNumber && routingNumber.length === 9) {
    const bank = await prisma.bankList.findUnique({
      where: { routingNumber }
    });

    if (!bank) {
      throw new Error('Invalid routing number');
    }
  }

  // Generate reference
  const reference = generateTransferReference();

  // Create transfer request
  const transfer = await prisma.transferRequest.create({
    data: {
      userId,
      fromAccountId,
      destinationBank,
      routingNumber,
      accountNumber,
      accountName,
      amount,
      description,
      reference,
      status: 'PENDING',
      estimatedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    }
  });

  // Create a PENDING transaction so it shows in transaction history
  await prisma.transaction.create({
    data: {
      accountId: fromAccountId,
      type: 'TRANSFER',
      amount: -Math.abs(Number(amount)),
      description: description || `Transfer to ${accountName} at ${destinationBank}`,
      category: 'TRANSFER',
      status: 'PENDING',
      reference,
      merchantName: accountName,
      merchantCategory: destinationBank
    }
  });

  // Deduct from available balance (move to pending)
  await prisma.account.update({
    where: { id: fromAccountId },
    data: {
      availableBalance: { decrement: amount },
      pendingBalance: { increment: amount }
    }
  });

  // Save beneficiary if requested
  if (saveBeneficiary) {
    await prisma.beneficiary.create({
      data: {
        userId,
        bankName: destinationBank,
        routingNumber,
        accountNumber,
        accountName,
        nickname: beneficiaryNickname || accountName
      }
    });
  }

  // Create notification
  await prisma.notification.create({
    data: {
      userId,
      type: 'transfer',
      title: 'Transfer Request Submitted',
      message: `Your transfer of $${amount.toFixed(2)} to ${accountName} is pending approval.`,
      metadata: {
        transferId: transfer.id,
        reference: transfer.reference,
        amount
      }
    }
  });

  return {
    success: true,
    message: 'Transfer request submitted successfully',
    transfer: {
      id: transfer.id,
      reference: transfer.reference,
      amount: transfer.amount,
      status: transfer.status,
      estimatedCompletion: transfer.estimatedCompletion
    }
  };
};

// Get user's transfer requests
export const getUserTransfers = async (userId) => {
  const transfers = await prisma.transferRequest.findMany({
    where: { userId },
    include: {
      account: {
        select: {
          accountNumber: true,
          accountType: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return {
    success: true,
    count: transfers.length,
    transfers
  };
};

// Get transfer by ID
export const getTransferById = async (transferId, userId) => {
  const transfer = await prisma.transferRequest.findFirst({
    where: { id: transferId, userId },
    include: {
      account: {
        select: {
          accountNumber: true,
          accountType: true,
          balance: true
        }
      }
    }
  });

  if (!transfer) {
    throw new Error('Transfer not found');
  }

  return {
    success: true,
    transfer
  };
};

// Admin: Get pending transfers
export const getPendingTransfers = async () => {
  const transfers = await prisma.transferRequest.findMany({
    where: { status: 'PENDING' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          kycStatus: true
        }
      },
      account: {
        select: {
          accountNumber: true,
          accountType: true,
          balance: true,
          availableBalance: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  return {
    success: true,
    count: transfers.length,
    transfers
  };
};

// Admin: Approve transfer
export const approveTransfer = async (transferId, adminId, notes) => {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id: transferId }
  });

  if (!transfer) {
    throw new Error('Transfer not found');
  }

  if (transfer.status !== 'PENDING') {
    throw new Error('Transfer has already been processed');
  }

  // Update transfer status
  const updated = await prisma.transferRequest.update({
    where: { id: transferId },
    data: {
      status: 'APPROVED',
      adminAction: 'APPROVE',
      adminId,
      adminNotes: notes,
      processedAt: new Date()
    }
  });

  // Update the transaction status from PENDING to COMPLETED
  await prisma.transaction.updateMany({
    where: { 
      reference: transfer.reference,
      status: 'PENDING'
    },
    data: {
      status: 'COMPLETED'
    }
  });

  // Move from pending to completed (deduct from pending balance)
  await prisma.account.update({
    where: { id: transfer.fromAccountId },
    data: {
      pendingBalance: { decrement: transfer.amount },
      balance: { decrement: transfer.amount }
    }
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: transfer.userId,
      type: 'transfer',
      title: 'Transfer Approved',
      message: `Your transfer of $${transfer.amount.toFixed(2)} has been approved and is being processed.`,
      metadata: {
        transferId: transfer.id,
        reference: transfer.reference
      }
    }
  });

  return {
    success: true,
    message: 'Transfer approved successfully',
    transfer: updated
  };
};

// Admin: Decline transfer
export const declineTransfer = async (transferId, adminId, reason) => {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id: transferId }
  });

  if (!transfer) {
    throw new Error('Transfer not found');
  }

  if (transfer.status !== 'PENDING') {
    throw new Error('Transfer has already been processed');
  }

  // Update transfer status
  const updated = await prisma.transferRequest.update({
    where: { id: transferId },
    data: {
      status: 'DECLINED',
      adminAction: 'DECLINE',
      adminId,
      adminNotes: reason,
      processedAt: new Date()
    }
  });

  // Update the transaction status from PENDING to DECLINED
  await prisma.transaction.updateMany({
    where: { 
      reference: transfer.reference,
      status: 'PENDING'
    },
    data: {
      status: 'DECLINED'
    }
  });

  // Return money to available balance
  await prisma.account.update({
    where: { id: transfer.fromAccountId },
    data: {
      availableBalance: { increment: transfer.amount },
      pendingBalance: { decrement: transfer.amount }
    }
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: transfer.userId,
      type: 'transfer',
      title: 'Transfer Declined',
      message: `Your transfer of $${transfer.amount.toFixed(2)} was declined. Reason: ${reason}`,
      metadata: {
        transferId: transfer.id,
        reference: transfer.reference,
        reason
      }
    }
  });

  return {
    success: true,
    message: 'Transfer declined successfully',
    transfer: updated
  };
};

// Admin: Reverse transfer (can reverse PENDING or APPROVED transfers)
export const reverseTransfer = async (transferId, adminId, reason = 'Admin reversal') => {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id: transferId },
    include: {
      account: true
    }
  });

  if (!transfer) {
    throw new Error('Transfer not found');
  }

  if (transfer.status === 'REVERSED' || transfer.status === 'DECLINED') {
    throw new Error('Transfer has already been reversed or declined');
  }

  // Generate RVSL reference
  const rvslReference = `RVSL-${transfer.reference.replace('TRF-', '')}`;

  // Handle based on current status
  const wasPending = transfer.status === 'PENDING';
  const wasApproved = transfer.status === 'APPROVED';

  // Update transfer status
  const updated = await prisma.transferRequest.update({
    where: { id: transferId },
    data: {
      status: 'REVERSED',
      adminAction: 'REVERSE',
      adminId,
      adminNotes: `Reversed: ${reason || 'Admin reversal'}. RVSL ID: ${rvslReference}`,
      processedAt: new Date()
    }
  });

  // Update the original transaction status to REVERSED
  await prisma.transaction.updateMany({
    where: { 
      reference: transfer.reference
    },
    data: {
      status: 'REVERSED'
    }
  });

  // Return money based on previous status
  if (wasPending) {
    // Was pending - move from pending back to available
    await prisma.account.update({
      where: { id: transfer.fromAccountId },
      data: {
        availableBalance: { increment: transfer.amount },
        pendingBalance: { decrement: transfer.amount }
      }
    });
  } else if (wasApproved) {
    // Was approved - add back to both balance and available
    await prisma.account.update({
      where: { id: transfer.fromAccountId },
      data: {
        balance: { increment: transfer.amount },
        availableBalance: { increment: transfer.amount }
      }
    });
  }

  // Create reversal transaction record
  await prisma.transaction.create({
    data: {
      accountId: transfer.fromAccountId,
      type: 'CREDIT',
      amount: transfer.amount,
      description: `Transfer Reversal - ${rvslReference} (Reason: ${reason || 'Admin reversal'})`,
      reference: rvslReference,
      status: 'COMPLETED',
      category: 'REVERSAL'
    }
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: transfer.userId,
      type: 'transfer',
      title: 'Transfer Reversed',
      message: `Your transfer of $${transfer.amount.toFixed(2)} was reversed. RVSL ID: ${rvslReference}. Funds have been returned to your account.`,
      metadata: {
        transferId: transfer.id,
        reference: transfer.reference,
        rvslReference,
        reason: reason || 'Admin reversal'
      }
    }
  });

  return {
    success: true,
    message: 'Transfer reversed successfully',
    transfer: updated,
    rvslReference
  };
};

// Beneficiary management
export const saveBeneficiary = async (userId, beneficiaryData) => {
  const beneficiary = await prisma.beneficiary.create({
    data: {
      userId,
      ...beneficiaryData
    }
  });

  return {
    success: true,
    message: 'Beneficiary saved successfully',
    beneficiary
  };
};

export const getBeneficiaries = async (userId) => {
  const beneficiaries = await prisma.beneficiary.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'desc' }
  });

  return {
    success: true,
    count: beneficiaries.length,
    beneficiaries
  };
};

export const deleteBeneficiary = async (beneficiaryId, userId) => {
  const beneficiary = await prisma.beneficiary.findFirst({
    where: { id: beneficiaryId, userId }
  });

  if (!beneficiary) {
    throw new Error('Beneficiary not found');
  }

  await prisma.beneficiary.update({
    where: { id: beneficiaryId },
    data: { isActive: false }
  });

  return {
    success: true,
    message: 'Beneficiary deleted successfully'
  };
};

export default {
  getBankList,
  validateRoutingNumber,
  createTransferRequest,
  getUserTransfers,
  getTransferById,
  getPendingTransfers,
  approveTransfer,
  declineTransfer,
  reverseTransfer,
  saveBeneficiary,
  getBeneficiaries,
  deleteBeneficiary
};
