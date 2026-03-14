const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const auth = require('../middleware/auth');

// Create a new support ticket
router.post('/', auth, async (req, res) => {
  try {
    console.log('📝 Creating support ticket...');
    console.log('📝 User:', req.user);
    console.log('📝 Request body:', req.body);
    
    const { subject, description, priority = 'Medium' } = req.body;
    
    if (!subject || !description) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: 'Subject and description are required' });
    }

    if (!req.user || !req.user.id) {
      console.log('❌ User not found in request');
      return res.status(401).json({ message: 'User authentication required' });
    }

    const ticketData = {
      userId: req.user.id,
      customerName: req.user.name || 'Unknown User',
      customerEmail: req.user.email || 'unknown@email.com',
      subject,
      description,
      priority,
      messages: [{
        sender: 'customer',
        senderName: req.user.name || 'Customer',
        message: description,
        timestamp: new Date()
      }]
    };

    console.log('📝 Ticket data to save:', ticketData);

    const ticket = new SupportTicket(ticketData);
    console.log('📝 Saving ticket...');
    await ticket.save();
    console.log('📝 Ticket saved successfully:', ticket.ticketId);
    console.log('📝 Saved ticket data:', {
      _id: ticket._id,
      ticketId: ticket.ticketId,
      customerName: ticket.customerName,
      customerEmail: ticket.customerEmail,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority
    });

    res.status(201).json({
      message: 'Support ticket created successfully',
      ticket: {
        _id: ticket._id,
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error creating support ticket:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to create support ticket',
      error: error.message 
    });
  }
});

// Get all support tickets for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    console.log('📎 Fetching support tickets...');
    console.log('📎 User:', req.user);
    
    if (!req.user || !req.user.id) {
      console.log('❌ User not found in request');
      return res.status(401).json({ message: 'User authentication required' });
    }

    const tickets = await SupportTicket.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('-__v');

    console.log('📎 Found tickets:', tickets.length);

    res.json({
      message: 'Support tickets retrieved successfully',
      tickets
    });
  } catch (error) {
    console.error('❌ Error fetching support tickets:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch support tickets',
      error: error.message 
    });
  }
});

// Get a specific support ticket
router.get('/:ticketId', auth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({
      $or: [
        { ticketId: req.params.ticketId },
        { _id: req.params.ticketId }
      ],
      userId: req.user.id
    }).select('-__v');

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    res.json({
      message: 'Support ticket retrieved successfully',
      ticket
    });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    res.status(500).json({ message: 'Failed to fetch support ticket' });
  }
});

// Add a message to a support ticket
router.post('/:ticketId/messages', auth, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const ticket = await SupportTicket.findOne({
      $or: [
        { ticketId: req.params.ticketId },
        { _id: req.params.ticketId }
      ],
      userId: req.user.id
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    if (ticket.status === 'Closed') {
      return res.status(400).json({ message: 'Cannot add messages to a closed ticket' });
    }

    const newMessage = {
      sender: 'customer',
      senderName: req.user.name,
      message: message.trim(),
      timestamp: new Date()
    };

    ticket.messages.push(newMessage);
    ticket.updatedAt = new Date();
    
    // If ticket was resolved, change back to in progress
    if (ticket.status === 'Resolved') {
      ticket.status = 'In Progress';
    }

    await ticket.save();

    res.json({
      message: 'Message added successfully',
      ticket
    });
  } catch (error) {
    console.error('Error adding message to ticket:', error);
    res.status(500).json({ message: 'Failed to add message' });
  }
});

// Update ticket status (for admin use)
router.patch('/:ticketId/status', auth, async (req, res) => {
  try {
    console.log('🔄 Updating ticket status...');
    console.log('🔄 User:', req.user);
    console.log('🔄 Ticket ID:', req.params.ticketId);
    console.log('🔄 Request body:', req.body);
    
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      console.log('❌ Access denied - not admin');
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { status, priority, adminNotes } = req.body;
    
    // Normalize status values
    const statusMap = {
      'open': 'Open',
      'in-progress': 'In Progress', 
      'resolved': 'Resolved',
      'closed': 'Closed'
    };
    
    const normalizedStatus = statusMap[status] || status;
    const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    
    if (status && !validStatuses.includes(normalizedStatus)) {
      console.log('❌ Invalid status:', status, 'normalized:', normalizedStatus);
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    if (priority && !validPriorities.includes(priority)) {
      console.log('❌ Invalid priority:', priority);
      return res.status(400).json({ message: 'Invalid priority value' });
    }

    const ticket = await SupportTicket.findOne({
      $or: [
        { ticketId: req.params.ticketId },
        { _id: req.params.ticketId }
      ]
    });

    if (!ticket) {
      console.log('❌ Ticket not found:', req.params.ticketId);
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    console.log('🎫 Found ticket:', ticket.ticketId, 'current status:', ticket.status);

    // Update fields
    if (status) ticket.status = normalizedStatus;
    if (priority) ticket.priority = priority;
    if (adminNotes) ticket.adminNotes = adminNotes;
    
    ticket.updatedAt = new Date();
    await ticket.save();

    console.log('✅ Ticket updated successfully:', {
      ticketId: ticket.ticketId,
      newStatus: ticket.status,
      newPriority: ticket.priority
    });

    res.json({
      message: 'Ticket updated successfully',
      ticket
    });
  } catch (error) {
    console.error('❌ Error updating ticket:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to update ticket',
      error: error.message 
    });
  }
});

// Admin: Add message to any ticket
router.post('/:ticketId/admin-message', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const ticket = await SupportTicket.findOne({
      $or: [
        { ticketId: req.params.ticketId },
        { _id: req.params.ticketId }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    const newMessage = {
      sender: 'admin',
      senderName: req.user.name || 'Support Team',
      message: message.trim(),
      timestamp: new Date()
    };

    ticket.messages.push(newMessage);
    ticket.updatedAt = new Date();
    
    // Update status to In Progress if it was Open
    if (ticket.status === 'Open') {
      ticket.status = 'In Progress';
    }

    await ticket.save();

    res.json({
      message: 'Admin message added successfully',
      ticket
    });
  } catch (error) {
    console.error('Error adding admin message:', error);
    res.status(500).json({ message: 'Failed to add admin message' });
  }
});

// Admin: Get all support tickets
router.get('/admin/all', auth, async (req, res) => {
  try {
    console.log('🔍 Admin fetching all support tickets...');
    console.log('🔍 User:', req.user);
    console.log('🔍 User role:', req.user?.role);
    
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      console.log('❌ Access denied - not admin');
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { status, priority, page = 1, limit = 50 } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;

    console.log('🔍 Query:', query);
    console.log('🔍 Pagination:', { page, limit });

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name email role')
      .select('-__v');

    const total = await SupportTicket.countDocuments(query);

    console.log('🔍 Found tickets:', tickets.length);
    console.log('🔍 Total tickets:', total);
    console.log('🔍 Sample ticket raw:', tickets[0] ? {
      _id: tickets[0]._id,
      ticketId: tickets[0].ticketId,
      subject: tickets[0].subject,
      status: tickets[0].status,
      customerName: tickets[0].customerName,
      customerEmail: tickets[0].customerEmail,
      description: tickets[0].description,
      priority: tickets[0].priority,
      userId: tickets[0].userId
    } : 'No tickets');

    // Normalize ticket data
    const normalizedTickets = tickets.map(ticket => {
      const ticketObj = ticket.toObject ? ticket.toObject() : ticket;
      console.log('🔍 Processing ticket:', {
        _id: ticketObj._id,
        customerName: ticketObj.customerName,
        customerEmail: ticketObj.customerEmail,
        description: ticketObj.description,
        subject: ticketObj.subject
      });
      
      return {
        ...ticketObj,
        // Ensure consistent field names for frontend
        name: ticketObj.customerName || 'Unknown User',
        email: ticketObj.customerEmail || 'No email provided',
        message: ticketObj.description || 'No description provided',
        userRole: ticketObj.userId?.role || 'guest',
        createdAt: ticketObj.createdAt,
        // Keep original status format for admin dashboard
        status: ticketObj.status || 'open'
      };
    });
    
    console.log('🔍 Sample normalized ticket:', normalizedTickets[0] ? {
      _id: normalizedTickets[0]._id,
      name: normalizedTickets[0].name,
      email: normalizedTickets[0].email,
      message: normalizedTickets[0].message,
      subject: normalizedTickets[0].subject,
      status: normalizedTickets[0].status
    } : 'No normalized tickets');

    res.json({
      message: 'Support tickets retrieved successfully',
      tickets: normalizedTickets,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('❌ Error fetching all support tickets:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch support tickets',
      error: error.message 
    });
  }
});

module.exports = router;