const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');

async function generateTestToken() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boipara');
    console.log('✅ MongoDB connected');

    // Find a customer user
    const customer = await User.findOne({ role: 'customer' });
    
    if (!customer) {
      console.log('❌ No customer found in database');
      process.exit(1);
    }

    console.log(`\n👤 Found customer: ${customer.name} (${customer.email})`);
    console.log(`   User ID: ${customer._id}`);

    // Generate JWT token
    const token = jwt.sign(
      { id: customer._id, email: customer.email, role: customer.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`\n🔑 Generated Token:\n${token}`);
    
    console.log(`\n📝 Test the API with this curl command:\n`);
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3001/api/orders/my-orders`);
    
    console.log(`\n📝 Or use this in your browser console:\n`);
    console.log(`localStorage.setItem('token', '${token}');`);
    console.log(`localStorage.setItem('user', '${JSON.stringify({
      id: customer._id,
      name: customer.name,
      email: customer.email,
      role: customer.role
    })}');`);

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateTestToken();
