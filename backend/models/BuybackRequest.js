const mongoose = require('mongoose');

const buybackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isbn: { type: String, required: true },
  bookTitle: { type: String, required: true },
  author: String,
  condition: { type: String, enum: ['like-new', 'good', 'fair'], required: true },
  offeredPrice: { type: Number, required: true },
  sellingPrice: Number,
  priceChangeReason: String,
  rejectionReason: String,
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed', 'sold'],
    default: 'pending'
  },
  image: String,
  category: String,
  publisher: String,
  language: String,
  edition: String,
  publicationYear: String,
  mrp: Number,
  pageCondition: String,
  bindingCondition: String,
  coverCondition: String,
  writingMarks: String,
  damageCondition: String,
  stock: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('BuybackRequest', buybackSchema);