const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testUsers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boipara');
    console.log('✅ Connected to MongoDB');

    console.log('👥 Fetching all users...');
    const allUsers = await User.find({});
    console.log('📊 Total users in database:', allUsers.length);

    if (allUsers.length > 0) {
      console.log('👤 Sample users:');
      allUsers.slice(0, 5).forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
      });

      console.log('\n📈 User statistics:');
      const customers = allUsers.filter(u => u.role === 'customer');
      const sellers = allUsers.filter(u => u.role === 'seller');
      const admins = allUsers.filter(u => u.role === 'admin');
      
      console.log(`- Customers: ${customers.length}`);
      console.log(`- Sellers: ${sellers.length}`);
      console.log(`- Admins: ${admins.length}`);
    } else {
      console.log('❌ No users found in database');
      
      // Create a test admin user
      console.log('🔧 Creating test admin user...');
      const testAdmin = new User({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: '$2b$10$dummy.hash.for.testing', // This is a dummy hash
        role: 'admin',
        isEmailVerified: true
      });
      
      await testAdmin.save();
      console.log('✅ Test admin user created');
      
      // Create a test customer
      console.log('🔧 Creating test customer...');
      const testCustomer = new User({
        name: 'Test Customer',
        email: 'customer@test.com',
        password: '$2b$10$dummy.hash.for.testing',
        role: 'customer',
        isEmailVerified: true
      });
      
      await testCustomer.save();
      console.log('✅ Test customer created');
      
      // Create a test seller
      console.log('🔧 Creating test seller...');
      const testSeller = new User({
        name: 'Test Seller',
        email: 'seller@test.com',
        password: '$2b$10$dummy.hash.for.testing',
        role: 'seller',
        storeName: 'Test Book Store',
        location: 'College Street, Kolkata',
        isEmailVerified: true
      });
      
      await testSeller.save();
      console.log('✅ Test seller created');
      
      console.log('🎉 Test users created successfully!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testUsers();