@echo off
echo ========================================
echo  BOIPARA - Pushing Chatbot Center Fix
echo ========================================
echo.

echo [1/4] Adding all changes...
git add .

echo [2/4] Committing changes...
git commit -m "Fix: Center chatbot on mobile view and resolve JSX syntax error

- Fixed chatbot positioning to be centered on mobile devices
- Added proper responsive classes: left-1/2, transform -translate-x-1/2
- Maintains bottom-right position on desktop with md:left-auto md:right-8
- Resolved missing closing div tag causing import error
- Chatbot now properly centers horizontally on mobile screens"

echo [3/4] Pushing to GitHub...
git push origin main

echo [4/4] Done!
echo.
echo ✅ Chatbot centering fix has been pushed to GitHub!
echo 📱 Mobile users will now see the chatbot centered
echo 💻 Desktop users still see it in bottom-right corner
echo.
pause