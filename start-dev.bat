@echo off
echo Starting BOIPARA Development Environment...
echo.

echo [1/3] Starting MongoDB (if not running)...
echo Make sure MongoDB is running on localhost:27017
echo.

echo [2/3] Starting Backend Server...
start "Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul

echo [3/3] Starting Frontend Development Server...
start "Frontend" cmd /k "npm run dev"

echo.
echo ✅ BOIPARA is starting up!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
pause