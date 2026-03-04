const mongoose = require('mongoose');
const Return = require('./models/Return');
const User = require('./models/User');
const Order = require('./models/Order');
require('dotenv').config();

async function fixReturns() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boipara');
    console.log('Connected to MongoDB\n');

    // Get the seller
    const seller = await User.findOne({ role: 'seller' });
    if (!seller) {
      console.log('No seller found');
      return;
    }
    console.log(`Found seller: ${seller.name} (ID: ${seller._id})\n`);

    // Find returns without sellerId
    const returnsWithoutSeller = await Return.find({ 
      $or: [
        { sellerId: null },
        { sellerId: { $exists: false } }
      ]
    });

    console.log(`Found ${returnsWithoutSeller.length} returns without sellerId\n`);

    if (returnsWithoutSeller.length > 0) {
      // Update each return with the seller ID
      for (const ret of returnsWithoutSeller) {
        // Try to get seller from order
        const order = await Order.findById(ret.orderId);
        let sellerIdToUse = seller._id;
        
        if (order && order.sellerId) {
          sellerIdToUse = order.sellerId;
        }

        ret.sellerId = sellerIdToUse;
        ret.sellerName = seller.storeName || seller.name;
        await ret.save();
        
        console.log(`✓ Updated return ${ret._id}`);
        console.log(`  - Set sellerId to: ${sellerIdToUse}`);
        console.log(`  - Set sellerName to: ${seller.storeName || seller.name}`);
        console.log('');
      }

      console.log('All returns updated successfully!\n');

      // Verify the fix
      const approvedReturns = await Return.find({ 
        sellerId: seller._id,
        status: { $in: ['approved-by-admin', 'refund-issued', 'completed'] }
      });
      console.log(`Approved returns for seller ${seller.name}: ${approvedReturns.length}`);
    } else {
      console.log('No returns need fixing');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

fixReturns();
