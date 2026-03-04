# 🚀 Quick Deployment Checklist

## ✅ Pre-Deployment (Do Once)

- [ ] Create MongoDB Atlas account
- [ ] Create free cluster on MongoDB Atlas
- [ ] Setup database user with password
- [ ] Whitelist all IPs (0.0.0.0/0)
- [ ] Get MongoDB connection string
- [ ] Create Vercel account
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Login to Vercel: `vercel login`

## ✅ Backend Deployment

- [ ] Navigate to backend folder: `cd backend`
- [ ] Deploy: `vercel`
- [ ] Note the deployment URL
- [ ] Go to Vercel Dashboard → boipara-backend → Settings → Environment Variables
- [ ] Add all environment variables from `vercel-env-template.txt`
- [ ] Redeploy: `vercel --prod`
- [ ] Test backend: Visit `https://your-backend-url.vercel.app/api/books`

## ✅ Frontend Deployment

- [ ] Navigate to root folder: `cd ..`
- [ ] Update `.env.production` with backend URL
- [ ] Deploy: `vercel`
- [ ] Note the deployment URL
- [ ] Go to Vercel Dashboard → boipara → Settings → Environment Variables
- [ ] Add: `VITE_API_URL=https://your-backend-url.vercel.app/api`
- [ ] Redeploy: `vercel --prod`

## ✅ Post-Deployment

- [ ] Update backend `FRONTEND_URL` environment variable with actual frontend URL
- [ ] Redeploy backend: `cd backend && vercel --prod`
- [ ] Visit your frontend URL
- [ ] Test login with demo accounts
- [ ] Test book browsing
- [ ] Test cart functionality
- [ ] Test order placement

## 🔧 If Something Goes Wrong

### Backend not connecting to MongoDB
1. Check MongoDB Atlas IP whitelist
2. Verify connection string in Vercel environment variables
3. Check Vercel function logs

### Frontend can't connect to backend
1. Verify `VITE_API_URL` in frontend environment variables
2. Check backend CORS settings
3. Ensure backend is deployed and running

### CORS errors
1. Update `FRONTEND_URL` in backend environment variables
2. Redeploy backend
3. Clear browser cache

## 📝 Important URLs

After deployment, save these:

- **Frontend**: https://boipara.vercel.app
- **Backend**: https://boipara-backend.vercel.app
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Vercel Dashboard**: https://vercel.com/dashboard

## 🎉 Success Indicators

✅ Frontend loads without errors
✅ Can login with demo accounts
✅ Books display correctly
✅ Can add items to cart
✅ Can place orders
✅ No console errors

---

**Total Time**: ~30 minutes
**Cost**: $0 (Free tier)
