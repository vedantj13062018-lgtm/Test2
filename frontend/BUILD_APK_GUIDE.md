# TiaTeleMD - Android APK Build Guide

This guide explains how to build a **standalone release APK** that works without Metro bundler or Expo.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Java JDK 17** (for Android)
3. **Android Studio** with SDK 34 and NDK 25.1.8937393
4. **Yarn** package manager

## Quick Build (Recommended - Using EAS Build)

The easiest way to build a release APK is using EAS Build cloud service:

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Build Release APK
```bash
cd frontend
yarn install
eas build --platform android --profile preview
```

This will produce a standalone APK that:
- ✅ Runs without Metro bundler
- ✅ Works on any Android device
- ✅ Bundles JavaScript into the APK
- ✅ Does NOT require Expo Go app

### Download APK
After build completes, EAS provides a download link for the APK.

---

## Local Build (Alternative)

If you want to build locally, follow these steps:

### Step 1: Install Dependencies
```bash
cd frontend
yarn install
```

### Step 2: Bundle JavaScript (Critical Step!)
```bash
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res
```

This bundles the JavaScript code into the APK so it doesn't need Metro.

### Step 3: Build Release APK
```bash
cd android
./gradlew assembleRelease
```

### Step 4: Find APK
The APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## Project Structure

```
frontend/
├── android/                    # Android native code
│   ├── app/
│   │   ├── build.gradle       # App build configuration
│   │   ├── google-services.json
│   │   └── src/main/
│   │       ├── assets/        # JS bundle goes here
│   │       └── java/          # Native modules
│   ├── build.gradle           # Root build configuration
│   └── settings.gradle
├── src/                        # React Native TypeScript source
│   ├── components/
│   ├── screens/
│   ├── services/
│   └── navigation/
├── index.js                    # Entry point
├── package.json
├── eas.json                    # EAS Build configuration
└── app.json                    # App configuration
```

---

## Configuration Files

### eas.json
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

### android/app/build.gradle
Key settings:
- `applicationId`: com.tiatech.tiatelemd
- `minSdkVersion`: 24
- `targetSdkVersion`: 34
- `compileSdkVersion`: 34

---

## Signing

For release builds, configure signing in `android/app/build.gradle`:

```gradle
signingConfigs {
    release {
        storeFile file('your-release-key.keystore')
        storePassword 'your-store-password'
        keyAlias 'your-key-alias'
        keyPassword 'your-key-password'
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
}
```

---

## Common Issues

### Issue: "Unable to load script"
**Solution**: The JS bundle is not included. Run the bundle command before building.

### Issue: Build fails with Gradle errors
**Solution**: 
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### Issue: Missing google-services.json
**Solution**: This file is already included at `android/app/google-services.json`

### Issue: NDK not found
**Solution**: Install NDK version 25.1.8937393 via Android Studio SDK Manager

---

## Environment Variables

Create a `.env` file if needed for API configuration:
```
BASE_URL=https://your-api-server.com
```

---

## Debug Panel

The app includes a debug panel (🔧 icon) on Task List and ICU List screens to help diagnose API issues. 

To open: Tap the 🔧 button in the header.

This panel shows:
- Session ID, User ID, Organization ID
- API endpoint being called
- Full API response/error

---

## Support

For build issues, check:
1. Node version: `node -v` (should be 18+)
2. Java version: `java -version` (should be 17)
3. Android SDK: Open Android Studio > SDK Manager
