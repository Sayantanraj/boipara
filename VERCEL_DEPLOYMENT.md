# 🚀 BOIPARA Vercel Deployment Guide

## 📋 Prerequisites
- Vercel account (sign up at https://vercel.com)
- MongoDB Atlas account (for production database)
- GitHub repository (already done ✅)

---

## 🎯 Deployment Steps

### 1️⃣ Deploy Backend (API)

#### Option A: Via Vercel Dashboard (Recommended)
1. Go to https://vercel.com/new
2. Import your GitHub repository: `Sayantanraj/boipara`
3. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)

4. Add Environment Variables:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/boipara
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   PORT=3001
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

5. Click **Deploy**
6. Copy your backend URL (e.g., `https://boipara-api.vercel.app`)

#### Option B: Via Vercel CLI
```bash
cd backend
npm install -g vercel
vercel login
vercel --prod
```

---

### 2️⃣ Deploy Frontend

#### Update API URL
Before deploying frontend, update the API base URL:

**File**: `src/services/api.ts`
```typescript
// Change this line:
const API_BASE = 'http://localhost:3001/api';

// To your Vercel backend URL:
const API_BASE = 'https://your-backend-url.vercel.app/api';
```

#### Deploy via Vercel Dashboard
1. Go to https://vercel.com/new
2. Import repository again: `Sayantanraj/boipara`
3. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Click **Deploy**
5. Your app will be live at `https://boipara.vercel.app`

---

## 🗄️ MongoDB Atlas Setup (Production Database)

1. Go to https://cloud.mongodb.com
2. Create a free cluster
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (allow all)
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/boipara
   ```
6. Add to Vercel environment variables

---

## 🔧 Quick Deploy Commands

### Push changes and auto-deploy:
```bash
git add .
git commit -m "Update for production"
git push origin main
```
Vercel will auto-deploy on push!

---

## ✅ Verification Checklist

After deployment:
- [ ] Backend API responds at `/api/books`
- [ ] Frontend loads correctly
- [ ] Login/Register works
- [ ] Books display properly
- [ ] Search functionality works
- [ ] Cart and checkout work
- [ ] Orders save to database

---

## 🌐 Your Live URLs

**Frontend**: https://boipara.vercel.app
**Backend API**: https://boipara-api.vercel.app

---

## 🐛 Troubleshooting

### Backend not responding
- Check environment variables in Vercel dashboard
- Verify MongoDB connection string
- Check Vercel function logs

### Frontend API errors
- Ensure API_BASE URL is correct in `api.ts`
- Check CORS settings in backend
- Verify backend is deployed and running

### Database connection issues
- Whitelist all IPs in MongoDB Atlas: `0.0.0.0/0`
- Check connection string format
- Verify database user credentials

---

## 📝 Important Notes

1. **Free Tier Limits**:
   - Vercel: 100GB bandwidth/month
   - MongoDB Atlas: 512MB storage

2. **Environment Variables**:
   - Never commit `.env` files
   - Set all variables in Vercel dashboard

3. **Auto-Deploy**:
   - Every push to `main` branch auto-deploys
   - Check deployment status in Vercel dashboard

---

## 🎉 You're Done!

Your BOIPARA app is now live on Vercel! 🚀

Share your link: `https://boipara.vercel.app`
