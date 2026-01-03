@echo off
echo Setting up Correct Environment...
set "JAVA_HOME=E:\java"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Stopping Gradle Daemons...
cd android
call gradlew.bat --stop
cd ..

echo Cleaning Locked Folders forcefully...
if exist "node_modules\react-native-screens\android\build" (
    echo Deleting react-native-screens build folder...
    rmdir /s /q "node_modules\react-native-screens\android\build"
)

cd android
echo Cleaning Project...
call gradlew.bat clean

echo Building Release APK...
call gradlew.bat assembleRelease > ..\build_log_clean.txt 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo Build Failed! See build_log_clean.txt
    exit /b %ERRORLEVEL%
)

echo Build Success!
echo APK should be at: android\app\build\outputs\apk\release\app-release.apk
pause
