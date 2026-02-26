const mongoose = require('mongoose');
const Return = require('./models/Return');
const User = require('./models/User');
const Order = require('./models/Order');
require('dotenv').config();

async function seedReturns() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boipara');
    console.log('Connected to MongoDB');

    // Find a customer and seller
    const customer = await User.findOne({ role: 'customer' });
    const seller = await User.findOne({ role: 'seller' });
    
    if (!customer || !seller) {
      console.log('Need both customer and seller users');
      return;
    }

    // Find or create an order
    let order = await Order.findOne({ userId: customer._id });
    if (!order) {
      // Create a sample order
      order = new Order({
        userId: customer._id,
        items: [{
          bookId: new mongoose.Types.ObjectId(),
          quantity: 1,
          book: {
            title: 'Sample Book for Return',
            author: 'Test Author',
            price: 299,
            isbn: '978-81-12345-67-8'
          }
        }],
        total: 299,
        status: 'delivered',
        shippingAddress: 'Test Address, Kolkata',
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || '9876543210',
        paymentMethod: 'UPI'
      });
      await order.save();
      console.log('Created sample order:', order._id);
    }

    // Clear existing returns
    await Return.deleteMany({});
    console.log('Cleared existing returns');

    // Create sample return requests
    const sampleReturns = [
      {
        orderId: order._id,
        userId: customer._id,
        sellerId: seller._id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || '9876543210',
        sellerName: seller.storeName || seller.name,
        items: [{
          bookId: new mongoose.Types.ObjectId(),
          quantity: 1,
          book: {
            title: 'Introduction to Algorithms',
            author: 'Thomas H. Cormen',
            price: 850,
            isbn: '978-0262033848'
          }
        }],
        reason: 'Damaged during delivery',
        description: 'The book cover was torn and pages were damaged',
        status: 'pending-admin'
      },
      {
        orderId: order._id,
        userId: customer._id,
        sellerId: seller._id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || '9876543210',
        sellerName: seller.storeName || seller.name,
        items: [{
          bookId: new mongoose.Types.ObjectId(),
          quantity: 1,
          book: {
            title: 'Clean Code',
            author: 'Robert C. Martin',
            price: 450,
            isbn: '978-0132350884'
          }
        }],
        reason: 'Wrong book received',
        description: 'Ordered Clean Code but received a different book',
        status: 'approved-by-admin',
        adminNotes: 'Valid complaint, approved for return'
      },
      {
        orderId: order._id,
        userId: customer._id,
        sellerId: seller._id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || '9876543210',
        sellerName: seller.storeName || seller.name,
        items: [{
          bookId: new mongoose.Types.ObjectId(),
          quantity: 1,
          book: {
            title: 'The Art of Computer Programming',
            author: 'Donald Knuth',
            price: 1200,
            isbn: '978-0201896831'
          }
        }],
        reason: 'Book condition not as described',
        description: 'Listed as like-new but received a heavily used book',
        status: 'refund-issued',
        adminNotes: 'Approved for return',
        refundAmount: 1200,
        sellerNotes: 'Refund processed via UPI'
      }
    ];

    // Insert sample returns
    const insertedReturns = await Return.insertMany(sampleReturns);
    console.log(`Inserted ${insertedReturns.length} return requests`);

    console.log('Sample return requests:');
    insertedReturns.forEach((returnReq, index) => {
      console.log(`${index + 1}. ${returnReq.items[0].book.title} - ${returnReq.status}`);
      console.log(`   Customer: ${returnReq.customerName}`);
      console.log(`   Reason: ${returnReq.reason}`);
      console.log('');
    });

    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding returns:', error);
    mongoose.connection.close();
  }
}

seedReturns();