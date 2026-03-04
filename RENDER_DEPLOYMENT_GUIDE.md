# 🚀 BOIPARA Render Deployment Guide

## Why Render?
- ✅ Free tier with 750 hours/month
- ✅ Better for Node.js backends with WebSockets
- ✅ Automatic deployments from GitHub
- ✅ Built-in environment variables
- ✅ No cold starts on paid tier

## Prerequisites
- Render account (https://render.com)
- MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)
- GitHub repository (already done ✅)

---

## Step 1: Setup MongoDB Atlas (Cloud Database)

### 1.1 Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free tier (no credit card required)

### 1.2 Create a Cluster
1. Click "Build a Database"
2. Choose **FREE** tier (M0 Sandbox)
3. Select **AWS** as provider
4. Choose region closest to you (e.g., Mumbai for India)
5. Cluster Name: `boipara-cluster`
6. Click "Create"

### 1.3 Setup Database Access
1. Click "Database Access" in left sidebar
2. Click "Add New Database User"
3. Authentication Method: **Password**
4. Username: `boipara_admin`
5. Password: Click "Autogenerate Secure Password" (SAVE THIS!)
6. Database User Privileges: **Read and write to any database**
7. Click "Add User"

### 1.4 Setup Network Access
1. Click "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "**Allow Access from Anywhere**" (0.0.0.0/0)
4. Click "Confirm"

### 1.5 Get Connection String
1. Click "Database" in left sidebar
2. Click "Connect" button on your cluster
3. Choose "Connect your application"
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string
6. Replace `<password>` with your actual password
7. Replace `<dbname>` with `boipara`

**Example:**
```
mongodb+srv://boipara_admin:YOUR_PASSWORD@boipara-cluster.xxxxx.mongodb.net/boipara?retryWrites=true&w=majority
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create Web Service
1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub account if not connected
4. Select repository: `Sayantanraj/boipara`
5. Click "Connect"

### 2.2 Configure Backend Service
Fill in these details:

**Basic Settings:**
- **Name**: `boipara-backend`
- **Region**: Singapore (or closest to you)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type:**
- Select **Free** (750 hours/month)

### 2.3 Add Environment Variables
Click "Advanced" → Add Environment Variables:

```
MONGODB_URI=mongodb+srv://boipara_admin:YOUR_PASSWORD@boipara-cluster.xxxxx.mongodb.net/boipara?retryWrites=true&w=majority
JWT_SECRET=boipara-super-secret-jwt-key-minimum-32-characters-long-2024
PORT=3001
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
FRONTEND_URL=https://boipara.onrender.com
NODE_ENV=production
```

**Important Notes:**
- Replace MongoDB password with your actual password
- For `EMAIL_PASS`: Use Gmail App Password (see below)
- `FRONTEND_URL` will be updated after frontend deployment

### 2.4 Deploy Backend
1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Note your backend URL: `https://boipara-backend.onrender.com`
4. Test it: Visit `https://boipara-backend.onrender.com/api/books`

---

## Step 3: Deploy Frontend to Render

### 3.1 Create Static Site
1. Go to Render Dashboard
2. Click "New +" → "Static Site"
3. Select repository: `Sayantanraj/boipara`
4. Click "Connect"

### 3.2 Configure Frontend Service
Fill in these details:

**Basic Settings:**
- **Name**: `boipara`
- **Branch**: `main`
- **Root Directory**: (leave empty)
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

### 3.3 Add Environment Variables
Click "Advanced" → Add Environment Variable:

```
VITE_API_URL=https://boipara-backend.onrender.com/api
```

### 3.4 Deploy Frontend
1. Click "Create Static Site"
2. Wait 5-10 minutes for deployment
3. Your frontend URL: `https://boipara.onrender.com`

---

## Step 4: Update Backend CORS

### 4.1 Update Backend Environment Variable
1. Go to Render Dashboard
2. Click on `boipara-backend` service
3. Go to "Environment" tab
4. Update `FRONTEND_URL` to: `https://boipara.onrender.com`
5. Click "Save Changes"
6. Service will auto-redeploy

---

## Step 5: Seed Database (Optional)

### 5.1 Using Render Shell
1. Go to `boipara-backend` service in Render
2. Click "Shell" tab (top right)
3. Run: `node seed.js`
4. Wait for completion

### 5.2 Using Local Machine
1. Update `backend/.env` with MongoDB Atlas connection string
2. Run:
   ```bash
   cd backend
   node seed.js
   ```

---

## Step 6: Test Your Deployment

### 6.1 Test Backend
Visit: `https://boipara-backend.onrender.com/api/books`

Should return JSON with books data.

### 6.2 Test Frontend
1. Visit: `https://boipara.onrender.com`
2. Try demo accounts:
   - **Customer**: customer@test.com (any password)
   - **Seller**: seller@test.com (any password)
   - **Admin**: admin@test.com (any password)

### 6.3 Test Features
- ✅ Browse books
- ✅ Search functionality
- ✅ Add to cart
- ✅ Place order
- ✅ User dashboard

---

## 🔧 Gmail App Password Setup

### For Email Notifications:

1. Go to Google Account: https://myaccount.google.com
2. Security → 2-Step Verification (enable if not enabled)
3. Security → App passwords
4. Select app: **Mail**
5. Select device: **Other** (enter "Render Backend")
6. Click "Generate"
7. Copy the 16-character password
8. Use this in `EMAIL_PASS` environment variable

---

## 🔧 Troubleshooting

### Backend Connection Error
**Problem**: Frontend can't connect to backend

**Solutions:**
1. Check backend is deployed and running
2. Verify `VITE_API_URL` in frontend environment variables
3. Check backend logs in Render dashboard
4. Ensure MongoDB Atlas IP whitelist includes 0.0.0.0/0

### CORS Error
**Problem**: CORS policy blocking requests

**Solutions:**
1. Update `FRONTEND_URL` in backend environment variables
2. Wait for backend to redeploy
3. Clear browser cache
4. Check browser console for exact error

### MongoDB Connection Error
**Problem**: Backend can't connect to MongoDB

**Solutions:**
1. Verify MongoDB Atlas connection string
2. Check database user password is correct
3. Ensure IP whitelist includes 0.0.0.0/0
4. Check MongoDB Atlas cluster is running

### Build Errors
**Problem**: Deployment fails during build

**Solutions:**
1. Check Render build logs
2. Verify all dependencies in package.json
3. Ensure Node.js version compatibility
4. Check for syntax errors in code

### Free Tier Limitations
**Problem**: Service spins down after inactivity

**Solutions:**
1. Free tier services sleep after 15 minutes of inactivity
2. First request after sleep takes 30-60 seconds
3. Upgrade to paid tier ($7/month) for always-on service
4. Use a service like UptimeRobot to ping every 14 minutes

---

## 📊 Render Free Tier Limits

- **Web Services**: 750 hours/month (enough for 1 service 24/7)
- **Static Sites**: Unlimited
- **Bandwidth**: 100 GB/month
- **Build Minutes**: 500 minutes/month
- **Sleep**: After 15 minutes of inactivity
- **Wake Time**: 30-60 seconds

---

## 🎯 Your Deployment URLs

After successful deployment:

- **Frontend**: https://boipara.onrender.com
- **Backend**: https://boipara-backend.onrender.com
- **API Endpoint**: https://boipara-backend.onrender.com/api
- **MongoDB**: MongoDB Atlas Cloud

---

## 🚀 Automatic Deployments

Render automatically deploys when you push to GitHub:

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. Render automatically detects changes and redeploys
4. Check deployment status in Render dashboard

---

## 💰 Cost Breakdown

**Free Tier (Current Setup):**
- MongoDB Atlas: $0 (512MB storage)
- Render Backend: $0 (750 hours/month)
- Render Frontend: $0 (unlimited)
- **Total: $0/month**

**Paid Tier (Recommended for Production):**
- MongoDB Atlas: $0 (free tier sufficient)
- Render Backend: $7/month (always-on, no sleep)
- Render Frontend: $0 (unlimited)
- **Total: $7/month**

---

## 🎉 Success Checklist

- [ ] MongoDB Atlas cluster created and running
- [ ] Backend deployed to Render
- [ ] Frontend deployed to Render
- [ ] Environment variables configured
- [ ] Database seeded with initial data
- [ ] Can login with demo accounts
- [ ] Books display correctly
- [ ] Cart functionality works
- [ ] Orders can be placed
- [ ] No console errors

---

## 📞 Support

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Render Community**: https://community.render.com

---

**Deployment Time**: ~20-30 minutes
**Difficulty**: Easy
**Cost**: Free

🎊 **Congratulations! Your BOIPARA app is now live!** 🎊
