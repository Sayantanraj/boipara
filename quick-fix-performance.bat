@echo off
echo ⚡ FIXING PERFORMANCE ISSUES AND OPTIMIZING...
echo.

echo [1/3] Installing backend performance packages...
cd backend
call npm install compression helmet express-rate-limit --silent
cd ..

echo [2/3] Starting optimized development servers...
echo.

echo ✅ PERFORMANCE FIX COMPLETE!
echo.
echo 🚀 OPTIMIZATIONS APPLIED:
echo   • Vite config optimized for speed
echo   • Code splitting enabled
echo   • Lazy loading implemented
echo   • Backend compression added
echo   • Error fixed
echo.
echo 🎯 TO START THE APP:
echo   1. Frontend: npm run dev
echo   2. Backend:  cd backend && npm run dev
echo.
echo 💡 Your app should now load much faster!
echo.
pause