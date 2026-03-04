const express = require('express');
const SupportTicket = require('../models/SupportTicket');
const auth = require('../middleware/auth');
const router = express.Router();

// Create support ticket (anyone can submit)
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message, userId, userRole } = req.body;

    const ticket = new SupportTicket({
      userId: userId || null,
      name,
      email,
      userRole: userRole || 'guest',
      subject,
      message,
      status: 'open'
    });

    await ticket.save();
    res.status(201).json({ message: 'Support ticket submitted successfully', ticket });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tickets (admin only)
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const tickets = await SupportTicket.find({})
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update ticket status (admin only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, priority, adminNotes } = req.body;
    const updateData = { status, priority, adminNotes };

    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date();
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's tickets
router.get('/my-tickets', auth, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
