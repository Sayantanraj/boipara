@echo off
echo ========================================
echo  BOIPARA - Alternative Push Methods
echo  Repository: https://github.com/Sayantanraj/boipara
echo ========================================
echo.

echo Choose your push method:
echo 1. Standard push (recommended)
echo 2. Force push (if conflicts exist)
echo 3. Pull first, then push (if behind)
echo 4. Check repository status only
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto standard_push
if "%choice%"=="2" goto force_push  
if "%choice%"=="3" goto pull_push
if "%choice%"=="4" goto check_status
goto invalid_choice

:standard_push
echo.
echo === Standard Push ===
git remote set-url origin https://github.com/Sayantanraj/boipara.git
git add .
git commit -m "Fix: Admin dashboard send email button now redirects to Gmail - Updated Send Email functionality to open Gmail with pre-filled professional template"
git push origin main
goto end

:force_push
echo.
echo === Force Push (WARNING: This will overwrite remote changes) ===
set /p confirm="Are you sure? This will overwrite remote changes (y/n): "
if /i "%confirm%"=="y" (
    git remote set-url origin https://github.com/Sayantanraj/boipara.git
    git add .
    git commit -m "Fix: Admin dashboard send email button now redirects to Gmail - Updated Send Email functionality to open Gmail with pre-filled professional template"
    git push origin main --force
) else (
    echo Push cancelled.
)
goto end

:pull_push
echo.
echo === Pull First, Then Push ===
git remote set-url origin https://github.com/Sayantanraj/boipara.git
git pull origin main
git add .
git commit -m "Fix: Admin dashboard send email button now redirects to Gmail - Updated Send Email functionality to open Gmail with pre-filled professional template"
git push origin main
goto end

:check_status
echo.
echo === Repository Status ===
echo Current remote:
git remote -v
echo.
echo Current branch:
git branch
echo.
echo Git status:
git status
echo.
echo Recent commits:
git log --oneline -5
goto end

:invalid_choice
echo Invalid choice. Please run the script again and choose 1-4.
goto end

:end
echo.
echo ========================================
echo  Operation completed!
echo  Repository: https://github.com/Sayantanraj/boipara
echo ========================================
echo.
pause