const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./models/Order');
const User = require('./models/User');
const Book = require('./models/Book');

async function testOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boipara');
    console.log('✅ MongoDB connected');

    // Count total orders
    const totalOrders = await Order.countDocuments();
    console.log(`\n📦 Total orders in database: ${totalOrders}`);

    // Get all orders without populate first
    const orders = await Order.find();
    console.log('\n📋 Orders:');
    orders.forEach(order => {
      console.log(`  - Order ID: ${order._id}`);
      console.log(`    User ID: ${order.userId}`);
      console.log(`    Status: ${order.status}`);
      console.log(`    Total: ₹${order.total}`);
      console.log(`    Items: ${order.items.length}`);
      console.log(`    Created: ${order.createdAt}`);
      console.log('');
    });

    // Get all users
    const users = await User.find();
    console.log('\n👥 Users in database:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user._id}`);
    });

    mongoose.connection.close();
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testOrders();
