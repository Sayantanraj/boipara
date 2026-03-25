@echo off
echo ========================================
echo    BOIPARA - Render Deployment Fix
echo ========================================
echo.

echo Installing terser dependency...
npm install --save-dev terser@^5.36.0
echo.

echo Updating package-lock.json...
npm install
echo.

echo Testing build locally...
npm run build
echo.

echo Committing fixes...
git add package.json package-lock.json vite.config.ts
git commit -m "Fix Render deployment: Add terser dependency for Vite v6"
echo.

echo Pushing to GitHub...
git push origin main
echo.

echo ========================================
echo    Render deployment fix complete!
echo    Redeploy on Render should now work.
echo ========================================
pause