const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true }, // Custom order ID
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
  trackingId: String,
  isBuybackOrder: { type: Boolean, default: false }
}, { timestamps: true });

// Function to generate custom order ID
orderSchema.statics.generateOrderId = async function() {
  const today = new Date();
  const dateStr = today.getDate().toString().padStart(2, '0') + 
                  (today.getMonth() + 1).toString().padStart(2, '0') + 
                  today.getFullYear().toString();
  
  const prefix = `BOI${dateStr}`;
  
  // Find the highest order number for today
  const lastOrder = await this.findOne({
    orderId: { $regex: `^${prefix}` }
  }).sort({ orderId: -1 });
  
  let orderNumber = 1;
  if (lastOrder) {
    const lastNumber = parseInt(lastOrder.orderId.replace(prefix, ''));
    orderNumber = lastNumber + 1;
  }
  
  return `${prefix}${orderNumber}`;
};

module.exports = mongoose.model('Order', orderSchema);