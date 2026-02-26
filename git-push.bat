@echo off
echo ========================================
echo BOIPARA - Git Push Script
echo ========================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo Initializing Git repository...
    git init
    echo.
)

REM Add remote if not exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Adding remote repository...
    git remote add origin https://github.com/Sayantanraj/boipara.git
    echo.
)

REM Add all files
echo Adding all files...
git add .
echo.

REM Commit changes
echo Committing changes...
git commit -m "Enhanced search features: autocomplete, history, and popular searches"
echo.

REM Push to GitHub
echo Pushing to GitHub...
git branch -M main
git push -u origin main
echo.

echo ========================================
echo Push completed successfully!
echo ========================================
pause
