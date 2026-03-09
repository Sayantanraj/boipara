const mongoose = require('mongoose');
const BuybackRequest = require('./models/BuybackRequest');
require('dotenv').config();

async function deleteAllBuyback() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boipara');
    console.log('Connected to MongoDB');

    const result = await BuybackRequest.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} buyback records`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
  }
}

deleteAllBuyback();
