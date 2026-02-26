const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

// Initialize database
db.initData();

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied' });
    }
    const decoded = jwt.verify(token, 'secret');
    req.user = db.findUser({ _id: decoded.id });
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Socket.io
const customerConnections = new Map();
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-customer', (userId) => {
    customerConnections.set(userId, socket.id);
    socket.join(`customer-${userId}`);
    console.log(`Customer ${userId} joined`);
  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of customerConnections.entries()) {
      if (socketId === socket.id) {
        customerConnections.delete(userId);
        break;
      }
    }
  });
});

app.set('io', io);

// Routes
// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'customer' } = req.body;
    
    const existingUser = db.findUser({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = db.addUser({
      name, email, password: hashedPassword, role
    });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, 'secret', { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = db.findUser({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // For demo, accept any password
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, 'secret', { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Books routes
app.get('/api/books', (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const books = db.findBooks({ category, search });
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedBooks = books.slice(startIndex, endIndex);

    res.json({
      books: paginatedBooks,
      totalPages: Math.ceil(books.length / limit),
      currentPage: parseInt(page),
      total: books.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/books/featured/list', (req, res) => {
  try {
    const books = db.books().filter(b => b.featured).slice(0, 8);
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/books/:id', (req, res) => {
  try {
    const book = db.books().find(b => b._id === req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Orders routes
app.post('/api/orders', auth, (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    
    let subtotal = 0;
    const orderItems = [];

    for (let item of items) {
      const book = db.books().find(b => b._id === item.bookId);
      if (!book || book.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${book?.title}` });
      }
      
      orderItems.push({
        bookId: item.bookId,
        quantity: item.quantity,
        price: book.price
      });
      
      subtotal += book.price * item.quantity;
    }

    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + shipping;

    const order = db.addOrder({
      userId: req.user._id,
      items: orderItems,
      subtotal,
      shipping,
      total,
      shippingAddress,
      paymentMethod,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone,
      status: 'pending',
      createdAt: new Date()
    });

    // Real-time notification
    const io = req.app.get('io');
    io.to(`customer-${req.user._id}`).emit('order-created', {
      orderId: order._id,
      status: order.status,
      total: order.total
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/my-orders', auth, (req, res) => {
  try {
    const orders = db.orders().filter(o => o.userId === req.user._id);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buyback routes
app.post('/api/buyback', auth, (req, res) => {
  try {
    const buybackRequest = db.addBuyback({
      ...req.body,
      userId: req.user._id,
      status: 'pending',
      createdAt: new Date()
    });
    res.status(201).json(buybackRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/buyback/my-requests', auth, (req, res) => {
  try {
    const requests = db.buybackRequests().filter(r => r.userId === req.user._id);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log('📊 Database initialized with sample data');
  console.log('\n🔐 Test Accounts:');
  console.log('Customer: customer@test.com / password123');
  console.log('Seller: seller@test.com / password123');
  console.log('Admin: admin@test.com / password123');
});