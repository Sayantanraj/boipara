@echo off
echo ========================================
echo    BOIPARA - GitHub Update Script
echo ========================================
echo.

:: Check if git is initialized
if not exist ".git" (
    echo Initializing Git repository...
    git init
    echo.
)

:: Add remote origin if not exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Adding GitHub remote...
    git remote add origin https://github.com/Sayantanraj/boipara.git
    echo.
)

:: Stage all changes
echo Staging all changes...
git add .
echo.

:: Commit with timestamp
echo Committing changes...
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD% %HH%:%Min%:%Sec%"

git commit -m "Update BOIPARA project - %timestamp%"
echo.

:: Push to GitHub
echo Pushing to GitHub...
git branch -M main
git push -u origin main
echo.

echo ========================================
echo    Successfully updated GitHub repo!
echo    Repository: https://github.com/Sayantanraj/boipara
echo ========================================
echo.
pause