@echo off
echo ========================================
echo BOIPARA Backend Server
echo ========================================
echo.
echo Starting backend server on port 3001...
echo MongoDB: mongodb://localhost:27017/boipara
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd backend
npm run dev
