# Setup Guide for TiaTele MD React Native

## Initial Setup

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. iOS Setup

```bash
cd ios
pod install
cd ..
```

### 3. Android Setup

Ensure you have:
- Android Studio installed
- Android SDK configured
- Java Development Kit (JDK) installed

### 4. Generate iOS and Android Projects

If the native projects don't exist, you'll need to generate them:

```bash
# For iOS (requires macOS)
npx react-native init TiaTeleMD_RN --template react-native-template-typescript
# Then copy the ios and android folders to this project
```

Or manually create the native projects using React Native CLI.

## iOS Configuration

### Info.plist

Add the following permissions to `ios/TiaTeleMD_RN/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access for video calls</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access for audio/video calls</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs photo library access for file sharing</string>
```

### Podfile

Ensure your `ios/Podfile` includes:

```ruby
platform :ios, '13.0'
use_frameworks!

target 'TiaTeleMD_RN' do
  # Pods will be installed here
end
```

## Android Configuration

### AndroidManifest.xml

Add permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
```

### build.gradle

Ensure `android/app/build.gradle` has:

```gradle
android {
    compileSdkVersion 33
    defaultConfig {
        minSdkVersion 23
        targetSdkVersion 33
    }
}
```

## Running the App

### iOS

```bash
npm run ios
# or
yarn ios
```

### Android

```bash
npm run android
# or
yarn android
```

## Troubleshooting

### Metro Bundler Issues

```bash
npm start -- --reset-cache
```

### iOS Build Issues

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Android Build Issues

```bash
cd android
./gradlew clean
cd ..
```

## Environment Variables

Create a `.env` file (optional) for environment-specific configurations:

```
API_BASE_URL=your_api_url
SOCKET_BASE_URL=your_socket_url
```

## Next Steps

1. Configure push notifications (Firebase/APNs)
2. Set up code signing for iOS
3. Configure app icons and splash screens
4. Set up CI/CD pipeline
5. Configure analytics (if needed)
