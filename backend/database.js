// Simple in-memory database for testing
let users = [];
let books = [];
let orders = [];
let buybackRequests = [];

// Sample data
const sampleData = {
  users: [
    {
      _id: 'user1',
      name: 'John Customer',
      email: 'customer@test.com',
      password: '$2a$10$example', // hashed 'password123'
      role: 'customer',
      phone: '+91 98765 43210',
      location: 'Kolkata, West Bengal'
    },
    {
      _id: 'seller1',
      name: 'Rajesh Kumar',
      email: 'seller@test.com',
      password: '$2a$10$example',
      role: 'seller',
      phone: '+91 98765 43211',
      location: 'College Street, Kolkata',
      storeName: 'Kumar Book Stall',
      yearsInBusiness: 15
    },
    {
      _id: 'admin1',
      name: 'Admin User',
      email: 'admin@test.com',
      password: '$2a$10$example',
      role: 'admin',
      phone: '+91 98765 43212'
    }
  ],
  books: [
    {
      _id: 'book1',
      isbn: '978-8126554232',
      title: 'Advanced Engineering Mathematics',
      author: 'Erwin Kreyszig',
      category: 'Engineering',
      description: 'Comprehensive engineering mathematics textbook.',
      price: 899,
      mrp: 1299,
      discount: 31,
      stock: 15,
      sellerId: 'seller1',
      sellerName: 'Kumar Book Stall',
      image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=500&fit=crop',
      images: ['https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=500&fit=crop'],
      rating: 4.5,
      reviewCount: 128,
      condition: 'new',
      featured: true,
      language: 'English',
      edition: '10th Edition',
      publisher: 'Wiley India',
      deliveryDays: 3,
      createdAt: new Date()
    },
    {
      _id: 'book2',
      isbn: '978-0136436690',
      title: 'Organic Chemistry',
      author: 'Morrison and Boyd',
      category: 'Science',
      description: 'Classic organic chemistry textbook.',
      price: 650,
      mrp: 950,
      discount: 32,
      stock: 8,
      sellerId: 'seller1',
      sellerName: 'Kumar Book Stall',
      image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=500&fit=crop',
      images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=500&fit=crop'],
      rating: 4.3,
      reviewCount: 95,
      condition: 'like-new',
      featured: false,
      language: 'English',
      edition: '6th Edition',
      publisher: 'Pearson',
      deliveryDays: 5,
      createdAt: new Date()
    },
    {
      _id: 'book3',
      isbn: '978-9325963450',
      title: 'The Complete Guide to UPSC Civil Services',
      author: 'Arihant Experts',
      category: 'Competitive Exams',
      description: 'Comprehensive guide for UPSC preparation.',
      price: 450,
      mrp: 599,
      discount: 25,
      stock: 25,
      sellerId: 'seller1',
      sellerName: 'Kumar Book Stall',
      image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=500&fit=crop',
      images: ['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=500&fit=crop'],
      rating: 4.2,
      reviewCount: 67,
      condition: 'new',
      featured: true,
      language: 'English',
      edition: '2024 Edition',
      publisher: 'Arihant Publications',
      deliveryDays: 2,
      createdAt: new Date()
    }
  ]
};

// Initialize data
const initData = () => {
  users = [...sampleData.users];
  books = [...sampleData.books];
  orders = [];
  buybackRequests = [];
  console.log('✅ In-memory database initialized');
};

module.exports = {
  users: () => users,
  books: () => books,
  orders: () => orders,
  buybackRequests: () => buybackRequests,
  initData,
  
  // Helper functions
  findUser: (query) => users.find(u => Object.keys(query).every(key => u[key] === query[key])),
  findBooks: (query = {}) => {
    let result = books;
    if (query.category) result = result.filter(b => b.category === query.category);
    if (query.search) {
      const search = query.search.toLowerCase();
      result = result.filter(b => 
        b.title.toLowerCase().includes(search) || 
        b.author.toLowerCase().includes(search)
      );
    }
    return result;
  },
  addUser: (user) => { users.push({ ...user, _id: Date.now().toString() }); return users[users.length - 1]; },
  addOrder: (order) => { orders.push({ ...order, _id: Date.now().toString() }); return orders[orders.length - 1]; },
  addBuyback: (buyback) => { buybackRequests.push({ ...buyback, _id: Date.now().toString() }); return buybackRequests[buybackRequests.length - 1]; }
};