const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    quantity: Number,
    price: Number
  }],
  total: { type: Number, required: true },
  subtotal: Number,
  shipping: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['new', 'pending', 'placed', 'processing', 'accepted', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'rejected'],
    default: 'new'
  },
  shippingAddress: { type: String, required: true },
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  paymentMethod: String,
  trackingId: String
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);