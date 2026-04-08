import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'backend/data');

const models = [
  'users', 'accounts', 'cards', 'transactions', 'sessions', 'security_questions', 
  'backup_codes', 'audit_logs', 'notifications', 'kyc_documents', 'loans', 
  'loan_payments', 'payment_gateways', 'deposits', 'cheques', 'debit_cards', 
  'credit_cards', 'credit_card_fundings', 'card_transactions', 'bank_list', 
  'transfer_requests', 'beneficiaries', 'support_tickets', 'support_messages', 
  'withdrawals', 'currencies', 'recurring_payments', 'recurring_payment_executions', 
  'fixed_deposits'
];

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

models.forEach(model => {
  const filePath = path.join(dataDir, `${model}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    console.log(`Initialized ${model}.json`);
  } else {
    console.log(`${model}.json already exists`);
  }
});
