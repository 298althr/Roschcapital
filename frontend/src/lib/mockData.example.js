/**
 * Mock Data Template
 * 
 * INSTRUCTIONS:
 * 1. Copy this file and rename it to 'mockData.js' in the same directory
 * 2. Customize the data below with your own test data
 * 3. The mockData.js file is gitignored and won't be committed
 * 
 * This allows each developer to have their own test data without conflicts
 */

export const mockAccounts = [
  {
    id: 'acc-1',
    accountNumber: '1234567890',
    accountType: 'Checking',
    balance: '5,000.00',
    currency: 'USD',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
  },
  // Add more accounts as needed
];

export const mockCards = [
  {
    id: 'card-1',
    cardNumber: '4532********1234',
    cardType: 'Visa Debit',
    status: 'active',
    expiryDate: '12/26',
    accountId: 'acc-1',
    accountNumber: '1234567890',
    balance: '5,000.00',
    cvv: '***',
    cardholderName: 'Your Name',
  },
  // Add more cards as needed
];

export const mockTransactions = [
  {
    id: 'txn-1',
    description: 'Sample Transaction',
    amount: '-50.00',
    date: new Date().toISOString(),
    type: 'debit',
    category: 'Shopping',
    status: 'completed',
    accountId: 'acc-1',
  },
  // Add more transactions as needed
];

export const mockDashboard = {
  timestamp: new Date().toISOString(),
  summary: {
    totalBalance: '5,000.00',
    accountCount: 1,
    activeCards: 1,
    totalCards: 1,
    recentTransactionCount: 1,
  },
  recentTransactions: mockTransactions.slice(0, 5),
};

export const mockPayments = [
  // Add payment history
];

export const mockKYCStatus = {
  kycStatus: 'PENDING', // or 'VERIFIED', 'REJECTED'
  verifiedAt: null,
  documents: [],
};
