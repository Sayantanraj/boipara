const express = require('express');
const Return = require('../models/Return');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const router = express.Router();

// Create return request (customer)
router.post('/', auth, async (req, res) => {
  try {
    const { orderId, sellerId, sellerName, items, reason, description } = req.body;
    
    // Verify the order belongs to the user
    const order = await Order.findById(orderId);
    if (!order || order.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Order not found or access denied' });
    }

    // Create return request
    const returnRequest = new Return({
      orderId,
      userId: req.user.id,
      sellerId,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone,
      sellerName,
      items: items.map(item => ({
        bookId: item.book._id || item.book.id,
        quantity: item.quantity,
        book: item.book
      })),
      reason,
      description,
      status: 'pending-admin'
    });

    await returnRequest.save();
    
    // Create notification
    await Notification.create({
      userId: req.user.id,
      type: 'return',
      title: 'Return Request Submitted',
      message: 'Your return request has been submitted and is pending admin approval.',
      returnId: returnRequest._id,
      link: '/orders'
    });
    
    res.status(201).json({ message: 'Return request created successfully', returnRequest });
  } catch (error) {
    console.error('Error creating return request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get customer's return requests
router.get('/my-returns', auth, async (req, res) => {
  try {
    const returns = await Return.find({ userId: req.user.id })
      .populate('orderId')
      .sort({ createdAt: -1 });
    
    const formattedReturns = returns.map(returnReq => ({
      id: returnReq._id,
      orderId: returnReq.orderId._id,
      status: returnReq.status,
      reason: returnReq.reason,
      description: returnReq.description,
      requestDate: returnReq.createdAt.toLocaleDateString(),
      items: returnReq.items
    }));
    
    res.json(formattedReturns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get seller's return requests
router.get('/seller/my-returns', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ error: 'Seller access required' });
    }

    const returns = await Return.find({ sellerId: req.user.id })
      .populate('orderId')
      .populate('userId')
      .sort({ createdAt: -1 });
    
    const formattedReturns = returns.map(returnReq => ({
      id: returnReq._id,
      orderId: returnReq.orderId._id,
      userId: returnReq.userId._id,
      customerName: returnReq.customerName || returnReq.userId.name,
      customerEmail: returnReq.customerEmail || returnReq.userId.email,
      customerPhone: returnReq.customerPhone || returnReq.userId.phone,
      sellerName: returnReq.sellerName,
      reason: returnReq.reason,
      description: returnReq.description,
      status: returnReq.status,
      adminNotes: returnReq.adminNotes,
      requestDate: returnReq.createdAt.toLocaleDateString(),
      items: returnReq.items.map(item => ({
        bookId: item.bookId,
        quantity: item.quantity,
        book: item.book
      }))
    }));
    
    res.json(formattedReturns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all returns (admin only)
router.get('/admin/all-returns', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const returns = await Return.find({})
      .populate('orderId')
      .populate('userId')
      .sort({ createdAt: -1 });
    
    const formattedReturns = returns.map(returnReq => ({
      id: returnReq._id,
      orderId: returnReq.orderId?._id || returnReq.orderId,
      userId: returnReq.userId?._id || returnReq.userId,
      customerName: returnReq.customerName || returnReq.userId?.name || 'Unknown Customer',
      sellerName: returnReq.sellerName || 'Unknown Seller',
      reason: returnReq.reason,
      description: returnReq.description,
      status: returnReq.status,
      adminNotes: returnReq.adminNotes,
      requestDate: returnReq.createdAt.toLocaleDateString(),
      items: returnReq.items.map(item => ({
        bookId: item.bookId,
        quantity: item.quantity,
        book: item.book
      }))
    }));
    
    res.json(formattedReturns);
  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update return status (admin only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, adminNotes } = req.body;
    const returnReq = await Return.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes },
      { new: true }
    );

    if (!returnReq) {
      return res.status(404).json({ error: 'Return request not found' });
    }

    // Create notification based on status
    const statusMessages = {
      'approved-by-admin': { title: 'Return Approved', message: 'Your return request has been approved by admin. The seller will process your refund.' },
      'rejected-by-admin': { title: 'Return Rejected', message: 'Your return request has been rejected. Please contact support for more details.' },
      'refund-issued': { title: 'Refund Issued', message: 'Your refund has been issued successfully.' },
      'completed': { title: 'Return Completed', message: 'Your return has been completed successfully.' }
    };

    if (statusMessages[status]) {
      await Notification.create({
        userId: returnReq.userId,
        type: 'return',
        title: statusMessages[status].title,
        message: statusMessages[status].message,
        returnId: returnReq._id,
        link: '/orders'
      });

      // Notify seller if return is approved
      if (status === 'approved-by-admin' && returnReq.sellerId) {
        await Notification.create({
          userId: returnReq.sellerId,
          type: 'return',
          title: 'Return Request Approved',
          message: `A return request from ${returnReq.customerName} has been approved by admin. Please process the refund.`,
          returnId: returnReq._id,
          link: '/seller/dashboard'
        });
      }
    }

    res.json(returnReq);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process return and issue refund (seller only)
router.patch('/:id/process', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ error: 'Seller access required' });
    }

    const { refundAmount, sellerNotes } = req.body;
    
    // Find the return request
    const returnReq = await Return.findById(req.params.id);
    if (!returnReq) {
      return res.status(404).json({ error: 'Return request not found' });
    }

    // Verify the return belongs to this seller
    if (returnReq.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if return is approved by admin
    if (returnReq.status !== 'approved-by-admin') {
      return res.status(400).json({ error: 'Return must be approved by admin first' });
    }

    // Update return status to processed
    returnReq.status = 'refund-issued';
    returnReq.refundAmount = refundAmount;
    returnReq.sellerNotes = sellerNotes;
    returnReq.processedAt = new Date();
    
    await returnReq.save();

    // Create notification
    await Notification.create({
      userId: returnReq.userId,
      type: 'return',
      title: 'Refund Issued',
      message: `Your refund of ₹${refundAmount} has been issued successfully.`,
      returnId: returnReq._id,
      link: '/orders'
    });

    res.json({ 
      message: 'Return processed and refund issued successfully', 
      returnRequest: returnReq 
    });
  } catch (error) {
    console.error('Error processing return:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;