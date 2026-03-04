
# BOIPARA - College Street Book Marketplace

A comprehensive book marketplace connecting College Street sellers with customers worldwide.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running on localhost:27017)
- npm or yarn

### Installation

1. **Clone and navigate to project**
   ```bash
   cd "BOIPARA(SANDIP) (1) (1)"
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Configure environment variables**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your actual values
   ```

5. **Start development servers**
   
   **Option A: Use the startup script (Windows)**
   ```bash
   start-dev.bat
   ```
   
   **Option B: Manual start**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   npm run dev
   ```

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 🔧 Configuration

### Environment Variables (.env)
```env
MONGODB_URI=mongodb://localhost:27017/boipara
JWT_SECRET=your-secure-jwt-secret-key-here
PORT=3001
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
```

## 👥 Demo Accounts

- **Customer**: customer@test.com (any password)
- **Seller**: seller@test.com (any password)
- **Admin**: admin@test.com (any password)

## 📚 Features

- ✅ Multi-role authentication (Customer, Seller, Admin)
- ✅ Book browsing and search
- ✅ Shopping cart and wishlist
- ✅ Order management
- ✅ Buyback system
- ✅ Real-time updates with Socket.IO
- ✅ Mobile responsive design

## 🛠 Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Radix UI Components
- Socket.IO Client

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Socket.IO
- Nodemailer

## 🚀 Deployment

**Ready to deploy?** Your app is 100% configured for production!

### Quick Deploy to Render (Recommended)
1. Read: [RENDER_QUICK_START.md](RENDER_QUICK_START.md) - 30 minute setup
2. Or: [RENDER_DEPLOYMENT_GUIDE.md](RENDER_DEPLOYMENT_GUIDE.md) - Detailed guide
3. Visual: [RENDER_VISUAL_GUIDE.md](RENDER_VISUAL_GUIDE.md) - Flowchart

### Alternative: Deploy to Vercel
- [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md)

### Deployment Resources
- [DEPLOYMENT_READY.md](DEPLOYMENT_READY.md) - Complete deployment overview
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Track your progress
- [render-env-variables.txt](render-env-variables.txt) - Environment variables template

**Cost**: $0/month (Free tier) | **Time**: ~30 minutes

## 📖 Documentation

For detailed features and implementation:
- [Quick Start Guide](QUICK_START.md)
- [Features Checklist](FEATURES_CHECKLIST.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)

### 🛠️ Recent Updates:
- **[Deployment Configurations](DEPLOYMENT_READY.md)** - Ready for Render & Vercel
- **[Orders Section Fix](ORDERS_README.md)** - Customer orders now fully connected to MongoDB
  - [Complete Fix Summary](ORDERS_FIX_SUMMARY.md)
  - [Testing Guide](ORDERS_FIX_GUIDE.md)
  - [System Flow Diagram](ORDERS_SYSTEM_FLOW.md)

## 🔒 Security

- JWT-based authentication
- Environment variables for sensitive data
- Input validation and sanitization
- CORS protection

---

*"From College Street to Your Doorstep"* 📚✨
  