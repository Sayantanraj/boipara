const mongoose = require('mongoose');
const BuybackRequest = require('./models/BuybackRequest');
const User = require('./models/User');
require('dotenv').config();

const sampleBuybackRequests = [
  {
    isbn: '978-0262033848',
    bookTitle: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen',
    condition: 'like-new',
    offeredPrice: 850,
    status: 'pending',
    image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300',
    category: 'Computer Science',
    publisher: 'MIT Press',
    language: 'English',
    edition: '3rd Edition',
    publicationYear: '2009',
    mrp: 1200,
    pageCondition: 'Excellent',
    bindingCondition: 'Perfect',
    coverCondition: 'Like New',
    writingMarks: 'None',
    damageCondition: 'No damage'
  },
  {
    isbn: '978-0201896831',
    bookTitle: 'The Art of Computer Programming',
    author: 'Donald Knuth',
    condition: 'good',
    offeredPrice: 1200,
    status: 'pending',
    image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300',
    category: 'Computer Science',
    publisher: 'Addison-Wesley',
    language: 'English',
    edition: '3rd Edition',
    publicationYear: '1997',
    mrp: 1800,
    pageCondition: 'Good',
    bindingCondition: 'Good',
    coverCondition: 'Good',
    writingMarks: 'Minor highlighting',
    damageCondition: 'Minor wear'
  },
  {
    isbn: '978-0132350884',
    bookTitle: 'Clean Code',
    author: 'Robert C. Martin',
    condition: 'like-new',
    offeredPrice: 450,
    status: 'approved',
    sellingPrice: 500,
    image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300',
    category: 'Software Engineering',
    publisher: 'Prentice Hall',
    language: 'English',
    edition: '1st Edition',
    publicationYear: '2008',
    mrp: 650,
    pageCondition: 'Excellent',
    bindingCondition: 'Perfect',
    coverCondition: 'Like New',
    writingMarks: 'None',
    damageCondition: 'No damage'
  }
];

async function seedBuybackRequests() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boipara');
    console.log('Connected to MongoDB');

    // Find a customer user to assign buyback requests to
    const customer = await User.findOne({ role: 'customer' });
    if (!customer) {
      console.log('No customer found. Please create a customer user first.');
      return;
    }

    // Clear existing buyback requests
    await BuybackRequest.deleteMany({});
    console.log('Cleared existing buyback requests');

    // Add userId to each request
    const requestsWithUserId = sampleBuybackRequests.map(request => ({
      ...request,
      userId: customer._id
    }));

    // Insert sample buyback requests
    const insertedRequests = await BuybackRequest.insertMany(requestsWithUserId);
    console.log(`Inserted ${insertedRequests.length} buyback requests`);

    console.log('Sample buyback requests:');
    insertedRequests.forEach(request => {
      console.log(`- ${request.bookTitle} by ${request.author} (${request.status})`);
    });

    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding buyback requests:', error);
    mongoose.connection.close();
  }
}

seedBuybackRequests();