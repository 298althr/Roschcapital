import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import * as backupService from '../services/backupService.js';
import prisma from '../config/prisma.js';

const backupRouter = express.Router();

/**
 * Middleware to verify admin access
 */
const verifyAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user || !user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error verifying admin access'
    });
  }
};

/**
 * POST /api/v1/backup/create
 * Create a new database backup (admin only)
 */
backupRouter.post('/create', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const result = await backupService.createDatabaseBackup();
    
    return res.json({
      success: true,
      message: 'Backup created successfully',
      backup: result
    });
  } catch (error) {
    console.error('Backup creation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/v1/backup/list
 * List all available backups (admin only)
 */
backupRouter.get('/list', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const backups = backupService.listBackups();
    
    return res.json({
      success: true,
      backups
    });
  } catch (error) {
    console.error('List backups error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/v1/backup/stats
 * Get backup statistics (admin only)
 */
backupRouter.get('/stats', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const stats = backupService.getBackupStats();
    
    return res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Backup stats error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/v1/backup/cleanup
 * Clean up old backups (admin only)
 */
backupRouter.post('/cleanup', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { keepCount = 7 } = req.body;
    const result = backupService.cleanupOldBackups(keepCount);
    
    return res.json({
      success: true,
      message: 'Cleanup completed',
      result
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/v1/backup/restore
 * Restore database from backup (admin only)
 * WARNING: This will overwrite the current database!
 */
backupRouter.post('/restore', verifyAuth, verifyAdmin, async (req, res) => {
  try {
    const { fileName } = req.body;
    
    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'Backup file name is required'
      });
    }

    const result = await backupService.restoreDatabaseBackup(fileName);
    
    return res.json({
      success: true,
      message: 'Database restored successfully',
      result
    });
  } catch (error) {
    console.error('Restore error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default backupRouter;
