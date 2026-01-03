#!/bin/bash

# APK Build Instructions for Bidroom App
# ========================================

## Option 1: Using EAS Build (Recommended - No local setup needed)
# This builds the APK on Expo's servers

# 1. Make sure you're logged in to EAS
eas login

# 2. Build the APK
eas build -p android --profile preview

# 3. Once complete, download the APK from the provided URL
# The APK will be available at: https://expo.dev/accounts/ayanyar/projects/bidroom-construction-platform-st65nrxp/builds

## Option 2: Local Build (Requires Android Studio)
# This builds the APK on your local machine

# Prerequisites:
# - Install Android Studio
# - Install JDK 17
# - Set ANDROID_HOME environment variable
# - Add Android SDK tools to PATH

# 1. Generate Android project
npx expo prebuild --platform android

# 2. Build the APK
cd android
./gradlew assembleRelease

# 3. Find the APK at:
# android/app/build/outputs/apk/release/app-release.apk

## Current Build Issues:
# - Kotlin version incompatibility (Fixed: upgraded to 2.0.0)
# - Systrace deprecation in react-native-reanimated (Fixed: patch created)
# - EAS builds failing due to Gradle/dependency conflicts

## Recommended Next Steps:
# 1. Try EAS build one more time with --clear-cache
# 2. If still failing, downgrade react-native-reanimated to stable version
# 3. Or use Expo Go for testing (no APK needed)

## Quick Test with Expo Go:
# 1. Install Expo Go app on Android phone
# 2. Run: npx expo start --tunnel
# 3. Scan QR code with Expo Go app
