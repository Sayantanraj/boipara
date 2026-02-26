const express = require('express');
const Order = require('../models/Order');
const Book = require('../models/Book');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const router = express.Router();

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    
    let subtotal = 0;
    const orderItems = [];

    for (let item of items) {
      const book = await Book.findById(item.bookId);
      if (!book) {
        return res.status(400).json({ error: `Book not found: ${item.bookId}` });
      }
      if (book.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${book.title}` });
      }
      
      orderItems.push({
        bookId: item.bookId,
        quantity: item.quantity,
        price: book.price
      });
      
      subtotal += book.price * item.quantity;
      
      // Update stock
      book.stock -= item.quantity;
      await book.save();
    }

    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + shipping;

    const order = new Order({
      userId: req.user.id,
      items: orderItems,
      subtotal,
      shipping,
      total,
      shippingAddress,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone,
      status: 'new'
    });

    await order.save();
    await order.populate('items.bookId');

    // Create notification for customer
    await Notification.create({
      userId: req.user.id,
      type: 'order',
      title: 'Order Placed Successfully',
      message: `Your order of ₹${order.total} has been placed successfully. Order ID: ${order._id.toString().slice(-6)}`,
      orderId: order._id,
      link: '/orders'
    });

    // Create notifications for sellers
    console.log('🔍 Starting seller notification creation...');
    console.log('📦 Order items:', orderItems.length);
    
    const sellerIds = new Set();
    for (let item of orderItems) {
      const book = await Book.findById(item.bookId);
      console.log('📖 Book found:', book ? book.title : 'NULL');
      console.log('👤 Book sellerId:', book ? book.sellerId : 'NULL');
      
      if (book && book.sellerId) {
        const sellerIdString = book.sellerId.toString();
        sellerIds.add(sellerIdString);
        console.log('✅ Added seller ID:', sellerIdString);
      } else {
        console.log('⚠️ Book has no sellerId:', item.bookId);
      }
    }

    console.log('👥 Total unique sellers found:', sellerIds.size);
    console.log('👥 Seller IDs:', Array.from(sellerIds));
    
    for (let sellerId of sellerIds) {
      try {
        console.log('📬 Creating notification for seller:', sellerId);
        const notification = await Notification.create({
          userId: sellerId,
          type: 'order',
          title: 'New Order Received',
          message: `You have received a new order from ${req.user.name}. Order ID: ${order._id.toString().slice(-6)}`,
          orderId: order._id,
          link: '/seller/dashboard'
        });
        console.log('✅ Notification created successfully:', notification._id);
      } catch (notifError) {
        console.error('❌ Error creating notification for seller', sellerId, ':', notifError);
      }
    }

    // Real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`customer-${req.user.id}`).emit('order-created', {
        orderId: order._id,
        status: order.status,
        total: order.total
      });
      
      // Notify sellers
      for (let sellerId of sellerIds) {
        io.to(`seller-${sellerId}`).emit('new-order', {
          orderId: order._id,
          customerName: req.user.name
        });
      }
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('items.bookId')
      .sort({ createdAt: -1 });
    
    // Format orders for frontend
    const formattedOrders = orders.map(order => ({
      id: order._id.toString(),
      userId: order.userId.toString(),
      items: order.items.map(item => ({
        bookId: item.bookId?._id?.toString() || item.bookId,
        quantity: item.quantity,
        book: item.bookId ? {
          id: item.bookId._id?.toString(),
          title: item.bookId.title,
          author: item.bookId.author,
          price: item.bookId.price,
          image: item.bookId.image,
          sellerName: item.bookId.sellerName || 'Unknown Seller'
        } : null
      })),
      total: order.total,
      subtotal: order.subtotal || order.total,
      shipping: order.shipping || 0,
      status: order.status,
      date: new Date(order.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      shippingAddress: order.shippingAddress,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      paymentMethod: order.paymentMethod || 'Cash on Delivery',
      trackingNumber: order.trackingId
    }));
    
    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('items.bookId');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create notification based on status
    const statusMessages = {
      'accepted': { title: 'Order Accepted', message: 'Your order has been accepted by the seller and is being prepared.' },
      'confirmed': { title: 'Order Confirmed', message: 'Your order has been confirmed and will be packed soon.' },
      'packed': { title: 'Order Packed', message: 'Your order has been packed and is ready for shipment.' },
      'shipped': { title: 'Order Shipped', message: 'Your order is on the way! Track your delivery.' },
      'delivered': { title: 'Order Delivered', message: 'Your order has been delivered successfully. Enjoy your books!' },
      'rejected': { title: 'Order Rejected', message: 'Unfortunately, your order has been rejected. Please contact support.' },
      'cancelled': { title: 'Order Cancelled', message: 'Your order has been cancelled.' }
    };

    if (statusMessages[status]) {
      await Notification.create({
        userId: order.userId,
        type: 'order',
        title: statusMessages[status].title,
        message: statusMessages[status].message,
        orderId: order._id,
        link: '/orders'
      });
    }

    // Real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`customer-${order.userId}`).emit('order-update', {
        orderId: order._id,
        status: order.status,
        timestamp: new Date()
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel order
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.bookId');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to cancel this order' });
    }
    
    if (!['new', 'placed', 'pending', 'processing', 'accepted', 'packed'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    }
    
    // Restore stock for cancelled items
    for (let item of order.items) {
      const book = await Book.findById(item.bookId._id);
      if (book) {
        book.stock += item.quantity;
        await book.save();
      }
    }
    
    order.status = 'cancelled';
    await order.save();
    
    // Create notification
    await Notification.create({
      userId: req.user.id,
      type: 'order',
      title: 'Order Cancelled',
      message: `Your order has been cancelled successfully. Refund will be processed if applicable.`,
      orderId: order._id,
      link: '/orders'
    });
    
    // Real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`customer-${req.user.id}`).emit('order-cancelled', {
        orderId: order._id,
        status: 'cancelled',
        timestamp: new Date()
      });
    }
    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders (admin only)
router.get('/admin/all-orders', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const orders = await Order.find({})
      .populate('items.bookId')
      .populate('userId')
      .sort({ createdAt: -1 })
      .lean();
    
    const formattedOrders = orders.map(order => ({
      id: order._id.toString(),
      userId: order.userId?._id?.toString() || order.userId?.toString() || 'unknown',
      items: order.items
        .filter(item => item.bookId)
        .map(item => ({
          bookId: item.bookId._id.toString(),
          quantity: item.quantity,
          book: {
            id: item.bookId._id.toString(),
            title: item.bookId.title,
            author: item.bookId.author,
            price: item.price || item.bookId.price,
            image: item.bookId.image,
            isbn: item.bookId.isbn,
            condition: item.bookId.condition,
            sellerName: 'Seller'
          }
        })),
      total: order.total,
      subtotal: order.subtotal || order.total,
      shipping: order.shipping || 0,
      status: order.status,
      date: new Date(order.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      shippingAddress: order.shippingAddress,
      customerName: order.customerName || order.userId?.name || 'Guest',
      customerEmail: order.customerEmail || order.userId?.email || '',
      customerPhone: order.customerPhone || order.userId?.phone || '',
      paymentMethod: order.paymentMethod || 'COD',
      trackingNumber: order.trackingId || ''
    })).filter(order => order.items.length > 0);
    
    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all seller orders (admin only) - Orders placed by customers to sellers
router.get('/admin/seller-orders', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('🔍 Fetching seller orders...');
    const orders = await Order.find({})
      .populate('items.bookId')
      .populate('userId')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`📦 Found ${orders.length} total orders`);
    
    const formattedOrders = orders.map(order => {
      console.log(`Processing order ${order._id}:`, {
        itemsCount: order.items.length,
        hasValidBooks: order.items.filter(item => item.bookId).length
      });
      
      return {
        id: order._id.toString(),
        userId: order.userId?._id?.toString() || order.userId?.toString() || 'unknown',
        items: order.items.map(item => ({
          bookId: item.bookId?._id?.toString() || 'unknown',
          quantity: item.quantity,
          book: item.bookId ? {
            id: item.bookId._id?.toString(),
            title: item.bookId.title || 'Unknown Book',
            author: item.bookId.author || 'Unknown Author',
            price: item.price || item.bookId.price || 0,
            image: item.bookId.image,
            isbn: item.bookId.isbn,
            condition: item.bookId.condition,
            sellerName: item.bookId.sellerName || order.customerName || 'Seller'
          } : {
            id: 'unknown',
            title: 'Book Not Found',
            author: 'Unknown',
            price: item.price || 0,
            image: null,
            isbn: 'N/A',
            condition: 'unknown',
            sellerName: 'Unknown Seller'
          }
        })),
        total: order.total,
        subtotal: order.subtotal || order.total,
        shipping: order.shipping || 0,
        status: order.status,
        date: new Date(order.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        shippingAddress: order.shippingAddress,
        customerName: order.customerName || order.userId?.name || 'Guest',
        customerEmail: order.customerEmail || order.userId?.email || '',
        customerPhone: order.customerPhone || order.userId?.phone || '',
        paymentMethod: order.paymentMethod || 'COD',
        trackingNumber: order.trackingId || ''
      };
    });
    
    console.log(`✅ Returning ${formattedOrders.length} formatted orders`);
    res.json(formattedOrders);
  } catch (error) {
    console.error('❌ Error fetching seller orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get seller orders
router.get('/seller/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({
      'items.bookId': { $in: await Book.find({ sellerId: req.user.id }).distinct('_id') }
    })
    .populate('items.bookId')
    .sort({ createdAt: -1 });
    
    // Filter and format orders for seller
    const sellerOrders = orders.map(order => {
      const sellerItems = order.items.filter(item => 
        item.bookId.sellerId.toString() === req.user.id
      );
      
      if (sellerItems.length === 0) return null;
      
      const sellerTotal = sellerItems.reduce((sum, item) => 
        sum + (item.bookId.price * item.quantity), 0
      );
      
      return {
        id: order._id,
        userId: order.userId,
        items: sellerItems.map(item => ({
          bookId: item.bookId._id,
          quantity: item.quantity,
          book: item.bookId
        })),
        total: sellerTotal,
        status: order.status,
        date: order.createdAt.toLocaleDateString(),
        shippingAddress: order.shippingAddress,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        paymentMethod: order.paymentMethod
      };
    }).filter(Boolean);
    
    res.json(sellerOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;