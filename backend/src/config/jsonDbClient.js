import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'backend/data');

// Simple Decimal polyfill for services expecting Prisma.Decimal
export class Decimal {
  constructor(value) {
    this.value = Number(value || 0);
  }
  plus(v) { return new Decimal(this.value + Number(v)); }
  minus(v) { return new Decimal(this.value - Number(v)); }
  times(v) { return new Decimal(this.value * Number(v)); }
  div(v) { return new Decimal(this.value / Number(v)); }
  toNumber() { return this.value; }
  toString() { return this.value.toString(); }
  toFixed(n) { return this.value.toFixed(n); }
}

class JsonModel {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
  }

  _read() {
    try {
      if (!fs.existsSync(this.filePath)) return [];
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error(`Error reading ${this.name}:`, e);
      return [];
    }
  }

  _write(data) {
    try {
      const tempPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
    } catch (e) {
      console.error(`Error writing atomic ${this.name}:`, e);
    }
  }

  async findUnique({ where, include, select }) {
    let data = this._read();
    if (where) data = this._filter(data, where);
    return this._processResult(data[0], include, select);
  }

  async findFirst({ where, include, select, orderBy }) {
    let data = this._read();
    if (where) {
      data = this._filter(data, where);
    }
    if (orderBy) {
      data = this._sort(data, orderBy);
    }
    return this._processResult(data[0], include, select);
  }

  async findMany({ where, include, select, orderBy, take, skip }) {
    let data = this._read();
    if (where) {
      data = this._filter(data, where);
    }
    if (orderBy) {
      data = this._sort(data, orderBy);
    }
    if (skip) data = data.slice(skip);
    if (take) data = data.slice(0, take);
    
    return data.map(item => this._processResult(item, include, select));
  }

  async create({ data }) {
    const table = this._read();
    const newItem = {
      id: data.id || `c${crypto.randomBytes(8).toString('hex')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    table.push(newItem);
    this._write(table);

    // [Global Ledger Logic] - If creating a transaction, also update the fast cache
    if (this.name === 'transactions') {
      this._updateGlobalLedger(newItem);
    }

    return newItem;
  }

  _updateGlobalLedger(transaction) {
    try {
      const ledgerPath = path.join(DATA_DIR, 'global_ledger.json');
      let ledger = [];
      if (fs.existsSync(ledgerPath)) {
        ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
      }
      ledger.unshift(transaction);
      // Keep only last 100 for speed
      if (ledger.length > 100) ledger = ledger.slice(0, 100);
      
      const tempPath = `${ledgerPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(ledger, null, 2), 'utf8');
      fs.renameSync(tempPath, ledgerPath);
    } catch (e) {
      console.error('Error updating global ledger:', e);
    }
  }

  async update({ where, data }) {
    const table = this._read();
    const index = table.findIndex(i => {
      return Object.entries(where).every(([key, value]) => i[key] === value);
    });
    if (index === -1) throw new Error(`${this.name} record not found for update`);
    
    const updatedData = { ...table[index] };
    for (const [key, b] of Object.entries(data)) {
      if (b === null) {
        updatedData[key] = null;
      } else if (typeof b === 'object') {
        if (b.increment !== undefined) {
          updatedData[key] = (Number(updatedData[key]) || 0) + Number(b.increment instanceof Decimal ? b.increment.value : b.increment);
        } else if (b.decrement !== undefined) {
          updatedData[key] = (Number(updatedData[key]) || 0) - Number(b.decrement instanceof Decimal ? b.decrement.value : b.decrement);
        } else if (b instanceof Decimal) {
          updatedData[key] = b.value;
        } else if (b instanceof Date) {
          updatedData[key] = b.toISOString();
        } else {
          updatedData[key] = b;
        }
      } else {
        updatedData[key] = b;
      }
    }
    
    updatedData.updatedAt = new Date().toISOString();
    table[index] = updatedData;
    this._write(table);
    return updatedData;
  }

  async updateMany({ where, data }) {
    let table = this._read();
    let count = 0;
    table = table.map(i => {
      const match = Object.entries(where).every(([key, value]) => {
        if (typeof value === 'object' && value.in) {
          return value.in.includes(i[key]);
        }
        return i[key] === value;
      });
      if (match) {
        count++;
        return { ...i, ...data, updatedAt: new Date().toISOString() };
      }
      return i;
    });
    this._write(table);
    return { count };
  }

  async delete({ where }) {
    const table = this._read();
    const index = table.findIndex(i => {
      return Object.entries(where).every(([key, value]) => i[key] === value);
    });
    if (index === -1) throw new Error(`${this.name} record not found for delete`);
    const deleted = table.splice(index, 1);
    this._write(table);
    return deleted[0];
  }

  async deleteMany({ where }) {
    const table = this._read();
    const initialLength = table.length;
    const newTable = table.filter(i => {
      return !Object.entries(where).every(([key, value]) => i[key] === value);
    });
    this._write(newTable);
    return { count: initialLength - newTable.length };
  }

  async count({ where }) {
    let data = this._read();
    if (where) data = this._filter(data, where);
    return data.length;
  }

  _filter(data, where) {
    return data.filter(i => {
      return Object.entries(where).every(([key, value]) => {
        if (key === 'OR' && Array.isArray(value)) {
          return value.some(condition => {
            return Object.entries(condition).every(([ck, cv]) => {
              if (typeof cv === 'object' && cv.contains) {
                 const target = i[ck] || '';
                 return target.toLowerCase().includes(cv.contains.toLowerCase());
              }
              return i[ck] === cv;
            });
          });
        }
        if (typeof value === 'object' && value !== null) {
          if (value.equals !== undefined) {
            const target = typeof i[key] === 'string' ? i[key] : String(i[key] || '');
            const query = typeof value.equals === 'string' ? value.equals : String(value.equals);
            if (value.mode === 'insensitive') {
              return target.toLowerCase() === query.toLowerCase();
            }
            return target === query;
          }
          if (value.contains) {
            const target = i[key] || '';
            const query = value.contains;
            if (value.mode === 'insensitive') {
              return target.toLowerCase().includes(query.toLowerCase());
            }
            return target.includes(query);
          }
          if (value.in) return value.in.includes(i[key]);
          if (value.gte) return new Date(i[key]) >= new Date(value.gte);
          if (value.lte) return new Date(i[key]) <= new Date(value.lte);
          if (value.gt) return new Date(i[key]) > new Date(value.gt);
          if (value.lt) return new Date(i[key]) < new Date(value.lt);
          if (value.not) return i[key] !== value.not;
        }
        return i[key] === value;
      });
    });
  }

  _sort(data, orderBy) {
    const [key, dir] = Object.entries(orderBy)[0];
    return [...data].sort((a, b) => {
      if (a[key] < b[key]) return dir === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  _processResult(item, include, select) {
    if (!item) return null;
    let result = { ...item };
    
    // Automatically wrap financial fields in Decimal for precision math
    const financialFields = ['balance', 'amount', 'availableBalance', 'interestRate', 'monthlyPayment', 'totalPaid', 'remainingBalance'];
    financialFields.forEach(field => {
      if (typeof result[field] === 'number' || (typeof result[field] === 'string' && !isNaN(result[field]) && result[field] !== '')) {
        result[field] = new Decimal(result[field]);
      }
    });

    // Handle relations (basic simulation)
    if (include) {
      for (const rel of Object.keys(include)) {
        const relTable = this._mapRelationToTable(rel);
        const relModel = new JsonModel(relTable);
        const foreignKey = this._getForeignKey(this.name, rel);
        if (foreignKey) {
            result[rel] = relModel._read().filter(i => i[foreignKey] === item.id).map(r => this._processResult(r));
        }
      }
    }

    if (select) {
      const selected = {};
      for (const key of Object.keys(select)) {
        if (select[key]) selected[key] = result[key];
      }
      return selected;
    }
    
    return result;
  }

  _mapRelationToTable(rel) {
    const map = {
        'accounts': 'accounts',
        'transactions': 'transactions',
        'cards': 'cards',
        'sessions': 'sessions',
        'securityQuestions': 'security_questions',
        'backupCodes': 'backup_codes',
        'auditLogs': 'audit_logs',
        'notifications': 'notifications',
        'kycDocuments': 'kyc_documents',
        'loans': 'loans',
        'deposits': 'deposits',
        'cheques': 'cheques',
        'debitCards': 'debit_cards',
        'creditCards': 'credit_cards',
        'transferRequests': 'transfer_requests',
        'beneficiaries': 'beneficiaries',
        'supportTickets': 'support_tickets',
        'supportMessages': 'support_messages',
        'withdrawals': 'withdrawals',
        'recurringPayments': 'recurring_payments',
        'fixedDeposits': 'fixed_deposits',
        'user': 'users',
        'account': 'accounts'
    };
    return map[rel] || rel.toLowerCase();
  }

  _getForeignKey(model, rel) {
      if (model === 'users') return 'userId';
      if (model === 'accounts') {
          if (rel === 'transactions') return 'accountId';
          if (rel === 'cards') return 'accountId';
      }
      return 'userId';
  }
}

class PartitionedJsonModel extends JsonModel {
  constructor(name, partitionKey = 'userId') {
    super(name);
    this.partitionKey = partitionKey;
    this.baseDir = path.join(DATA_DIR, name);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  _getFilePath(id) {
    return path.join(this.baseDir, `${id}.json`);
  }

  _readAll() {
    try {
      if (!fs.existsSync(this.baseDir)) return [];
      const files = fs.readdirSync(this.baseDir).filter(f => f.endsWith('.json'));
      let allData = [];
      for (const file of files) {
        const data = JSON.parse(fs.readFileSync(path.join(this.baseDir, file), 'utf8'));
        allData = allData.concat(data);
      }
      return allData;
    } catch (e) {
      console.error(`Error reading partitioned ${this.name}:`, e);
      return [];
    }
  }

  _readPartition(id) {
    try {
      const pPath = this._getFilePath(id);
      if (!fs.existsSync(pPath)) return [];
      return JSON.parse(fs.readFileSync(pPath, 'utf8'));
    } catch (e) {
      console.error(`Error reading partition ${id} for ${this.name}:`, e);
      return [];
    }
  }

  _writePartition(id, data) {
    try {
      const pPath = this._getFilePath(id);
      const tempPath = `${pPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, pPath);
    } catch (e) {
      console.error(`Error writing partition ${id} for ${this.name}:`, e);
    }
  }

  async findUnique(params) {
    let data = this._readAll();
    if (params.where) data = this._filter(data, params.where);
    return this._processResult(data[0], params.include, params.select);
  }

  async findFirst(params) {
    let data;
    if (params.where && params.where[this.partitionKey]) {
      data = this._readPartition(params.where[this.partitionKey]);
    } else {
      data = this._readAll();
    }
    
    if (params.where) data = this._filter(data, params.where);
    if (params.orderBy) data = this._sort(data, params.orderBy);
    return this._processResult(data[0], params.include, params.select);
  }

  async findMany(params) {
    let data;
    if (params.where && params.where[this.partitionKey]) {
      data = this._readPartition(params.where[this.partitionKey]);
    } else if (params.where && params.where.accountId && this.name === 'transactions') {
      const account = await prisma.account.findUnique({ where: { id: params.where.accountId } });
      if (account) {
        data = this._readPartition(account.userId);
      } else {
        data = this._readAll();
      }
    } else {
      data = this._readAll();
    }

    if (params.where) data = this._filter(data, params.where);
    if (params.orderBy) data = this._sort(data, params.orderBy);
    if (params.skip) data = data.slice(params.skip);
    if (params.take) data = data.slice(Take ? take : 100); // Default take
    
    return data.map(item => this._processResult(item, params.include, params.select));
  }

  async create({ data }) {
    let userId = data[this.partitionKey];
    if (!userId && this.name === 'transactions' && data.accountId) {
      const accountData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'accounts.json'), 'utf8'))
        .find(a => a.id === data.accountId);
      if (accountData) userId = accountData.userId;
    }

    if (!userId) userId = 'global';

    const partition = this._readPartition(userId);
    const newItem = {
      id: data.id || `c${crypto.randomBytes(8).toString('hex')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    partition.push(newItem);
    this._writePartition(userId, partition);

    // [Global Ledger Logic]
    if (this.name === 'transactions') {
      this._updateGlobalLedger(newItem);
    }

    return newItem;
  }

  async update(params) {
    const all = this._readAll();
    const item = all.find(i => {
      return Object.entries(params.where).every(([key, value]) => i[key] === value);
    });
    if (!item) throw new Error(`${this.name} record not found for update`);
    
    const userId = item[this.partitionKey] || 'global';
    const partition = this._readPartition(userId);
    const index = partition.findIndex(i => i.id === item.id);
    
    const updatedData = { ...partition[index], ...params.data, updatedAt: new Date().toISOString() };
    partition[index] = updatedData;
    this._writePartition(userId, partition);
    return updatedData;
  }

  async count(params) {
    let data;
    if (params && params.where && params.where[this.partitionKey]) {
      data = this._readPartition(params.where[this.partitionKey]);
    } else {
      data = this._readAll();
    }
    if (params && params.where) data = this._filter(data, params.where);
    return data.length;
  }
}

class JsonDb {
  constructor() {
    this.user = new JsonModel('users');
    this.account = new JsonModel('accounts');
    this.transaction = new PartitionedJsonModel('transactions', 'userId');
    this.session = new JsonModel('sessions');
    this.securityQuestion = new JsonModel('security_questions');
    this.backupCode = new JsonModel('backup_codes');
    this.auditLog = new JsonModel('audit_logs');
    this.notification = new JsonModel('notifications');
    this.kycDocument = new JsonModel('kyc_documents');
    this.loan = new JsonModel('loans');
    this.loanPayment = new JsonModel('loan_payments');
    this.paymentGateway = new JsonModel('payment_gateways');
    this.deposit = new JsonModel('deposits');
    this.cheque = new JsonModel('cheques');
    this.debitCard = new JsonModel('debit_cards');
    this.creditCard = new JsonModel('credit_cards');
    this.creditCardFunding = new JsonModel('credit_card_fundings');
    this.cardTransaction = new JsonModel('card_transactions');
    this.bankList = new JsonModel('bank_list');
    this.transferRequest = new JsonModel('transfer_requests');
    this.beneficiary = new JsonModel('beneficiaries');
    this.supportTicket = new JsonModel('support_tickets');
    this.supportMessage = new JsonModel('support_messages');
    this.withdrawal = new JsonModel('withdrawals');
    this.currency = new JsonModel('currencies');
    this.recurringPayment = new JsonModel('recurring_payments');
    this.recurringPaymentExecution = new JsonModel('recurring_payment_executions');
    this.fixedDeposit = new JsonModel('fixed_deposits');
  }

  async $transaction(fn) {
    return await fn(this);
  }

  async $connect() { console.log('📁 JSON DB Connected'); }
  async $disconnect() { console.log('📁 JSON DB Disconnected'); }
}

export const prisma = new JsonDb();
export default prisma;
