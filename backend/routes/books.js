const express = require('express');
const Book = require('../models/Book');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all books with filters
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, condition, page = 1, limit = 12 } = req.query;
    
    let query = {};
    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } }
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const books = await Book.find(query)
      .populate('sellerId', 'name storeName location')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Book.countDocuments(query);

    res.json({
      books,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get featured books - BEFORE /:id
router.get('/featured/list', async (req, res) => {
  try {
    const books = await Book.find({ featured: true }).limit(8);
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bestsellers based on actual purchases - BEFORE /:id
router.get('/bestsellers/list', async (req, res) => {
  try {
    const orders = await Order.find({ status: { $in: ['delivered', 'shipped', 'packed', 'confirmed', 'accepted'] } });
    const bookPurchases = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const bookId = item.bookId.toString();
        bookPurchases[bookId] = (bookPurchases[bookId] || 0) + item.quantity;
      });
    });
    
    const bookIds = Object.keys(bookPurchases).filter(id => bookPurchases[id] > 0);
    const books = await Book.find({ _id: { $in: bookIds } });
    
    const booksWithPurchases = books.map(book => ({
      ...book.toObject(),
      purchaseCount: bookPurchases[book._id.toString()]
    })).sort((a, b) => b.purchaseCount - a.purchaseCount).slice(0, 6);
    
    res.json(booksWithPurchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get seller's books - BEFORE /:id
router.get('/seller/my-books', auth, async (req, res) => {
  try {
    const books = await Book.find({ sellerId: req.user.id }).sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get books by seller ID - BEFORE /:id
router.get('/seller/:sellerId/books', auth, async (req, res) => {
  try {
    const books = await Book.find({ sellerId: req.params.sellerId })
      .populate('sellerId', 'name storeName location')
      .sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk create books - BEFORE /:id
router.post('/bulk', auth, async (req, res) => {
  try {
    const { books } = req.body;
    
    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ error: 'Books array is required' });
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    const createdBooks = [];
    
    for (let i = 0; i < books.length; i++) {
      try {
        const bookData = {
          ...books[i],
          sellerId: req.user.id,
          sellerName: req.user.storeName || req.user.name
        };
        
        const book = new Book(bookData);
        await book.save();
        createdBooks.push(book);
        results.success++;
      } catch (error) {
        console.error(`❌ Book ${i + 1} failed:`, books[i].title, error.message);
        results.failed++;
        results.errors.push(`Book ${i + 1} (${books[i].title}): ${error.message}`);
      }
    }
    
    res.json({
      message: `Bulk upload completed. ${results.success} books created, ${results.failed} failed.`,
      results,
      books: createdBooks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new book - BEFORE /:id
router.post('/', auth, async (req, res) => {
  try {
    const bookData = {
      ...req.body,
      sellerId: req.user.id,
      sellerName: req.user.storeName || req.user.name
    };
    
    const book = new Book(bookData);
    await book.save();
    
    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single book - AFTER all specific routes
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('sellerId', 'name storeName location yearsInBusiness rating');
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update book
router.put('/:id', auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    
    if (book.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this book' });
    }
    
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    res.json(updatedBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete book
router.delete('/:id', auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    
    if (book.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this book' });
    }
    
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
