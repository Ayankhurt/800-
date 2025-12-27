@echo off
echo.
echo ========================================
echo   Starting Backend Server
echo ========================================
echo.

cd /d "c:\Users\HP\Desktop\800$\800-\backend"

echo Checking if server is already running...
curl -s http://192.168.1.113:5000/api/health >nul 2>&1
if %errorlevel% == 0 (
    echo Backend is already running!
    echo.
    goto :test
)

echo Starting backend server...
start "BidRoom Backend" cmd /k "npm run dev"

echo Waiting for server to start...
timeout /t 10 /nobreak >nul

:waitloop
curl -s http://192.168.1.113:5000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo Still waiting...
    timeout /t 2 /nobreak >nul
    goto :waitloop
)

echo.
echo ========================================
echo   Backend Server Started Successfully!
echo ========================================
echo.

:test
echo Running complete test suite...
echo.
node test-complete-flow.js

echo.
echo ========================================
echo   Testing Complete!
echo ========================================
echo.
pause
