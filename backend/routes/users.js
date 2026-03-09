const express = require('express');
const User = require('../models/User');
const Book = require('../models/Book');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all sellers (admin only)
router.get('/sellers', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const sellers = await User.find({ role: 'seller' }, '-password').sort({ createdAt: -1 });
    res.json(sellers);
  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

// Get seller statistics (admin only)
router.get('/sellers/:sellerId/stats', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { sellerId } = req.params;
    
    // Get seller info
    const seller = await User.findById(sellerId, '-password');
    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Get seller's books
    const books = await Book.find({ sellerId });
    const bookIds = books.map(b => b._id.toString());
    
    // Get all orders
    const allOrders = await Order.find({
      status: { $in: ['delivered', 'completed'] }
    }).populate('items.bookId');

    // Filter orders that contain seller's books
    let totalSales = 0;
    let totalRevenue = 0;
    const bookSales = {};

    allOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.bookId && bookIds.includes(item.bookId._id.toString())) {
          totalSales += item.quantity;
          totalRevenue += (item.price * item.quantity);
          
          const bookId = item.bookId._id.toString();
          bookSales[bookId] = (bookSales[bookId] || 0) + item.quantity;
        }
      });
    });

    // Get top performing books
    const topBookIds = Object.entries(bookSales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([bookId]) => bookId);
    
    const topBooks = await Book.find({ _id: { $in: topBookIds } });

    const stats = {
      seller: {
        id: seller._id,
        name: seller.name,
        storeName: seller.storeName,
        email: seller.email,
        location: seller.location,
        rating: seller.rating || 4.5
      },
      totalBooks: books.length,
      totalSales,
      totalRevenue,
      avgRating: seller.rating || 4.5,
      topBooks: topBooks.map(book => ({
        id: book._id,
        title: book.title,
        author: book.author,
        price: book.price,
        sales: bookSales[book._id.toString()] || 0
      }))
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching seller stats:', error);
    res.status(500).json({ error: 'Failed to fetch seller statistics' });
  }
});

module.exports = router;