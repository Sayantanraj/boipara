const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const BuybackRequest = require('./models/BuybackRequest');
require('dotenv').config();

async function testAdminBuyback() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boipara');
    console.log('Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ No admin user found');
      return;
    }
    console.log('✅ Admin user found:', admin.email);

    // Generate JWT token for admin
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET || 'your-secret-key-here',
      { expiresIn: '24h' }
    );
    console.log('✅ JWT token generated');

    // Test the buyback request query
    const buybackRequests = await BuybackRequest.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${buybackRequests.length} buyback requests in database`);

    if (buybackRequests.length > 0) {
      console.log('\n📋 Sample buyback requests:');
      buybackRequests.forEach((request, index) => {
        console.log(`${index + 1}. ${request.bookTitle} by ${request.author}`);
        console.log(`   Customer: ${request.userId?.name || 'Unknown'} (${request.userId?.email || 'No email'})`);
        console.log(`   Status: ${request.status}`);
        console.log(`   Price: ₹${request.offeredPrice}`);
        console.log('');
      });

      // Format as the API would return
      const formattedRequests = buybackRequests.map(request => ({
        id: request._id,
        userId: request.userId._id,
        customerName: request.userId.name,
        customerEmail: request.userId.email,
        isbn: request.isbn,
        bookTitle: request.bookTitle,
        author: request.author,
        condition: request.condition,
        offeredPrice: request.offeredPrice,
        sellingPrice: request.sellingPrice,
        priceChangeReason: request.priceChangeReason,
        status: request.status,
        date: request.createdAt.toLocaleDateString('en-IN'),
        image: request.image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300',
        category: request.category,
        publisher: request.publisher,
        language: request.language,
        edition: request.edition,
        stock: request.stock || 1
      }));

      console.log('✅ API Response format ready');
      console.log('Sample formatted request:', JSON.stringify(formattedRequests[0], null, 2));
    }

    // Test authentication middleware simulation
    console.log('\n🔐 Testing authentication:');
    console.log('Admin ID:', admin._id);
    console.log('Admin Role:', admin.role);
    console.log('Token payload would be:', {
      id: admin._id,
      role: admin.role,
      email: admin.email
    });

    mongoose.connection.close();
    console.log('\n✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
    mongoose.connection.close();
  }
}

testAdminBuyback();