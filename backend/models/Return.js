const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  items: [{
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    book: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  reason: {
    type: String,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['pending-admin', 'approved-by-admin', 'rejected-by-admin', 'refund-issued', 'completed'],
    default: 'pending-admin'
  },
  adminNotes: String,
  refundAmount: Number,
  sellerNotes: String,
  processedAt: Date,
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  sellerName: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Return', returnSchema);