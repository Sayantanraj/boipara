const mongoose = require('mongoose');

const buybackOrderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [{
    bookId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'BuybackRequest' 
    },
    quantity: Number,
    price: Number
  }],
  total: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    default: 'pending' 
  },
  shippingAddress: String,
  customerName: String,
  customerPhone: String,
  paymentMethod: String,
  trackingId: String,
  isBuybackOrder: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('BuybackOrder', buybackOrderSchema);
