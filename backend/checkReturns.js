const mongoose = require('mongoose');
const Return = require('./models/Return');
const User = require('./models/User');
require('dotenv').config();

async function checkReturns() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boipara');
    console.log('Connected to MongoDB\n');

    // Get all sellers
    const sellers = await User.find({ role: 'seller' });
    console.log('Sellers in database:');
    sellers.forEach(seller => {
      console.log(`- ${seller.name} (${seller.email}) - ID: ${seller._id}`);
    });
    console.log('');

    // Get all returns
    const allReturns = await Return.find({});
    console.log(`Total returns in database: ${allReturns.length}\n`);

    if (allReturns.length > 0) {
      console.log('All returns:');
      allReturns.forEach((ret, index) => {
        console.log(`${index + 1}. Return ID: ${ret._id}`);
        console.log(`   Status: ${ret.status}`);
        console.log(`   Seller ID: ${ret.sellerId}`);
        console.log(`   Customer: ${ret.customerName}`);
        console.log(`   Reason: ${ret.reason}`);
        console.log('');
      });

      // Check approved returns
      const approvedReturns = await Return.find({ 
        status: { $in: ['approved-by-admin', 'refund-issued', 'completed'] }
      });
      console.log(`Approved returns (should show in seller dashboard): ${approvedReturns.length}`);
      approvedReturns.forEach((ret, index) => {
        console.log(`${index + 1}. ${ret.items[0]?.book?.title || 'Unknown'} - ${ret.status}`);
        console.log(`   Seller ID: ${ret.sellerId}`);
      });
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

checkReturns();
