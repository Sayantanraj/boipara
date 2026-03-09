const express = require('express');
const BuybackRequest = require('../models/BuybackRequest');
const BuybackOrder = require('../models/BuybackOrder');
const auth = require('../middleware/auth');
const router = express.Router();

// Create buyback request
router.post('/', auth, async (req, res) => {
  try {
    console.log('📥 Creating buyback request:', req.body);
    console.log('👤 User ID:', req.user.id);
    
    const buybackRequest = new BuybackRequest({
      ...req.body,
      userId: req.user.id
    });

    const saved = await buybackRequest.save();
    console.log('✅ Buyback saved to MongoDB:', saved._id);
    
    res.status(201).json(saved);
  } catch (error) {
    console.error('❌ Error saving buyback:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's buyback requests
router.get('/my-requests', auth, async (req, res) => {
  try {
    const requests = await BuybackRequest.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update buyback status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, sellingPrice, priceChangeReason } = req.body;
    const request = await BuybackRequest.findByIdAndUpdate(
      req.params.id,
      { status, sellingPrice, priceChangeReason },
      { new: true }
    );

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get approved buyback books for sellers to purchase
router.get('/approved-books', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ error: 'Seller access required' });
    }

    const approvedBooks = await BuybackRequest.find({ 
      status: 'approved',
      stock: { $gt: 0 }
    })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });
    
    const formattedBooks = approvedBooks.map(book => ({
      id: book._id,
      isbn: book.isbn,
      bookTitle: book.bookTitle,
      author: book.author,
      condition: book.condition,
      sellingPrice: book.sellingPrice || book.offeredPrice,
      stock: book.stock,
      image: book.image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300',
      category: book.category,
      publisher: book.publisher,
      language: book.language,
      edition: book.edition,
      status: book.status
    }));
    
    res.json(formattedBooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin - Get all buyback requests
router.get('/admin/all-requests', auth, async (req, res) => {
  try {
    console.log('Buyback API called by user:', {
      userId: req.user.id,
      role: req.user.role,
      email: req.user.email
    });
    
    if (req.user.role !== 'admin') {
      console.log('Access denied - user is not admin');
      return res.status(403).json({ error: 'Admin access required' });
    }

    const requests = await BuybackRequest.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${requests.length} buyback requests`);
    
    const formattedRequests = requests.map(request => ({
      id: request._id,
      userId: request.userId._id,
      customerName: request.userId.name,
      customerEmail: request.userId.email,
      isbn: request.isbn,
      bookTitle: request.bookTitle,
      author: request.author,
      condition: request.condition,
      offeredPrice: request.offeredPrice,
      sellingPrice: request.sellingPrice,
      priceChangeReason: request.priceChangeReason,
      status: request.status,
      date: request.createdAt.toLocaleDateString('en-IN'),
      image: request.image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300',
      category: request.category,
      publisher: request.publisher,
      language: request.language,
      edition: request.edition,
      stock: request.stock || 1
    }));
    
    console.log('Sending response with', formattedRequests.length, 'requests');
    res.json(formattedRequests);
  } catch (error) {
    console.error('Error in buyback admin route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin - Approve buyback request
router.patch('/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { sellingPrice, priceChangeReason } = req.body;
    const request = await BuybackRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved', 
        sellingPrice, 
        priceChangeReason,
        stock: 1 // Default stock when approved
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Buyback request not found' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin - Reject buyback request
router.patch('/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { rejectionReason } = req.body;
    const request = await BuybackRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        rejectionReason
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Buyback request not found' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin - Create book listing from approved buyback
router.post('/:id/create-listing', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const buybackRequest = await BuybackRequest.findById(req.params.id);
    
    if (!buybackRequest) {
      return res.status(404).json({ error: 'Buyback request not found' });
    }

    if (buybackRequest.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved buyback requests can be listed' });
    }

    if (buybackRequest.status === 'sold') {
      return res.status(400).json({ error: 'This buyback book is already listed' });
    }

    // Create book from buyback request
    const Book = require('../models/Book');
    const book = new Book({
      isbn: buybackRequest.isbn,
      title: buybackRequest.bookTitle,
      author: buybackRequest.author,
      category: buybackRequest.category || 'Academic',
      description: `Buyback book in ${buybackRequest.condition} condition. ${buybackRequest.publisher ? `Published by ${buybackRequest.publisher}.` : ''}`,
      price: buybackRequest.sellingPrice || buybackRequest.offeredPrice,
      mrp: buybackRequest.mrp || (buybackRequest.sellingPrice || buybackRequest.offeredPrice) * 1.5,
      stock: buybackRequest.stock || 1,
      sellerId: req.user.id, // Admin is the seller
      sellerName: 'BOI PARA (Buyback)',
      image: buybackRequest.image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300',
      condition: buybackRequest.condition,
      isBuyback: true,
      language: buybackRequest.language || 'English',
      edition: buybackRequest.edition,
      publisher: buybackRequest.publisher
    });

    await book.save();

    // Update buyback request status to sold
    buybackRequest.status = 'sold';
    await buybackRequest.save();

    res.json({ 
      message: 'Book listing created successfully',
      book,
      buybackRequest
    });
  } catch (error) {
    console.error('Error creating book listing:', error);
    res.status(500).json({ error: error.message });
  }
});

// Seller - Purchase buyback book
router.post('/:id/purchase', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ error: 'Seller access required' });
    }

    const { quantity } = req.body;
    const buybackRequest = await BuybackRequest.findById(req.params.id);
    
    if (!buybackRequest) {
      return res.status(404).json({ error: 'Buyback book not found' });
    }

    if (buybackRequest.status !== 'approved') {
      return res.status(400).json({ error: 'This book is not available for purchase' });
    }

    if ((buybackRequest.stock || 0) < quantity) {
      return res.status(400).json({ error: 'Insufficient stock available' });
    }

    const Book = require('../models/Book');
    const book = new Book({
      isbn: buybackRequest.isbn,
      title: buybackRequest.bookTitle,
      author: buybackRequest.author,
      category: buybackRequest.category || 'Academic',
      description: `Buyback book in ${buybackRequest.condition} condition. ${buybackRequest.publisher ? `Published by ${buybackRequest.publisher}.` : ''}`,
      price: buybackRequest.sellingPrice || buybackRequest.offeredPrice,
      mrp: buybackRequest.mrp || (buybackRequest.sellingPrice || buybackRequest.offeredPrice) * 1.5,
      stock: quantity,
      sellerId: req.user.id,
      sellerName: req.user.storeName || req.user.name,
      image: buybackRequest.image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300',
      condition: buybackRequest.condition,
      isBuyback: true,
      language: buybackRequest.language || 'English',
      edition: buybackRequest.edition,
      publisher: buybackRequest.publisher
    });

    await book.save();

    buybackRequest.stock = (buybackRequest.stock || 0) - quantity;
    if (buybackRequest.stock === 0) {
      buybackRequest.status = 'sold';
    }
    await buybackRequest.save();

    res.json({ 
      message: 'Book purchased and added to your inventory',
      book,
      remainingStock: buybackRequest.stock
    });
  } catch (error) {
    console.error('Error purchasing buyback book:', error);
    res.status(500).json({ error: error.message });
  }
});

// Seller - Purchase buyback books
router.post('/purchase', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ error: 'Seller access required' });
    }

    const { items, shippingAddress, customerName, customerPhone, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    // Validate all items and check stock
    const buybackBooks = [];
    for (const item of items) {
      const book = await BuybackRequest.findById(item.bookId);
      
      if (!book) {
        return res.status(404).json({ error: `Book ${item.bookId} not found` });
      }

      if (book.status !== 'approved') {
        return res.status(400).json({ error: `Book "${book.bookTitle}" is not available for purchase` });
      }

      if (book.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for "${book.bookTitle}". Available: ${book.stock}` });
      }

      buybackBooks.push({ book, quantity: item.quantity });
    }

    // Calculate total
    const total = buybackBooks.reduce((sum, item) => {
      return sum + (item.book.sellingPrice || 0) * item.quantity;
    }, 0);

    // Create buyback order
    const order = new BuybackOrder({
      userId: req.user.id,
      items: buybackBooks.map(item => ({
        bookId: item.book._id,
        quantity: item.quantity,
        price: item.book.sellingPrice
      })),
      total,
      status: 'pending',
      shippingAddress,
      customerName,
      customerPhone,
      paymentMethod: paymentMethod || 'UPI',
      trackingId: `BUY${Date.now().toString().slice(-10)}`
    });

    await order.save();

    // Update stock for each buyback book
    for (const item of buybackBooks) {
      item.book.stock -= item.quantity;
      await item.book.save();
    }

    // Populate order with book details
    await order.populate('items.bookId');

    res.status(201).json(order);
  } catch (error) {
    console.error('Error purchasing buyback books:', error);
    res.status(500).json({ error: error.message });
  }
});

// Seller - Get my buyback orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    console.log('🔍 Seller fetching buyback orders...');
    console.log('User ID:', req.user.id);
    console.log('User role:', req.user.role);
    
    if (req.user.role !== 'seller') {
      return res.status(403).json({ error: 'Seller access required' });
    }

    console.log('📦 Fetching orders for seller:', req.user.id);
    const orders = await BuybackOrder.find({ userId: req.user.id })
      .populate('items.bookId')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${orders.length} buyback orders for seller`);
    if (orders.length > 0) {
      console.log('Sample order:', JSON.stringify(orders[0], null, 2));
    }

    res.json(orders);
  } catch (error) {
    console.error('❌ Error fetching buyback orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin - Get all buyback orders (seller purchases)
router.get('/admin/all-orders', auth, async (req, res) => {
  try {
    console.log('🔍 Admin fetching all buyback orders...');
    console.log('User role:', req.user.role);
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('📦 Fetching orders from database...');
    const orders = await BuybackOrder.find({})
      .populate('userId', 'name email storeName')
      .populate('items.bookId')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${orders.length} buyback orders`);
    if (orders.length > 0) {
      console.log('Sample order:', JSON.stringify(orders[0], null, 2));
    }

    res.json(orders);
  } catch (error) {
    console.error('❌ Error fetching all buyback orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Customer - Get all buyback orders (for matching with requests)
router.get('/customer/all-orders', auth, async (req, res) => {
  try {
    console.log('🔍 Customer fetching all buyback orders');
    console.log('User ID:', req.user.id);
    
    // Get all orders and populate the bookId to see the structure
    const orders = await BuybackOrder.find({})
      .populate('userId', 'name email storeName')
      .populate('items.bookId')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${orders.length} total buyback orders`);
    if (orders.length > 0) {
      console.log('Sample order with populated data:', JSON.stringify(orders[0], null, 2));
    }
    
    res.json(orders);
  } catch (error) {
    console.error('❌ Error fetching all buyback orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Customer - Update buyback order status
router.patch('/orders/:orderId/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const { orderId } = req.params;
    
    console.log(`🔄 Updating buyback order ${orderId} status to ${status}`);
    console.log('User ID:', req.user.id);
    
    // Find the order and check if user has permission to update it
    const order = await BuybackOrder.findById(orderId)
      .populate('items.bookId');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check if the user is the customer who owns the buyback request
    // or if they're the seller who purchased the book
    let hasPermission = false;
    
    if (req.user.role === 'seller' && order.userId.toString() === req.user.id) {
      hasPermission = true;
    } else if (req.user.role === 'customer') {
      // Check if any of the items in the order belong to this customer's buyback requests
      const BuybackRequest = require('../models/BuybackRequest');
      for (const item of order.items) {
        const buybackRequest = await BuybackRequest.findById(item.bookId._id);
        if (buybackRequest && buybackRequest.userId.toString() === req.user.id) {
          hasPermission = true;
          break;
        }
      }
    }
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Update the order status
    order.status = status;
    await order.save();
    
    console.log(`✅ Order ${orderId} status updated to ${status}`);
    
    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('❌ Error updating buyback order status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Customer - Get purchase orders for a specific buyback request
router.get('/customer/purchase-orders/:buybackRequestId', auth, async (req, res) => {
  try {
    console.log('🔍 Customer fetching purchase orders for buyback request:', req.params.buybackRequestId);
    console.log('User ID:', req.user.id);
    console.log('User role:', req.user.role);
    
    // Find orders where the items contain this buyback request ID
    const orders = await BuybackOrder.find({
      'items.bookId': req.params.buybackRequestId
    })
      .populate('userId', 'name email storeName')
      .populate('items.bookId')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${orders.length} purchase orders for buyback request ${req.params.buybackRequestId}`);
    
    if (orders.length > 0) {
      console.log('Sample order:', JSON.stringify(orders[0], null, 2));
    } else {
      console.log('⚠️ No orders found. Checking all orders...');
      const allOrders = await BuybackOrder.find({}).lean();
      console.log(`Total orders in database: ${allOrders.length}`);
      if (allOrders.length > 0) {
        console.log('Sample order structure:', JSON.stringify(allOrders[0], null, 2));
      }
    }
    
    res.json(orders);
  } catch (error) {
    console.error('❌ Error fetching purchase orders:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;