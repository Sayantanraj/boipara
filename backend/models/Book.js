const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  isbn: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  category: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerName: String,
  image: String,
  images: [String],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  condition: { type: String, enum: ['new', 'like-new', 'used'], default: 'new' },
  isBuyback: { type: Boolean, default: false },
  originalBookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  bestseller: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  language: String,
  edition: String,
  publisher: String,
  deliveryDays: { type: Number, default: 7 }
}, { timestamps: true, collation: { locale: 'simple' } });

module.exports = mongoose.model('Book', bookSchema);