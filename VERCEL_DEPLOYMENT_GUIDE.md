# 🚀 BOIPARA Vercel Deployment Guide

## Prerequisites
- Vercel account (https://vercel.com)
- MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)
- GitHub repository (already done ✅)

## Step 1: Setup MongoDB Atlas (Cloud Database)

1. **Create MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free tier

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose FREE tier (M0)
   - Select region closest to you
   - Click "Create"

3. **Setup Database Access**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Username: `boipara_admin`
   - Password: Generate secure password (save it!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Setup Network Access**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Replace `<dbname>` with `boipara`
   - Example: `mongodb+srv://boipara_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/boipara?retryWrites=true&w=majority`

## Step 2: Deploy Backend to Vercel

1. **Login to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy Backend**
   ```bash
   cd backend
   vercel
   ```
   
   Follow prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name: `boipara-backend`
   - Directory: `./` (current directory)
   - Override settings? **N**

3. **Add Environment Variables**
   
   Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   
   Add these variables:
   ```
   MONGODB_URI=mongodb+srv://boipara_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/boipara?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-12345
   PORT=3001
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-gmail-app-password
   FRONTEND_URL=https://boipara.vercel.app
   ```

4. **Redeploy Backend**
   ```bash
   vercel --prod
   ```

5. **Note Your Backend URL**
   - Example: `https://boipara-backend.vercel.app`

## Step 3: Update Frontend Configuration

1. **Create Environment File**
   
   Create `.env.production` in root directory:
   ```env
   VITE_API_URL=https://boipara-backend.vercel.app/api
   ```

2. **Update api.ts to use environment variable**
   
   The API_BASE will be updated to use environment variable

## Step 4: Deploy Frontend to Vercel

1. **Deploy Frontend**
   ```bash
   cd ..  # Back to root directory
   vercel
   ```
   
   Follow prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name: `boipara`
   - Directory: `./` (current directory)
   - Override settings? **N**

2. **Add Environment Variables**
   
   Go to Vercel Dashboard → boipara project → Settings → Environment Variables
   
   Add:
   ```
   VITE_API_URL=https://boipara-backend.vercel.app/api
   ```

3. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Step 5: Update Backend CORS

After frontend is deployed, update backend environment variable:

1. Go to Vercel Dashboard → boipara-backend → Settings → Environment Variables
2. Update `FRONTEND_URL` to your actual frontend URL
3. Redeploy backend: `cd backend && vercel --prod`

## Step 6: Seed Database (Optional)

Run seed script to populate initial data:

```bash
cd backend
node seed.js
```

## Step 7: Test Your Deployment

1. Visit your frontend URL: `https://boipara.vercel.app`
2. Try logging in with demo accounts:
   - Customer: customer@test.com
   - Seller: seller@test.com
   - Admin: admin@test.com

## 🔧 Troubleshooting

### Backend Connection Error
- Check MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Verify MONGODB_URI is correct in Vercel environment variables
- Check Vercel function logs for errors

### CORS Error
- Ensure FRONTEND_URL in backend matches your frontend URL
- Redeploy backend after changing environment variables

### Build Errors
- Check Vercel build logs
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

## 📝 Important Notes

1. **Free Tier Limitations**
   - Vercel: 100GB bandwidth/month
   - MongoDB Atlas: 512MB storage
   - Functions timeout: 10 seconds (hobby), 60 seconds (pro)

2. **Environment Variables**
   - Always use environment variables for secrets
   - Never commit .env files to Git
   - Redeploy after changing environment variables

3. **Custom Domain (Optional)**
   - Go to Vercel Dashboard → Project → Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

## 🎉 Your URLs

After deployment:
- **Frontend**: https://boipara.vercel.app
- **Backend**: https://boipara-backend.vercel.app
- **API**: https://boipara-backend.vercel.app/api

---

**Need Help?** Check Vercel documentation: https://vercel.com/docs
