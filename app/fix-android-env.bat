@echo off
REM Fix Android Environment Variables for User HP

echo Setting ANDROID_HOME...
setx ANDROID_HOME "C:\Users\HP\AppData\Local\Android\Sdk"

echo Setting JAVA_HOME...
setx JAVA_HOME "C:\Program Files\Android\Android Studio\jbr"

echo Adding to PATH...
setx PATH "%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%JAVA_HOME%\bin"

echo.
echo ========================================
echo Environment variables updated!
echo Please RESTART your terminal/PowerShell
echo ========================================
pause
