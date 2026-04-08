import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'backend/data');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const OUTPUT_DIR = path.join(DATA_DIR, 'transactions');

async function migrate() {
    if (!fs.existsSync(TRANSACTIONS_FILE)) {
        console.log('No existing transactions.json found. Skipping migration.');
        return;
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const transactions = JSON.parse(fs.readFileSync(TRANSACTIONS_FILE, 'utf8'));
    const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));

    const userMap = {};
    for (const acc of accounts) {
        userMap[acc.id] = acc.userId;
    }

    const partitioned = {};

    for (const tx of transactions) {
        let userId = tx.userId;
        if (!userId && tx.accountId) {
            userId = userMap[tx.accountId];
        }

        if (!userId) userId = 'global';

        if (!partitioned[userId]) partitioned[userId] = [];
        partitioned[userId].push(tx);
    }

    for (const [userId, txs] of Object.entries(partitioned)) {
        const filePath = path.join(OUTPUT_DIR, `${userId}.json`);
        // If file exists, merge
        let existing = [];
        if (fs.existsSync(filePath)) {
            existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        
        // Remove duplicates if any
        const merged = [...existing];
        for (const t of txs) {
            if (!merged.find(m => m.id === t.id)) {
                merged.push(t);
            }
        }
        
        fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
        console.log(`✅ Migrated ${txs.length} transactions for user: ${userId}`);
    }

    // Backup and remove the old file to avoid confusion
    const backupPath = path.join(DATA_DIR, 'transactions.json.bak');
    fs.renameSync(TRANSACTIONS_FILE, backupPath);
    console.log(`📦 Old transactions history backed up to ${backupPath}`);
}

migrate().catch(console.error);
