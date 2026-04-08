import prisma from '../config/prisma.js';

/**
 * Log a user action for audit trail
 */
export const logAction = async (userId, action, ipAddress, userAgent, metadata = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        ipAddress,
        userAgent,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
      }
    });
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Don't throw - audit logging should never break the main flow
  }
};

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (filters = {}) => {
  const {
    userId,
    action,
    startDate,
    endDate,
    page = 1,
    limit = 50
  } = filters;
  
  const where = {};
  
  if (userId) {
    where.userId = userId;
  }
  
  if (action) {
    where.action = action;
  }
  
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }
  
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.auditLog.count({ where })
  ]);
  
  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Get recent activity for a specific user
 */
export const getUserActivity = async (userId, limit = 20) => {
  const logs = await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
  
  return logs;
};

/**
 * Get login history for a user
 */
export const getLoginHistory = async (userId, limit = 10) => {
  const logs = await prisma.auditLog.findMany({
    where: {
      userId,
      action: { in: ['LOGIN_SUCCESS', 'LOGIN_ATTEMPT', 'LOGIN_FAILED'] }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
  
  return logs;
};

/**
 * Get all actions of a specific type
 */
export const getActionsByType = async (action, limit = 100) => {
  const logs = await prisma.auditLog.findMany({
    where: { action },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
  
  return logs;
};

/**
 * Get audit statistics
 */
export const getAuditStats = async (startDate, endDate) => {
  const where = {};
  
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }
  
  const [
    totalLogs,
    registrations,
    logins,
    transfers,
    kycSubmissions
  ] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.count({ where: { ...where, action: 'REGISTER' } }),
    prisma.auditLog.count({ where: { ...where, action: 'LOGIN_SUCCESS' } }),
    prisma.auditLog.count({ where: { ...where, action: 'TRANSFER' } }),
    prisma.auditLog.count({ where: { ...where, action: 'KYC_SUBMIT' } })
  ]);
  
  return {
    totalLogs,
    registrations,
    logins,
    transfers,
    kycSubmissions
  };
};
