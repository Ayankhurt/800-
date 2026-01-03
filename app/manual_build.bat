@echo off
echo Setting up environment...
set "JAVA_HOME=E:\java"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Checking JAVA_HOME...
echo %JAVA_HOME%
java -version

cd android

echo Cleaning...
call gradlew.bat clean

echo Building Release APK...
call gradlew.bat assembleRelease > ..\build_log_latest.txt 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo Build Failed! Check build_log_latest.txt
    type ..\build_log_latest.txt | tail -n 20
    exit /b %ERRORLEVEL%
)

echo Build Success!
echo APK location: android\app\build\outputs\apk\release\app-release.apk
pause
