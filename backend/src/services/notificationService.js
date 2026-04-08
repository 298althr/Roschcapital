import prisma from '../config/prisma.js';

/**
 * Create a notification for a user
 */
export const createNotification = async (userId, type, title, message, metadata = null) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        read: false
      }
    });
    
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
};

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (userId, options = {}) => {
  const {
    unreadOnly = false,
    limit = 20,
    page = 1
  } = options;
  
  const where = { userId };
  
  if (unreadOnly) {
    where.read = false;
  }
  
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } })
  ]);
  
  return {
    notifications,
    total,
    unreadCount,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId, userId) => {
  const notification = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId // Ensure user owns this notification
    },
    data: {
      read: true
    }
  });
  
  return notification.count > 0;
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId) => {
  await prisma.notification.updateMany({
    where: {
      userId,
      read: false
    },
    data: {
      read: true
    }
  });
  
  return true;
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId, userId) => {
  const notification = await prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId // Ensure user owns this notification
    }
  });
  
  return notification.count > 0;
};

/**
 * Get unread count for a user
 */
export const getUnreadCount = async (userId) => {
  const count = await prisma.notification.count({
    where: {
      userId,
      read: false
    }
  });
  
  return count;
};

/**
 * Create transaction notification
 */
export const notifyTransaction = async (userId, transaction, type) => {
  const isIncoming = type === 'received';
  const title = isIncoming ? 'Money Received' : 'Money Sent';
  const message = isIncoming
    ? `You received $${transaction.amount} ${transaction.description ? `- ${transaction.description}` : ''}`
    : `You sent $${transaction.amount} ${transaction.description ? `- ${transaction.description}` : ''}`;
  
  return await createNotification(userId, 'transaction', title, message, {
    transactionId: transaction.id,
    amount: transaction.amount.toString(),
    type
  });
};

/**
 * Create KYC status notification
 */
export const notifyKYCStatus = async (userId, status, reason = null) => {
  let title, message;
  
  switch (status) {
    case 'UNDER_REVIEW':
      title = 'KYC Under Review';
      message = 'Your KYC documents are being reviewed by our team.';
      break;
    case 'APPROVED':
      title = 'KYC Approved!';
      message = 'Your account has been verified. You now have full access to all features.';
      break;
    case 'REJECTED':
      title = 'KYC Rejected';
      message = reason || 'Your KYC submission was rejected. Please resubmit with correct documents.';
      break;
    default:
      title = 'KYC Status Update';
      message = `Your KYC status has been updated to ${status}`;
  }
  
  return await createNotification(userId, 'kyc', title, message, {
    status,
    reason
  });
};

/**
 * Create security notification
 */
export const notifySecurityEvent = async (userId, event, details = null) => {
  let title, message;
  
  switch (event) {
    case 'NEW_LOGIN':
      title = 'New Login Detected';
      message = `A new login was detected from ${details?.ipAddress || 'unknown location'}`;
      break;
    case 'PASSWORD_CHANGED':
      title = 'Password Changed';
      message = 'Your password was successfully changed.';
      break;
    case 'BACKUP_CODE_USED':
      title = 'Backup Code Used';
      message = `A backup code was used for ${details?.action || 'authentication'}`;
      break;
    default:
      title = 'Security Alert';
      message = 'A security event occurred on your account.';
  }
  
  return await createNotification(userId, 'security', title, message, details);
};
