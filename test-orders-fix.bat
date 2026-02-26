@echo off
echo ========================================
echo BOIPARA Orders Fix - Quick Test
echo ========================================
echo.

echo Step 1: Testing MongoDB Connection...
cd backend
node testOrders.js
echo.

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ MongoDB test failed!
    echo    Make sure MongoDB is running on localhost:27017
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ MongoDB is working!
echo ✅ Found orders in database
echo ========================================
echo.
echo Next steps:
echo 1. Start backend: cd backend ^&^& npm run dev
echo 2. Start frontend: npm run dev
echo 3. Login as customer: sayantand652@gmail.com
echo 4. Go to "My Orders" section
echo.
echo Or use: start-dev.bat to start both servers
echo.
pause
