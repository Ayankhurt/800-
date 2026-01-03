@echo off
echo ==========================================
echo FINAL BUILD SCRIPT
echo ==========================================

echo [1/5] Setting up Environment...
set "JAVA_HOME=E:\java"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo [2/5] Killing interfering processes...
taskkill /F /IM java.exe >nul 2>&1
taskkill /F /IM openjdk-platform-binary.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo [3/5] Force Cleaning Locked Folders...
if exist "node_modules\react-native-screens\android\build" (
    echo Removing locked build folder...
    rmdir /s /q "node_modules\react-native-screens\android\build" || (
        echo Failed to remove folder. Retrying in 5 seconds...
        timeout /t 5 /nobreak >nul
        rmdir /s /q "node_modules\react-native-screens\android\build"
    )
)

cd android

echo [4/5] Skipping strict 'clean' task to avoid locks...
echo Starting Release Build...

echo [5/5] Building APK...
call gradlew.bat assembleRelease > ..\build_log_final.txt 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo ==========================================
    echo BUILD FAILED! 
    echo Checking last 20 lines of log:
    echo ==========================================
    type ..\build_log_final.txt | tail -n 20
    exit /b %ERRORLEVEL%
)

echo ==========================================
echo BUILD SUCCESSFUL! 🎉
echo APK: android\app\build\outputs\apk\release\app-release.apk
echo ==========================================
pause
