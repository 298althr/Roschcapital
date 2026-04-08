import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/app.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backup directory
const BACKUP_DIR = path.join(__dirname, '../../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Parse DATABASE_URL to extract connection details
 */
const parseDatabaseUrl = (url) => {
  try {
    const dbUrl = new URL(url);
    return {
      user: dbUrl.username,
      password: dbUrl.password,
      host: dbUrl.hostname,
      port: dbUrl.port || '5432',
      database: dbUrl.pathname.substring(1), // Remove leading slash
    };
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error);
    return null;
  }
};

/**
 * Create a database backup using pg_dump
 */
export const createDatabaseBackup = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-${timestamp}.sql`;
  const backupPath = path.join(BACKUP_DIR, backupFileName);

  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  
  if (!dbConfig) {
    throw new Error('Invalid DATABASE_URL configuration');
  }

  try {
    // Set PGPASSWORD environment variable for pg_dump
    const env = {
      ...process.env,
      PGPASSWORD: dbConfig.password,
    };

    // Use pg_dump to create backup
    const command = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -F p -f "${backupPath}"`;
    
    console.log(`🔄 Creating database backup: ${backupFileName}`);
    await execAsync(command, { env });
    
    const stats = fs.statSync(backupPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Backup created successfully: ${backupFileName} (${fileSizeMB} MB)`);
    
    return {
      success: true,
      fileName: backupFileName,
      filePath: backupPath,
      fileSize: stats.size,
      fileSizeMB,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    
    // Clean up failed backup file if it exists
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
    
    throw new Error(`Backup failed: ${error.message}`);
  }
};

/**
 * List all available backups
 */
export const listBackups = () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          fileName: file,
          filePath,
          fileSize: stats.size,
          fileSizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt); // Sort by newest first

    return backups;
  } catch (error) {
    console.error('Error listing backups:', error);
    return [];
  }
};

/**
 * Delete old backups (keep only last N backups)
 */
export const cleanupOldBackups = (keepCount = 7) => {
  try {
    const backups = listBackups();
    
    if (backups.length <= keepCount) {
      console.log(`📦 ${backups.length} backups found, no cleanup needed (keeping ${keepCount})`);
      return { deleted: 0, kept: backups.length };
    }

    const toDelete = backups.slice(keepCount);
    let deletedCount = 0;

    toDelete.forEach(backup => {
      try {
        fs.unlinkSync(backup.filePath);
        console.log(`🗑️  Deleted old backup: ${backup.fileName}`);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete ${backup.fileName}:`, error.message);
      }
    });

    console.log(`✅ Cleanup complete: deleted ${deletedCount}, kept ${keepCount}`);
    return { deleted: deletedCount, kept: keepCount };
  } catch (error) {
    console.error('Error during cleanup:', error);
    return { deleted: 0, kept: 0, error: error.message };
  }
};

/**
 * Restore database from backup file
 */
export const restoreDatabaseBackup = async (backupFileName) => {
  const backupPath = path.join(BACKUP_DIR, backupFileName);

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupFileName}`);
  }

  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  
  if (!dbConfig) {
    throw new Error('Invalid DATABASE_URL configuration');
  }

  try {
    // Set PGPASSWORD environment variable for psql
    const env = {
      ...process.env,
      PGPASSWORD: dbConfig.password,
    };

    // Use psql to restore backup
    const command = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f "${backupPath}"`;
    
    console.log(`🔄 Restoring database from: ${backupFileName}`);
    await execAsync(command, { env });
    
    console.log(`✅ Database restored successfully from: ${backupFileName}`);
    
    return {
      success: true,
      fileName: backupFileName,
      restoredAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    throw new Error(`Restore failed: ${error.message}`);
  }
};

/**
 * Get backup statistics
 */
export const getBackupStats = () => {
  const backups = listBackups();
  
  if (backups.length === 0) {
    return {
      totalBackups: 0,
      totalSize: 0,
      totalSizeMB: '0.00',
      oldestBackup: null,
      newestBackup: null,
    };
  }

  const totalSize = backups.reduce((sum, backup) => sum + backup.fileSize, 0);
  
  return {
    totalBackups: backups.length,
    totalSize,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    oldestBackup: backups[backups.length - 1],
    newestBackup: backups[0],
  };
};

/**
 * Schedule automatic backups (call this on server start)
 */
export const scheduleAutomaticBackups = (intervalHours = 24) => {
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  console.log(`📅 Scheduling automatic backups every ${intervalHours} hours`);
  
  // Create initial backup
  createDatabaseBackup()
    .then(() => cleanupOldBackups(7))
    .catch(error => console.error('Initial backup failed:', error));

  // Schedule recurring backups
  setInterval(async () => {
    try {
      await createDatabaseBackup();
      await cleanupOldBackups(7); // Keep last 7 backups
    } catch (error) {
      console.error('Scheduled backup failed:', error);
    }
  }, intervalMs);
};

export default {
  createDatabaseBackup,
  listBackups,
  cleanupOldBackups,
  restoreDatabaseBackup,
  getBackupStats,
  scheduleAutomaticBackups,
};
