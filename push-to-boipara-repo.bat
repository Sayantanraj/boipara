@echo off
echo ========================================
echo  BOIPARA - Pushing to GitHub Repository
echo  Repository: https://github.com/Sayantanraj/boipara
echo ========================================
echo.

echo Checking current remote origin...
git remote -v

echo.
echo Setting remote origin to your repository...
git remote set-url origin https://github.com/Sayantanraj/boipara.git

echo.
echo Verifying remote origin...
git remote -v

echo.
echo Adding all changes to git...
git add .

echo.
echo Committing changes...
git commit -m "Fix: Admin dashboard send email button now redirects to Gmail

- Updated Send Email button in raised tickets section to redirect to Gmail
- Removed unused email modal code and state variables  
- Added email validation and error handling
- Enhanced Gmail URL generation with pre-filled professional template
- Added proper URL encoding for email parameters
- Improved user feedback with success/error toasts

Features:
✅ Direct Gmail integration in same browser tab
✅ Pre-filled professional email template  
✅ Error handling for missing email addresses
✅ Success confirmation with recipient email
✅ Professional formatting with support contact details

Technical Changes:
- Modified AdminDashboard.tsx Send Email button onClick handler
- Removed showEmailModal, selectedTicketForEmail, emailContent, sendingEmail state
- Added Gmail compose URL generation with encodeURIComponent
- Enhanced error handling for missing user email addresses
- Added toast notifications for user feedback"

echo.
echo Pushing to GitHub repository: https://github.com/Sayantanraj/boipara
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  ✅ SUCCESS! Code pushed to GitHub
    echo  Repository: https://github.com/Sayantanraj/boipara
    echo ========================================
    echo.
    echo Your email fix is now live on GitHub!
    echo You can view it at: https://github.com/Sayantanraj/boipara/commits/main
) else (
    echo.
    echo ========================================
    echo  ❌ ERROR: Push failed
    echo ========================================
    echo.
    echo Possible solutions:
    echo 1. Make sure you're logged into GitHub
    echo 2. Check if you have push permissions to the repository
    echo 3. Try: git push origin main --force (use with caution)
    echo 4. Or try: git pull origin main first, then push again
)

echo.
pause