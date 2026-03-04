const express = require('express');
const Review = require('../models/Review');
const auth = require('../middleware/auth');
const router = express.Router();

// Create review
router.post('/', auth, async (req, res) => {
  try {
    const { orderId, bookId, rating, feedback, images } = req.body;
    
    // Check if review already exists
    const existingReview = await Review.findOne({ orderId, userId: req.user.id });
    if (existingReview) {
      return res.status(400).json({ error: 'Review already exists for this order' });
    }
    
    const review = new Review({
      orderId,
      bookId,
      userId: req.user.id,
      userName: req.user.name,
      rating,
      feedback,
      images: images || []
    });
    
    await review.save();
    res.status(201).json(review);
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update review
router.put('/:reviewId', auth, async (req, res) => {
  try {
    const { rating, feedback, images } = req.body;
    console.log('Updating review:', req.params.reviewId, { rating, feedback, imagesCount: images?.length });
    const review = await Review.findOneAndUpdate(
      { _id: req.params.reviewId, userId: req.user.id },
      { rating, feedback, images },
      { new: true }
    );
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json(review);
  } catch (error) {
    console.error('Review update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get review by order ID
router.get('/order/:orderId', auth, async (req, res) => {
  try {
    const review = await Review.findOne({ orderId: req.params.orderId, userId: req.user.id });
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all reviews for a book
router.get('/book/:bookId', async (req, res) => {
  try {
    const { sort } = req.query;
    let filter = { bookId: req.params.bookId };
    let sortOption = { helpfulCount: -1, createdAt: -1 };
    
    if (sort === 'helpful') {
      sortOption = { helpfulCount: -1, createdAt: -1 };
    } else if (sort === 'latest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'positive') {
      filter.rating = { $gte: 4 };
      sortOption = { createdAt: -1 };
    } else if (sort === 'negative') {
      filter.rating = { $lte: 2 };
      sortOption = { createdAt: -1 };
    }
    
    const reviews = await Review.find(filter).sort(sortOption);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark review as helpful
router.post('/:reviewId/helpful', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    const userIdStr = req.user.id.toString();
    const hasVoted = review.helpfulVotes.some(id => id.toString() === userIdStr);
    
    if (hasVoted) {
      return res.status(400).json({ error: 'Already marked as helpful' });
    }
    
    review.helpfulVotes.push(req.user.id);
    review.helpfulCount += 1;
    await review.save();
    
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove helpful mark
router.delete('/:reviewId/helpful', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    const userIdStr = req.user.id.toString();
    const index = review.helpfulVotes.findIndex(id => id.toString() === userIdStr);
    
    if (index === -1) {
      return res.status(400).json({ error: 'Not marked as helpful' });
    }
    
    review.helpfulVotes.splice(index, 1);
    review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    await review.save();
    
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
