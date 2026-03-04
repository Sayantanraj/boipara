# 🚀 Render Deployment - Quick Checklist

## ⏱️ Total Time: 20-30 minutes

---

## Step 1: MongoDB Atlas (5 minutes)

- [ ] Go to https://www.mongodb.com/cloud/atlas
- [ ] Sign up / Login
- [ ] Create FREE cluster (M0)
- [ ] Create database user: `boipara_admin` with password
- [ ] Add IP: 0.0.0.0/0 (Allow from anywhere)
- [ ] Get connection string
- [ ] Replace `<password>` and add `/boipara` before `?`

**Connection String Format:**
```
mongodb+srv://boipara_admin:YOUR_PASSWORD@cluster.xxxxx.mongodb.net/boipara?retryWrites=true&w=majority
```

---

## Step 2: Deploy Backend (10 minutes)

- [ ] Go to https://render.com/dashboard
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub → Select `Sayantanraj/boipara`
- [ ] Configure:
  - Name: `boipara-backend`
  - Root Directory: `backend`
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Instance Type: **Free**

- [ ] Add Environment Variables:
  ```
  MONGODB_URI=<your-mongodb-connection-string>
  JWT_SECRET=boipara-super-secret-jwt-key-minimum-32-characters-long-2024
  PORT=3001
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587
  EMAIL_USER=your-email@gmail.com
  EMAIL_PASS=your-gmail-app-password
  FRONTEND_URL=https://boipara.onrender.com
  NODE_ENV=production
  ```

- [ ] Click "Create Web Service"
- [ ] Wait for deployment (5-10 min)
- [ ] Note backend URL: `https://boipara-backend.onrender.com`
- [ ] Test: Visit `https://boipara-backend.onrender.com/api/books`

---

## Step 3: Deploy Frontend (10 minutes)

- [ ] Go to Render Dashboard
- [ ] Click "New +" → "Static Site"
- [ ] Select `Sayantanraj/boipara`
- [ ] Configure:
  - Name: `boipara`
  - Build Command: `npm install && npm run build`
  - Publish Directory: `dist`

- [ ] Add Environment Variable:
  ```
  VITE_API_URL=https://boipara-backend.onrender.com/api
  ```

- [ ] Click "Create Static Site"
- [ ] Wait for deployment (5-10 min)
- [ ] Frontend URL: `https://boipara.onrender.com`

---

## Step 4: Update Backend CORS (2 minutes)

- [ ] Go to `boipara-backend` service in Render
- [ ] Click "Environment" tab
- [ ] Update `FRONTEND_URL` to: `https://boipara.onrender.com`
- [ ] Save (auto-redeploys)

---

## Step 5: Seed Database (3 minutes)

**Option A: Using Render Shell**
- [ ] Go to `boipara-backend` service
- [ ] Click "Shell" tab
- [ ] Run: `node seed.js`

**Option B: Using Local Machine**
- [ ] Update `backend/.env` with MongoDB connection string
- [ ] Run: `cd backend && node seed.js`

---

## Step 6: Test Everything (5 minutes)

- [ ] Visit: `https://boipara.onrender.com`
- [ ] Login with: `customer@test.com` (any password)
- [ ] Browse books
- [ ] Add to cart
- [ ] Place test order
- [ ] Check seller dashboard: `seller@test.com`
- [ ] Check admin dashboard: `admin@test.com`

---

## ✅ Success Indicators

✅ Backend responds at `/api/books`
✅ Frontend loads without errors
✅ Can login with demo accounts
✅ Books display correctly
✅ Cart works
✅ Orders can be placed
✅ No console errors

---

## 🔧 Quick Fixes

### "Cannot connect to backend"
→ Check `VITE_API_URL` in frontend environment variables

### "CORS error"
→ Update `FRONTEND_URL` in backend environment variables

### "MongoDB connection failed"
→ Check IP whitelist (0.0.0.0/0) and connection string

### "Service unavailable" (after 15 min)
→ Normal for free tier - first request wakes it up (30-60 sec)

---

## 📝 Save These URLs

- **Frontend**: https://boipara.onrender.com
- **Backend**: https://boipara-backend.onrender.com
- **MongoDB**: https://cloud.mongodb.com
- **Render Dashboard**: https://render.com/dashboard

---

## 💡 Pro Tips

1. **Free tier sleeps after 15 min** - First request takes 30-60 sec
2. **Upgrade to $7/month** for always-on backend
3. **Use UptimeRobot** to ping every 14 min (keeps it awake)
4. **Auto-deploys** when you push to GitHub
5. **Check logs** in Render dashboard if issues occur

---

## 🎉 You're Done!

Your BOIPARA marketplace is now live and accessible worldwide!

**Cost**: $0/month (Free tier)
**Uptime**: 99%+ (with occasional cold starts)
**Auto-deploy**: Yes (on GitHub push)

Share your link: `https://boipara.onrender.com` 🚀
