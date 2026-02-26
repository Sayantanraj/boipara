const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boipara')
  .then(async () => {
    console.log('MongoDB connected');
    
    // Remove text index to support all languages
    try {
      const Book = require('./models/Book');
      await Book.collection.dropIndex('title_text_author_text_isbn_text').catch(() => {});
      console.log('✓ Text index removed - all languages supported');
    } catch (err) {
      console.log('No text index to remove');
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/buyback', require('./routes/buyback'));
app.use('/api/users', require('./routes/users'));
app.use('/api/returns', require('./routes/returns'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/search', require('./routes/autocomplete'));

// Socket.io for real-time updates
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
        console.log(`Customer ${userId} disconnected`);
        break;
      }
    }
  });
});

// Make io available to routes
app.set('io', io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});