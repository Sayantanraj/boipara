const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function checkAndFixUserRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boipara');
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log('\n=== Current Users ===');
    users.forEach(user => {
      console.log(`Email: ${user.email} | Role: ${user.role} | Name: ${user.name}`);
    });

    // If you need to fix a specific user's role, uncomment and modify:
    // const sellerEmail = 'seller@test.com';
    // await User.updateOne({ email: sellerEmail }, { role: 'seller' });
    // console.log(`\nUpdated ${sellerEmail} to seller role`);

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndFixUserRoles();
