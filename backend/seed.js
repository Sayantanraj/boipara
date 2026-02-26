const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Book = require('./models/Book');
const Order = require('./models/Order');
const BuybackRequest = require('./models/BuybackRequest');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boipara');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Book.deleteMany({});
    await Order.deleteMany({});
    await BuybackRequest.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = await User.insertMany([
      {
        name: 'John Customer',
        email: 'customer@test.com',
        password: hashedPassword,
        role: 'customer',
        phone: '+91 98765 43210',
        location: 'Kolkata, West Bengal'
      },
      {
        name: 'Rajesh Kumar',
        email: 'seller@test.com',
        password: hashedPassword,
        role: 'seller',
        phone: '+91 98765 43211',
        location: 'College Street, Kolkata',
        storeName: 'Kumar Book Stall',
        yearsInBusiness: 15,
        specialties: 'Academic and Engineering Books'
      },
      {
        name: 'Admin User',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin',
        phone: '+91 98765 43212'
      }
    ]);

    console.log('Created users:', users.length);

    // Create books
    const seller = users.find(u => u.role === 'seller');
    
    const books = await Book.insertMany([
      {
        isbn: '978-8126554232',
        title: 'Advanced Engineering Mathematics',
        author: 'Erwin Kreyszig',
        category: 'Engineering',
        description: 'Comprehensive engineering mathematics textbook covering calculus, differential equations, vector analysis, and more.',
        price: 899,
        mrp: 1299,
        discount: 31,
        stock: 15,
        sellerId: seller._id,
        sellerName: seller.storeName,
        image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=500&fit=crop',
        images: ['https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=500&fit=crop'],
        rating: 4.5,
        reviewCount: 128,
        condition: 'new',
        featured: true,
        language: 'English',
        edition: '10th Edition',
        publisher: 'Wiley India',
        deliveryDays: 3
      },
      {
        isbn: '978-0136436690',
        title: 'Organic Chemistry',
        author: 'Morrison and Boyd',
        category: 'Science',
        description: 'Classic organic chemistry textbook with comprehensive coverage of reactions and mechanisms.',
        price: 650,
        mrp: 950,
        discount: 32,
        stock: 8,
        sellerId: seller._id,
        sellerName: seller.storeName,
        image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=500&fit=crop',
        images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=500&fit=crop'],
        rating: 4.3,
        reviewCount: 95,
        condition: 'like-new',
        featured: false,
        language: 'English',
        edition: '6th Edition',
        publisher: 'Pearson',
        deliveryDays: 5
      },
      {
        isbn: '978-9325963450',
        title: 'The Complete Guide to UPSC Civil Services',
        author: 'Arihant Experts',
        category: 'Competitive Exams',
        description: 'Comprehensive guide for UPSC preparation with previous year papers and practice questions.',
        price: 450,
        mrp: 599,
        discount: 25,
        stock: 25,
        sellerId: seller._id,
        sellerName: seller.storeName,
        image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=500&fit=crop',
        images: ['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=500&fit=crop'],
        rating: 4.2,
        reviewCount: 67,
        condition: 'new',
        featured: true,
        language: 'English',
        edition: '2024 Edition',
        publisher: 'Arihant Publications',
        deliveryDays: 2
      },
      {
        isbn: '978-0070648391',
        title: 'Data Structures and Algorithms',
        author: 'Cormen, Leiserson, Rivest',
        category: 'Computer Science',
        description: 'Introduction to algorithms and data structures for computer science students.',
        price: 750,
        mrp: 1100,
        discount: 32,
        stock: 12,
        sellerId: seller._id,
        sellerName: seller.storeName,
        image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=500&fit=crop',
        images: ['https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=500&fit=crop'],
        rating: 4.6,
        reviewCount: 203,
        condition: 'new',
        featured: true,
        language: 'English',
        edition: '3rd Edition',
        publisher: 'MIT Press',
        deliveryDays: 4
      },
      {
        isbn: '978-8120311299',
        title: 'Physics for Engineers',
        author: 'Resnick, Halliday, Krane',
        category: 'Physics',
        description: 'Comprehensive physics textbook designed for engineering students.',
        price: 580,
        mrp: 850,
        discount: 32,
        stock: 18,
        sellerId: seller._id,
        sellerName: seller.storeName,
        image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=500&fit=crop',
        images: ['https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=500&fit=crop'],
        rating: 4.4,
        reviewCount: 156,
        condition: 'like-new',
        featured: false,
        language: 'English',
        edition: '5th Edition',
        publisher: 'Wiley',
        deliveryDays: 3
      }
    ]);

    console.log('Created books:', books.length);

    // Create sample buyback requests
    const customer = users.find(u => u.role === 'customer');
    
    const buybackRequests = await BuybackRequest.insertMany([
      {
        userId: customer._id,
        isbn: '978-8126554232',
        bookTitle: 'Advanced Engineering Mathematics',
        author: 'Erwin Kreyszig',
        condition: 'good',
        offeredPrice: 400,
        status: 'pending',
        category: 'Engineering',
        publisher: 'Wiley India',
        language: 'English'
      },
      {
        userId: customer._id,
        isbn: '978-0136436690',
        bookTitle: 'Organic Chemistry',
        author: 'Morrison and Boyd',
        condition: 'like-new',
        offeredPrice: 350,
        status: 'approved',
        sellingPrice: 320,
        category: 'Science',
        publisher: 'Pearson',
        language: 'English'
      }
    ]);

    console.log('Created buyback requests:', buybackRequests.length);

    console.log('✅ Seed data created successfully!');
    console.log('\nTest Accounts:');
    console.log('Customer: customer@test.com / password123');
    console.log('Seller: seller@test.com / password123');
    console.log('Admin: admin@test.com / password123');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
  }
};

seedData();