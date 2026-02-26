const mongoose = require('mongoose');
const User = require('./models/User');
const BuybackRequest = require('./models/BuybackRequest');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testBuybackAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boipara');
    console.log('Connected to MongoDB');

    // Get admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found');
      return;
    }

    // Generate JWT token for admin
    const token = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'your-secret-key-here'
    );

    console.log('Admin user:', adminUser.email);
    console.log('Generated token:', token.substring(0, 50) + '...');

    // Test direct database query
    const requests = await BuybackRequest.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    console.log(`Found ${requests.length} buyback requests in database:`);
    
    requests.forEach((request, index) => {
      console.log(`${index + 1}. ${request.bookTitle} by ${request.author} (${request.status})`);
      console.log(`   Customer: ${request.userId?.name || 'Unknown'}`);
      console.log(`   Price: ₹${request.offeredPrice}`);
      console.log('');
    });

    // Test API endpoint simulation
    const formattedRequests = requests.map(request => ({
      id: request._id,
      userId: request.userId?._id,
      customerName: request.userId?.name,
      customerEmail: request.userId?.email,
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

    console.log('API Response would be:');
    console.log(JSON.stringify(formattedRequests, null, 2));

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

testBuybackAPI();