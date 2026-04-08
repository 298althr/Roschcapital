import prisma from '../config/prisma.js';

// Generate ticket number
export const generateTicketNumber = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp}${random}`.toUpperCase();
};

// Create support ticket
export const createSupportTicket = async (userId, ticketData) => {
  const { subject, category, priority, description } = ticketData;

  const ticketNumber = generateTicketNumber();

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      ticketNumber,
      subject,
      category,
      priority: priority || 'MEDIUM',
      status: 'OPEN'
    }
  });

  // Create initial message with the description
  if (description) {
    await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: userId,
        senderType: 'USER',
        message: description,
        isRead: false
      }
    });
  }

  // Create notification
  await prisma.notification.create({
    data: {
      userId,
      type: 'support',
      title: 'Support Ticket Created',
      message: `Your support ticket ${ticketNumber} has been created. We'll respond shortly.`,
      metadata: {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber
      }
    }
  });

  return {
    success: true,
    message: 'Support ticket created successfully',
    ticket
  };
};

// Get user's tickets
export const getUserTickets = async (userId) => {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return {
    success: true,
    count: tickets.length,
    tickets
  };
};

// Get ticket by ID
export const getTicketById = async (ticketId, userId) => {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, userId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  // Fetch sender details for each message
  const messagesWithSenders = await Promise.all(
    ticket.messages.map(async (msg) => {
      const sender = await prisma.user.findUnique({
        where: { id: msg.senderId },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          isAdmin: true
        }
      });
      return { ...msg, sender };
    })
  );

  return {
    success: true,
    ticket: { ...ticket, messages: messagesWithSenders }
  };
};

// Add message to ticket
export const addTicketMessage = async (ticketId, userId, message) => {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, userId }
  });

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  const ticketMessage = await prisma.supportMessage.create({
    data: {
      ticketId,
      userId,
      message
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  // Update ticket's last activity
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() }
  });

  return {
    success: true,
    message: 'Message added successfully',
    ticketMessage
  };
};

// Admin: Get all tickets
export const getAllTickets = async (status) => {
  const where = status ? { status } : {};

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return {
    success: true,
    count: tickets.length,
    tickets
  };
};

// Admin: Update ticket status
export const updateTicketStatus = async (ticketId, status, adminId) => {
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status,
      assignedToId: status === 'IN_PROGRESS' ? adminId : undefined
    }
  });

  // Notify user
  await prisma.notification.create({
    data: {
      userId: ticket.userId,
      type: 'support',
      title: 'Ticket Status Updated',
      message: `Your support ticket ${ticket.reference} status has been updated to ${status}.`,
      metadata: {
        ticketId: ticket.id,
        reference: ticket.reference,
        status
      }
    }
  });

  return {
    success: true,
    message: 'Ticket status updated',
    ticket
  };
};

// Admin: Add message to any ticket
export const addAdminMessage = async (ticketId, adminId, message) => {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId }
  });

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  const ticketMessage = await prisma.supportMessage.create({
    data: {
      ticketId,
      userId: adminId,
      message
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          isAdmin: true
        }
      }
    }
  });

  // Update ticket status to IN_PROGRESS if OPEN
  if (ticket.status === 'OPEN') {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'IN_PROGRESS',
        assignedToId: adminId
      }
    });
  }

  // Notify user
  await prisma.notification.create({
    data: {
      userId: ticket.userId,
      type: 'support',
      title: 'New Message on Your Ticket',
      message: `You have a new message on ticket ${ticket.reference}.`,
      metadata: {
        ticketId: ticket.id,
        reference: ticket.reference
      }
    }
  });

  return {
    success: true,
    message: 'Message added successfully',
    ticketMessage
  };
};

export default {
  createSupportTicket,
  getUserTickets,
  getTicketById,
  addTicketMessage,
  getAllTickets,
  updateTicketStatus,
  addAdminMessage
};
