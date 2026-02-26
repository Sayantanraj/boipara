const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkAndCreateAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boipara');
    console.log('Connected to MongoDB');

    // Check if admin user exists
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (adminUser) {
      console.log('Admin user found:', {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      });
    } else {
      console.log('No admin user found. Creating one...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = new User({
        name: 'Admin User',
        email: 'admin@boipara.com',
        password: hashedPassword,
        role: 'admin',
        isVerified: true
      });
      
      await newAdmin.save();
      console.log('Admin user created:', {
        email: 'admin@boipara.com',
        password: 'admin123',
        role: 'admin'
      });
    }

    // Check total users
    const totalUsers = await User.countDocuments();
    console.log(`Total users in database: ${totalUsers}`);

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

checkAndCreateAdmin();