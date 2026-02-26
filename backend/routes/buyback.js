const express = require('express');
const BuybackRequest = require('../models/BuybackRequest');
const auth = require('../middleware/auth');
const router = express.Router();

// Create buyback request
router.post('/', auth, async (req, res) => {
  try {
    const buybackRequest = new BuybackRequest({
      ...req.body,
      userId: req.user.id
    });

    await buybackRequest.save();
    res.status(201).json(buybackRequest);
  } catch (error) {
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

module.exports = router;