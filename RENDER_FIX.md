# 🔧 Render Deployment Fix Guide

## Problem
Frontend shows: "Cannot connect to backend server at http://localhost:3001/api"

## Root Causes
1. Frontend environment variable not set
2. Backend service not running or crashed
3. MongoDB Atlas connection issue

---

## ✅ Solution Steps

### Step 1: Check Backend Service Status
1. Go to https://dashboard.render.com
2. Find your **backend service** (boipara-backend)
3. Check if it shows **"Live"** (green) or **"Failed"** (red)
4. Click on **Logs** tab to see errors

**Common Backend Errors:**
- MongoDB connection timeout → Check MongoDB Atlas IP whitelist
- Missing environment variables → Add them in Environment tab
- Build failed → Check package.json scripts

---

### Step 2: Configure Backend Environment Variables

In your **Backend Service** on Render, add these:

```
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/boipara?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here-change-this
NODE_ENV=production
PORT=3001
```

**Important:** 
- Replace `YOUR_USERNAME`, `YOUR_PASSWORD`, `YOUR_CLUSTER` with your actual MongoDB Atlas credentials
- Get connection string from MongoDB Atlas → Connect → Drivers

---

### Step 3: Configure Frontend Environment Variable

In your **Frontend Service** on Render, add:

```
VITE_API_URL=https://YOUR-BACKEND-SERVICE-NAME.onrender.com/api
```

**Example:**
```
VITE_API_URL=https://boipara-backend.onrender.com/api
```

**How to add:**
1. Go to your frontend service
2. Click **Environment** in left sidebar
3. Click **Add Environment Variable**
4. Key: `VITE_API_URL`
5. Value: Your backend URL + `/api`
6. Click **Save Changes**

---

### Step 4: Fix MongoDB Atlas Network Access

1. Go to https://cloud.mongodb.com
2. Click **Network Access** in left sidebar
3. Click **Add IP Address**
4. Click **Allow Access from Anywhere** (0.0.0.0/0)
5. Click **Confirm**

**Why?** Render uses dynamic IPs, so you need to allow all IPs.

---

### Step 5: Verify Backend is Running

**Test your backend directly:**
```
https://YOUR-BACKEND-SERVICE-NAME.onrender.com/api/books
```

**Expected:** JSON response with books data
**If error:** Check backend logs in Render dashboard

---

### Step 6: Manual Redeploy (if needed)

**Backend:**
1. Go to backend service
2. Click **Manual Deploy** → **Deploy latest commit**

**Frontend:**
1. Go to frontend service  
2. Click **Manual Deploy** → **Deploy latest commit**

---

## 🔍 Debugging Checklist

- [ ] Backend service shows "Live" status
- [ ] Backend logs show "Connected to MongoDB"
- [ ] Backend logs show "Server running on port 3001"
- [ ] MongoDB Atlas allows 0.0.0.0/0 IP access
- [ ] Frontend has VITE_API_URL environment variable
- [ ] Backend URL is accessible (test in browser)
- [ ] Both services redeployed after adding env variables

---

## 📝 Quick Test

**1. Test Backend Health:**
```
https://boipara-backend.onrender.com/api/books
```
Should return JSON with books.

**2. Test Frontend:**
```
https://boipara.onrender.com
```
Should load without localhost errors.

**3. Test Login:**
- Email: customer@test.com
- Password: password123

---

## 🚨 Still Not Working?

**Check Backend Logs:**
1. Go to backend service in Render
2. Click **Logs** tab
3. Look for errors like:
   - "MongoServerError" → MongoDB connection issue
   - "ECONNREFUSED" → MongoDB Atlas IP not whitelisted
   - "Missing environment variable" → Add missing env vars

**Common Fixes:**
- MongoDB timeout → Add 0.0.0.0/0 to IP whitelist
- 502 Bad Gateway → Backend crashed, check logs
- CORS error → Backend needs to allow frontend origin

---

## 📞 Need Help?

Share your backend logs from Render dashboard for specific error diagnosis.
