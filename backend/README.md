# BOIPARA Backend API

Real-time backend API with MongoDB for the BOIPARA customer panel.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup MongoDB
- Install MongoDB locally or use MongoDB Atlas
- Create a database named `boipara`

### 3. Environment Variables
Create a `.env` file in the backend directory:
```
MONGODB_URI=mongodb://localhost:27017/boipara
JWT_SECRET=your-secret-key-here
PORT=3001
```

### 4. Seed Database
```bash
npm run seed
```

### 5. Start Server
```bash
npm run dev
```

## Test Accounts
- **Customer**: customer@test.com / password123
- **Seller**: seller@test.com / password123  
- **Admin**: admin@test.com / password123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Books
- `GET /api/books` - Get all books (with filters)
- `GET /api/books/:id` - Get single book
- `GET /api/books/featured/list` - Get featured books

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get user orders
- `PATCH /api/orders/:id/status` - Update order status

### Buyback
- `POST /api/buyback` - Create buyback request
- `GET /api/buyback/my-requests` - Get user buyback requests

## Real-time Features
- Order status updates via Socket.io
- Stock notifications
- Real-time notifications

## Frontend Integration
Update your frontend to use the API service in `src/services/api.ts`