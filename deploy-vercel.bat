@echo off
echo ========================================
echo BOIPARA Vercel Deployment Script
echo ========================================
echo.

echo Step 1: Installing Vercel CLI...
call npm install -g vercel
echo.

echo Step 2: Deploying Backend...
cd backend
echo Deploying backend to Vercel...
call vercel --prod
cd ..
echo.

echo Step 3: Deploying Frontend...
echo Deploying frontend to Vercel...
call vercel --prod
echo.

echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Go to Vercel Dashboard
echo 2. Add environment variables to both projects
echo 3. Redeploy if needed
echo.
echo See VERCEL_DEPLOYMENT_GUIDE.md for details
echo.
pause
