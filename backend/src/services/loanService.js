import prisma from '../config/prisma.js';

/**
 * Calculate monthly payment using amortization formula
 * M = P * [r(1+r)^n] / [(1+r)^n - 1]
 * where:
 * M = monthly payment
 * P = principal (loan amount)
 * r = monthly interest rate (annual rate / 12)
 * n = number of payments (term in months)
 */
export const calculateMonthlyPayment = (principal, annualRate, termMonths) => {
  if (annualRate === 0) {
    return principal / termMonths;
  }
  
  const monthlyRate = annualRate / 100 / 12;
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, termMonths);
  const denominator = Math.pow(1 + monthlyRate, termMonths) - 1;
  
  return (principal * numerator) / denominator;
};

/**
 * Calculate interest for a payment
 */
export const calculateInterest = (remainingBalance, annualRate) => {
  const monthlyRate = annualRate / 100 / 12;
  return remainingBalance * monthlyRate;
};

/**
 * Create a loan application
 */
export const createLoanApplication = async (userId, data) => {
  const { loanType, amount, termMonths, purpose } = data;

  // Validate inputs
  if (!loanType || !['PERSONAL', 'BUSINESS', 'MORTGAGE', 'AUTO'].includes(loanType)) {
    throw new Error('Invalid loan type');
  }

  if (!amount || parseFloat(amount) <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  if (!termMonths || termMonths < 6 || termMonths > 360) {
    throw new Error('Term must be between 6 and 360 months');
  }

  // Get user's primary account, or any active account if no primary
  let account = await prisma.account.findFirst({
    where: {
      userId,
      isPrimary: true,
      isActive: true
    }
  });

  // Fallback to any active account if no primary account
  if (!account) {
    account = await prisma.account.findFirst({
      where: {
        userId,
        isActive: true
      }
    });
  }

  // Create a default account if none exists
  if (!account) {
    account = await prisma.account.create({
      data: {
        userId,
        accountNumber: `7${Date.now().toString().slice(-9)}`,
        accountType: 'SAVINGS',
        currency: 'USD',
        balance: 0,
        availableBalance: 0,
        isPrimary: true,
        isActive: true
      }
    });
  }

  // Realistic interest rates by loan type (industry standard)
  const defaultRates = {
    PERSONAL: 12.5,  // Personal loans typically 10-15%
    BUSINESS: 9.5,   // Business loans typically 7-12%
    MORTGAGE: 6.5,   // Mortgage rates typically 5-8%
    AUTO: 8.0        // Auto loans typically 6-10%
  };

  const interestRate = defaultRates[loanType];
  const monthlyPayment = calculateMonthlyPayment(parseFloat(amount), interestRate, termMonths);

  // Create loan application
  const loan = await prisma.loan.create({
    data: {
      userId,
      accountId: account.id,
      loanType,
      amount: parseFloat(amount),
      interestRate,
      termMonths,
      monthlyPayment,
      remainingBalance: parseFloat(amount),
      purpose: purpose || null,
      status: 'PENDING'
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      account: {
        select: {
          id: true,
          accountNumber: true,
          accountType: true
        }
      }
    }
  });

  // Create notification for user
  await prisma.notification.create({
    data: {
      userId,
      type: 'loan',
      title: 'Loan Application Submitted',
      message: `Your ${loanType.toLowerCase()} loan application for $${amount} has been submitted and is pending review.`,
      metadata: {
        loanId: loan.id,
        amount: parseFloat(amount)
      }
    }
  });

  return loan;
};

/**
 * Get user's loans
 */
export const getUserLoans = async (userId, filters = {}) => {
  const { status } = filters;

  const where = { userId };

  if (status) {
    where.status = status;
  }

  const loans = await prisma.loan.findMany({
    where,
    include: {
      account: {
        select: {
          id: true,
          accountNumber: true,
          accountType: true
        }
      },
      payments: {
        orderBy: {
          paymentDate: 'desc'
        },
        take: 5
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return loans;
};

/**
 * Get loan by ID
 */
export const getLoanById = async (loanId, userId = null) => {
  const where = { id: loanId };
  
  if (userId) {
    where.userId = userId;
  }

  const loan = await prisma.loan.findFirst({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      account: {
        select: {
          id: true,
          accountNumber: true,
          accountType: true,
          balance: true
        }
      },
      payments: {
        orderBy: {
          paymentDate: 'desc'
        }
      }
    }
  });

  if (!loan) {
    throw new Error('Loan not found');
  }

  return loan;
};

/**
 * Approve loan (admin action)
 */
export const approveLoan = async (loanId, adminId, approvalData = {}) => {
  const loan = await getLoanById(loanId);

  if (loan.status !== 'PENDING') {
    throw new Error(`Loan is already ${loan.status.toLowerCase()}`);
  }

  const { interestRate, termMonths } = approvalData;

  // Use custom terms if provided, otherwise use application terms
  const finalInterestRate = interestRate ? parseFloat(interestRate) : parseFloat(loan.interestRate);
  const finalTermMonths = termMonths ? parseInt(termMonths) : loan.termMonths;
  const finalMonthlyPayment = calculateMonthlyPayment(parseFloat(loan.amount), finalInterestRate, finalTermMonths);

  // Calculate next payment date (30 days from now)
  const nextPaymentDate = new Date();
  nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Update loan status and terms
    const updatedLoan = await tx.loan.update({
      where: { id: loanId },
      data: {
        status: 'APPROVED',
        interestRate: finalInterestRate,
        termMonths: finalTermMonths,
        monthlyPayment: finalMonthlyPayment,
        approvedBy: adminId,
        approvedAt: new Date(),
        disbursedAt: new Date(),
        nextPaymentDate
      },
      include: {
        user: true,
        account: true
      }
    });

    // Credit the loan amount to user's account
    const updatedAccount = await tx.account.update({
      where: { id: loan.accountId },
      data: {
        balance: {
          increment: parseFloat(loan.amount)
        },
        availableBalance: {
          increment: parseFloat(loan.amount)
        }
      }
    });

    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId: loan.userId,
        accountId: loan.accountId,
        type: 'CREDIT',
        amount: parseFloat(loan.amount),
        description: `${loan.loanType} loan disbursement`,
        reference: `LOAN-${loanId.slice(-8).toUpperCase()}`,
        status: 'COMPLETED',
        category: 'LOAN'
      }
    });

    // Create notification
    await tx.notification.create({
      data: {
        userId: loan.userId,
        type: 'loan',
        title: 'Loan Approved',
        message: `Your ${loan.loanType.toLowerCase()} loan for $${loan.amount} has been approved! Funds have been credited to your account.`,
        metadata: {
          loanId: loan.id,
          amount: parseFloat(loan.amount),
          monthlyPayment: finalMonthlyPayment,
          nextPaymentDate: nextPaymentDate.toISOString()
        }
      }
    });

    return {
      loan: updatedLoan,
      account: updatedAccount,
      transaction
    };
  });

  return result;
};

/**
 * Decline loan (admin action)
 */
export const declineLoan = async (loanId, adminId, reason) => {
  const loan = await getLoanById(loanId);

  if (loan.status !== 'PENDING') {
    throw new Error(`Loan is already ${loan.status.toLowerCase()}`);
  }

  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: {
      status: 'DECLINED',
      declineReason: reason || 'Application does not meet approval criteria',
      approvedBy: adminId,
      approvedAt: new Date()
    },
    include: {
      user: true
    }
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: loan.userId,
      type: 'loan',
      title: 'Loan Application Declined',
      message: `Your ${loan.loanType.toLowerCase()} loan application has been declined. Reason: ${updatedLoan.declineReason}`,
      metadata: {
        loanId: loan.id,
        reason: updatedLoan.declineReason
      }
    }
  });

  return updatedLoan;
};

/**
 * Make loan payment
 */
export const makeLoanPayment = async (loanId, userId, paymentAmount = null) => {
  const loan = await getLoanById(loanId, userId);

  if (loan.status !== 'APPROVED' && loan.status !== 'ACTIVE') {
    throw new Error('Loan is not active');
  }

  if (parseFloat(loan.remainingBalance) <= 0) {
    throw new Error('Loan is already paid off');
  }

  // Use monthly payment if no amount specified
  const amount = paymentAmount ? parseFloat(paymentAmount) : parseFloat(loan.monthlyPayment);

  // Check if amount exceeds remaining balance
  const actualPayment = Math.min(amount, parseFloat(loan.remainingBalance));

  // Calculate interest and principal portions
  const interestAmount = calculateInterest(parseFloat(loan.remainingBalance), parseFloat(loan.interestRate));
  const principalAmount = actualPayment - interestAmount;

  if (principalAmount < 0) {
    throw new Error('Payment amount is less than interest due');
  }

  // Check account balance
  const account = await prisma.account.findUnique({
    where: { id: loan.accountId }
  });

  if (!account || parseFloat(account.balance) < actualPayment) {
    throw new Error('Insufficient account balance');
  }

  const newRemainingBalance = parseFloat(loan.remainingBalance) - principalAmount;
  const newTotalPaid = parseFloat(loan.totalPaid) + actualPayment;

  // Calculate next payment date (30 days from now)
  const nextPaymentDate = new Date();
  nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Debit account
    const updatedAccount = await tx.account.update({
      where: { id: loan.accountId },
      data: {
        balance: {
          decrement: actualPayment
        }
      }
    });

    // Update loan
    const updatedLoan = await tx.loan.update({
      where: { id: loanId },
      data: {
        remainingBalance: newRemainingBalance,
        totalPaid: newTotalPaid,
        status: newRemainingBalance <= 0 ? 'PAID' : 'ACTIVE',
        nextPaymentDate: newRemainingBalance > 0 ? nextPaymentDate : null
      }
    });

    // Create payment record
    const payment = await tx.loanPayment.create({
      data: {
        loanId,
        amount: actualPayment,
        principalAmount,
        interestAmount,
        remainingBalance: newRemainingBalance,
        reference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        status: 'COMPLETED'
      }
    });

    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId,
        accountId: loan.accountId,
        type: 'DEBIT',
        amount: actualPayment,
        description: `Loan payment - ${loan.loanType}`,
        reference: payment.reference,
        status: 'COMPLETED',
        category: 'LOAN_PAYMENT'
      }
    });

    // Create notification
    const notificationMessage = newRemainingBalance <= 0
      ? `Congratulations! Your ${loan.loanType.toLowerCase()} loan has been paid off!`
      : `Loan payment of $${actualPayment.toFixed(2)} processed successfully. Remaining balance: $${newRemainingBalance.toFixed(2)}`;

    await tx.notification.create({
      data: {
        userId,
        type: 'loan',
        title: newRemainingBalance <= 0 ? 'Loan Paid Off' : 'Loan Payment Processed',
        message: notificationMessage,
        metadata: {
          loanId,
          paymentAmount: actualPayment,
          remainingBalance: newRemainingBalance
        }
      }
    });

    return {
      loan: updatedLoan,
      payment,
      transaction,
      account: updatedAccount
    };
  });

  return result;
};

/**
 * Get payment schedule for a loan
 */
export const getPaymentSchedule = async (loanId, userId = null) => {
  const loan = await getLoanById(loanId, userId);

  const schedule = [];
  let remainingBalance = parseFloat(loan.amount);
  const monthlyPayment = parseFloat(loan.monthlyPayment);
  const annualRate = parseFloat(loan.interestRate);

  for (let month = 1; month <= loan.termMonths; month++) {
    const interestAmount = calculateInterest(remainingBalance, annualRate);
    const principalAmount = monthlyPayment - interestAmount;
    remainingBalance -= principalAmount;

    // Ensure remaining balance doesn't go negative
    if (remainingBalance < 0) {
      remainingBalance = 0;
    }

    const paymentDate = new Date(loan.disbursedAt || loan.createdAt);
    paymentDate.setMonth(paymentDate.getMonth() + month);

    schedule.push({
      month,
      paymentDate: paymentDate.toISOString(),
      payment: monthlyPayment,
      principal: principalAmount,
      interest: interestAmount,
      remainingBalance
    });

    if (remainingBalance <= 0) break;
  }

  return schedule;
};

/**
 * Get all pending loans (admin)
 */
export const getPendingLoans = async () => {
  const loans = await prisma.loan.findMany({
    where: {
      status: 'PENDING'
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      account: {
        select: {
          id: true,
          accountNumber: true,
          accountType: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return loans;
};

/**
 * Get all loans (admin)
 */
export const getAllLoans = async (filters = {}) => {
  const { status, userId } = filters;

  const where = {};

  if (status) {
    where.status = status;
  }

  if (userId) {
    where.userId = userId;
  }

  const loans = await prisma.loan.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      account: {
        select: {
          id: true,
          accountNumber: true,
          accountType: true
        }
      },
      payments: {
        orderBy: {
          paymentDate: 'desc'
        },
        take: 1
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return loans;
};
