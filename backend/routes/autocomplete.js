const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Order = require('../models/Order');

// In-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

// Search history and popular searches
const searchHistory = new Map(); // userId -> [searches]
const popularSearches = new Map(); // query -> count

// Clean old cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) cache.delete(key);
  }
}, 60000);

router.get('/suggestions', async (req, res) => {
  try {
    const query = req.query.q?.trim();
    const userId = req.query.userId;
    
    if (!query || query.length < 2) return res.json([]);

    // Track popular searches
    const lowerQuery = query.toLowerCase();
    popularSearches.set(lowerQuery, (popularSearches.get(lowerQuery) || 0) + 1);

    // Prevent regex injection
    const sanitized = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Check cache
    const cached = cache.get(sanitized);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    // Search with timeout
    const results = await Promise.race([
      Book.aggregate([
        {
          $match: {
            $or: [
              { title: { $regex: sanitized, $options: 'i' } },
              { author: { $regex: sanitized, $options: 'i' } },
              { isbn: { $regex: sanitized, $options: 'i' } },
              { category: { $regex: sanitized, $options: 'i' } }
            ]
          }
        },
        {
          $addFields: {
            score: {
              $add: [
                { $cond: [{ $regexMatch: { input: '$title', regex: `^${sanitized}`, options: 'i' } }, 10, 0] },
                { $cond: [{ $regexMatch: { input: '$title', regex: sanitized, options: 'i' } }, 5, 0] },
                { $cond: [{ $regexMatch: { input: '$author', regex: sanitized, options: 'i' } }, 3, 0] },
                { $cond: [{ $regexMatch: { input: '$isbn', regex: sanitized, options: 'i' } }, 2, 0] },
                { $cond: [{ $regexMatch: { input: '$category', regex: sanitized, options: 'i' } }, 1, 0] }
              ]
            }
          }
        },
        { $sort: { score: -1, title: 1 } },
        { $limit: 8 },
        {
          $project: {
            _id: 1,
            title: 1,
            author: 1,
            price: 1,
            category: 1,
            imageUrl: '$image'
          }
        }
      ]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 500))
    ]);

    // Update cache
    if (cache.size >= MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(sanitized, { data: results, timestamp: Date.now() });

    res.json(results);
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.json([]);
  }
});

// Save search to history
router.post('/history', (req, res) => {
  try {
    const { userId, query } = req.body;
    if (!userId || !query) return res.json({ success: false });

    const userHistory = searchHistory.get(userId) || [];
    const trimmedQuery = query.trim();
    
    // Remove duplicate and add to front
    const filtered = userHistory.filter(q => q.toLowerCase() !== trimmedQuery.toLowerCase());
    filtered.unshift(trimmedQuery);
    
    // Keep only last 10 searches
    searchHistory.set(userId, filtered.slice(0, 10));
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false });
  }
});

// Get user search history
router.get('/history/:userId', (req, res) => {
  try {
    const history = searchHistory.get(req.params.userId) || [];
    res.json(history);
  } catch (error) {
    res.json([]);
  }
});

// Get popular searches
router.get('/popular', async (req, res) => {
  try {
    // Get top searches from tracking
    const tracked = Array.from(popularSearches.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query]) => query);

    // Get trending books from orders
    const recentOrders = await Order.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).populate('items.bookId');

    const bookCounts = {};
    recentOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.bookId?.title) {
          const title = item.bookId.title.toLowerCase();
          bookCounts[title] = (bookCounts[title] || 0) + 1;
        }
      });
    });

    const trending = Object.entries(bookCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([title]) => title);

    // Combine and deduplicate
    const popular = [...new Set([...tracked, ...trending])].slice(0, 8);
    
    res.json(popular);
  } catch (error) {
    console.error('Popular searches error:', error);
    res.json(['Engineering', 'Medical', 'UPSC', 'JEE', 'NEET']);
  }
});

module.exports = router;
