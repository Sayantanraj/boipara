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
    
    // Get orders containing seller's books
    const orders = await Order.find({
      'items.book.sellerId': sellerId,
      status: { $in: ['delivered', 'completed'] }
    });

    // Calculate stats
    const totalBooks = books.length;
    const totalSales = orders.reduce((sum, order) => {
      return sum + order.items
        .filter(item => item.book.sellerId === sellerId)
        .reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);
    
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + order.items
        .filter(item => item.book.sellerId === sellerId)
        .reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
    }, 0);

    // Get top performing books
    const bookSales = {};
    orders.forEach(order => {
      order.items
        .filter(item => item.book.sellerId === sellerId)
        .forEach(item => {
          const bookId = item.bookId;
          bookSales[bookId] = (bookSales[bookId] || 0) + item.quantity;
        });
    });

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
      totalBooks,
      totalSales,
      totalRevenue,
      avgRating: seller.rating || 4.5,
      topBooks: topBooks.map(book => ({
        id: book._id,
        title: book.title,
        author: book.author,
        price: book.price,
        sales: bookSales[book._id] || 0
      }))
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching seller stats:', error);
    res.status(500).json({ error: 'Failed to fetch seller statistics' });
  }
});

module.exports = router;