# TiaTeleMD - React Native Mobile App

A healthcare telemedicine application built with React Native.

## Features

- **Dashboard**: Patient lists (OP, IP, Rounding, Appointments, My Patients)
- **Task Management**: Task List with escalation support
- **ICU Monitoring**: ICU patient list and monitoring
- **Clinical Assessment**: Patient clinical assessments
- **Notes & Documentation**: Patient notes management
- **Medications**: Prescription and medication management
- **Investigations**: Lab results and radiology studies
- **Video Calls**: Jitsi-based telemedicine calls
- **Chat**: Real-time messaging
- **Conference Calls**: Multi-party video conferencing

## Tech Stack

- React Native 0.73.2
- TypeScript
- React Navigation
- Redux Toolkit
- Axios for API calls
- Jitsi Meet SDK for video calls

## Project Structure

```
frontend/
├── android/          # Android native code
├── ios/              # iOS native code
├── src/
│   ├── components/   # Reusable components
│   ├── screens/      # Screen components
│   ├── services/     # API services
│   ├── store/        # Redux store
│   ├── navigation/   # Navigation configuration
│   ├── utils/        # Utility functions
│   └── constants/    # App constants
├── package.json
└── app.json
```

## Build Instructions

### Prerequisites
- Node.js 18+
- Java JDK 17
- Android SDK 34
- NDK 25.1.8937393

### Install Dependencies
```bash
cd frontend
yarn install
```

### Build Release APK

**Option 1: Using EAS Build (Recommended)**
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

**Option 2: Local Build**
```bash
# Bundle JavaScript
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

# Build APK
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Configuration

### API Configuration
Update `src/constants/index.ts` with your backend API URL.

### Firebase
Place your `google-services.json` in `android/app/`

## Screens Navigation

Access from side drawer menu (hamburger icon):
- Home
- Task List
- Task List Escalation
- ICU List
- Call Logs
- Conference Call
- Directory
- Chat
- File Share
- Help
- Support & Feedback
- Newsletters

## License

Proprietary - TiaTech
