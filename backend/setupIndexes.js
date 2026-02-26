const mongoose = require('mongoose');
const Book = require('./models/Book');

async function setupIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boipara');
    console.log('Connected to MongoDB');

    // Text index with weights and language-agnostic settings
    await Book.collection.createIndex(
      { title: 'text', author: 'text', isbn: 'text' },
      { 
        weights: { title: 10, author: 5, isbn: 3 },
        default_language: 'none'
      }
    );

    // Individual indexes
    await Book.collection.createIndex({ title: 1 });
    await Book.collection.createIndex({ author: 1 });
    await Book.collection.createIndex({ isbn: 1 });

    // Compound indexes
    await Book.collection.createIndex({ category: 1, price: 1 });
    await Book.collection.createIndex({ sellerId: 1, createdAt: -1 });

    console.log('✓ All indexes created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Index creation failed:', error);
    process.exit(1);
  }
}

setupIndexes();
