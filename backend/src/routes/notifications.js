import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} from '../services/notificationService.js';

const router = express.Router();

// Get user notifications
// GET /api/v1/notifications
router.get('/', verifyAuth, async (req, res) => {
  try {
    const { unreadOnly, limit, page } = req.query;
    
    const result = await getUserNotifications(req.user.userId, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit) : 20,
      page: page ? parseInt(page) : 1
    });

    return res.json(result);
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count
// GET /api/v1/notifications/unread-count
router.get('/unread-count', verifyAuth, async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.userId);
    return res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    return res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
// PUT /api/v1/notifications/:id/read
router.put('/:id/read', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const success = await markAsRead(id, req.user.userId);

    if (!success) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
// PUT /api/v1/notifications/mark-all-read
router.put('/mark-all-read', verifyAuth, async (req, res) => {
  try {
    await markAllAsRead(req.user.userId);
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    return res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Get admin notifications (KYC approvals, card approvals, support tickets, deposits, withdrawals, PND accounts, etc.)
// GET /api/v1/notifications/admin
router.get('/admin', verifyAuth, async (req, res) => {
  try {
    const { default: prisma } = await import('../config/prisma.js');
    

    // Get pending KYC submissions
    const pendingKYC = await prisma.user.count({
      where: { kycStatus: 'PENDING' }
    });

    // Get pending credit card approvals
    const pendingCards = await prisma.creditCard.count({
      where: { approvalStatus: 'PENDING' }
    });

    // Get pending transfer approvals
    const pendingTransfers = await prisma.transferRequest.count({
      where: { status: 'PENDING' }
    });

    // Get open support tickets
    const openTickets = await prisma.supportTicket.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
    });

    // Get pending deposits
    const pendingDeposits = await prisma.deposit.count({
      where: { status: 'PENDING' }
    });

    // Get pending withdrawals
    let pendingWithdrawals = 0;
    try {
      pendingWithdrawals = await prisma.withdrawal.count({
        where: { status: 'PENDING' }
      });
    } catch (e) {
      // Withdrawal model may not exist
    }

    // Get PND (Post-No-Debit) restricted accounts
    const pndAccounts = await prisma.user.count({
      where: { accountStatus: 'PND' }
    });

    // Get suspended accounts
    const suspendedAccounts = await prisma.user.count({
      where: { accountStatus: 'SUSPENDED' }
    });

    // Get new users (registered in last 24 hours)
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    // Get recent failed login attempts (last 24 hours)
    let failedLogins = 0;
    try {
      failedLogins = await prisma.auditLog.count({
        where: {
          action: 'FAILED_LOGIN',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });
    } catch (e) {
      // AuditLog may not exist
    }

    // Create notification objects
    const notifications = [];
    
    if (pendingKYC > 0) {
      notifications.push({
        id: 'kyc-pending',
        type: 'kyc_approval',
        title: 'Pending KYC Approvals',
        message: `${pendingKYC} KYC submission${pendingKYC > 1 ? 's' : ''} awaiting review`,
        count: pendingKYC,
        priority: 'high',
        link: '/mybanker?section=kyc',
        createdAt: new Date(),
        isRead: false
      });
    }

    if (pendingCards > 0) {
      notifications.push({
        id: 'card-pending',
        type: 'card_approval',
        title: 'Pending Card Approvals',
        message: `${pendingCards} credit card application${pendingCards > 1 ? 's' : ''} awaiting approval`,
        count: pendingCards,
        priority: 'high',
        link: '/mybanker?section=cards',
        createdAt: new Date(),
        isRead: false
      });
    }

    if (pendingTransfers > 0) {
      notifications.push({
        id: 'transfer-pending',
        type: 'transaction',
        title: 'Pending Transfer Approvals',
        message: `${pendingTransfers} transfer${pendingTransfers > 1 ? 's' : ''} awaiting approval`,
        count: pendingTransfers,
        priority: 'high',
        link: '/mybanker?section=transfers',
        createdAt: new Date(),
        isRead: false
      });
    }

    if (pendingDeposits > 0) {
      notifications.push({
        id: 'deposit-pending',
        type: 'deposit',
        title: 'Pending Deposit Approvals',
        message: `${pendingDeposits} deposit${pendingDeposits > 1 ? 's' : ''} awaiting approval`,
        count: pendingDeposits,
        priority: 'high',
        link: '/mybanker?section=deposits',
        createdAt: new Date(),
        isRead: false
      });
    }

    if (pendingWithdrawals > 0) {
      notifications.push({
        id: 'withdrawal-pending',
        type: 'withdrawal',
        title: 'Pending Withdrawal Requests',
        message: `${pendingWithdrawals} withdrawal${pendingWithdrawals > 1 ? 's' : ''} awaiting processing`,
        count: pendingWithdrawals,
        priority: 'high',
        link: '/mybanker?section=withdrawals',
        createdAt: new Date(),
        isRead: false
      });
    }

    if (openTickets > 0) {
      notifications.push({
        id: 'tickets-open',
        type: 'support',
        title: 'Open Support Tickets',
        message: `${openTickets} support ticket${openTickets > 1 ? 's' : ''} need attention`,
        count: openTickets,
        priority: 'medium',
        link: '/mybanker?section=support',
        createdAt: new Date(),
        isRead: false
      });
    }

    if (pndAccounts > 0) {
      notifications.push({
        id: 'pnd-accounts',
        type: 'account_restriction',
        title: 'PND Restricted Accounts',
        message: `${pndAccounts} account${pndAccounts > 1 ? 's' : ''} under PND restriction`,
        count: pndAccounts,
        priority: 'medium',
        link: '/mybanker?section=users&filter=PND',
        createdAt: new Date(),
        isRead: false
      });
    }

    if (suspendedAccounts > 0) {
      notifications.push({
        id: 'suspended-accounts',
        type: 'account_restriction',
        title: 'Suspended Accounts',
        message: `${suspendedAccounts} account${suspendedAccounts > 1 ? 's' : ''} currently suspended`,
        count: suspendedAccounts,
        priority: 'low',
        link: '/mybanker?section=users&filter=SUSPENDED',
        createdAt: new Date(),
        isRead: false
      });
    }

    if (newUsers > 0) {
      notifications.push({
        id: 'new-users',
        type: 'user',
        title: 'New User Registrations',
        message: `${newUsers} new user${newUsers > 1 ? 's' : ''} registered in the last 24 hours`,
        count: newUsers,
        priority: 'low',
        link: '/mybanker?section=users',
        createdAt: new Date(),
        isRead: false
      });
    }

    if (failedLogins > 5) {
      notifications.push({
        id: 'failed-logins',
        type: 'security',
        title: 'Failed Login Attempts',
        message: `${failedLogins} failed login attempt${failedLogins > 1 ? 's' : ''} in the last 24 hours`,
        count: failedLogins,
        priority: failedLogins > 20 ? 'high' : 'medium',
        link: '/mybanker?section=audit',
        createdAt: new Date(),
        isRead: false
      });
    }

    // Sort by priority (high first)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    notifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    await prisma.$disconnect();

    return res.json({
      success: true,
      notifications,
      unreadCount: notifications.filter(n => n.priority === 'high').length,
      totalCount: notifications.length,
      summary: {
        pendingKYC,
        pendingCards,
        pendingTransfers,
        pendingDeposits,
        pendingWithdrawals,
        openTickets,
        pndAccounts,
        suspendedAccounts,
        newUsers,
        failedLogins
      }
    });
  } catch (error) {
    console.error('Get admin notifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin notifications' });
  }
});

// Clear all notifications
// DELETE /api/v1/notifications/clear-all
router.delete('/clear-all', verifyAuth, async (req, res) => {
  try {
    const { default: prisma } = await import('../config/prisma.js');
    
    
    await prisma.notification.deleteMany({
      where: { userId: req.user.userId }
    });
    
    await prisma.$disconnect();
    return res.json({ message: 'All notifications cleared' });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    return res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

// Delete notification
// DELETE /api/v1/notifications/:id
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const success = await deleteNotification(id, req.user.userId);

    if (!success) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
