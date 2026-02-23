# TiaTele MD - React Native

A complete React Native replica of the TiaTele MD iOS application, built with TypeScript, Redux Toolkit, and modern React Native best practices.

## Features

- ✅ Secure authentication with MFA support
- ✅ Organization selection
- ✅ Real-time video calls using Jitsi Meet SDK
- ✅ Real-time chat using Socket.IO
- ✅ Dashboard with patient management
- ✅ Inbox for messages and alerts
- ✅ Encounter management
- ✅ Patient history
- ✅ Appointments
- ✅ Task lists
- ✅ ICU patient management
- ✅ File sharing
- ✅ Clinical assessments
- ✅ Medications and investigations
- ✅ ICD/CPT codes
- ✅ Notes management
- ✅ And much more...

## Tech Stack

- **React Native** 0.73.2
- **TypeScript**
- **Redux Toolkit** for state management
- **React Navigation** for navigation
- **Jitsi Meet SDK** for video calls
- **Socket.IO** for real-time communication
- **Axios** for API calls
- **React Native Keychain** for secure storage
- **Crypto-JS** for encryption

## Project Structure

```
TiaTeleMD_RN/
├── src/
│   ├── constants/       # App constants and API endpoints
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions (storage, encryption, validation, etc.)
│   ├── services/        # API and Socket services
│   ├── store/           # Redux store and slices
│   ├── navigation/      # Navigation setup
│   ├── screens/         # Screen components
│   │   ├── Auth/        # Authentication screens
│   │   ├── Dashboard/   # Dashboard screen
│   │   ├── Inbox/       # Inbox screens
│   │   ├── Chats/       # Chat list screen
│   │   ├── Chat/        # Chat screen
│   │   ├── VideoCall/   # Video call screen
│   │   └── Menu/        # Menu screen
│   └── components/      # Reusable components
├── android/             # Android native code
├── ios/                 # iOS native code
├── App.tsx              # Main app component
├── index.js             # Entry point
└── package.json         # Dependencies
```

## Setup Instructions

### Prerequisites

- Node.js >= 18
- React Native CLI
- Xcode (for iOS)
- Android Studio (for Android)
- CocoaPods (for iOS)

### Installation

1. **Install dependencies:**

```bash
npm install
# or
yarn install
```

2. **Install iOS pods:**

```bash
cd ios && pod install && cd ..
```

3. **Configure environment:**

Update the base URL and socket URL in the app. These should be set during the app code check process (similar to Swift implementation).

### Running the App

**iOS:**

```bash
npm run ios
# or
yarn ios
```

**Android:**

```bash
npm run android
# or
yarn android
```

## Configuration

### API Configuration

The app uses encrypted API calls. Base URL and socket URL are stored securely and loaded from the app code check API (similar to Swift implementation).

### Permissions

The app requires the following permissions:

- **Camera** (for video calls)
- **Microphone** (for audio/video calls)
- **Storage** (for file sharing)
- **Notifications** (for push notifications)

These permissions are requested at runtime when needed.

## Key Features Implementation

### Authentication Flow

1. **Splash Screen** - Checks for existing session
2. **Login Screen** - Username/password authentication
3. **MFA Screen** - Multi-factor authentication if enabled
4. **Organization Selection** - Select organization if user belongs to multiple

### Video Calls

- Uses Jitsi Meet SDK for video conferencing
- Supports group calls and direct calls
- Handles call states (connecting, active, ended)
- Moderator controls for group calls

### Android: Receiving calls from Swift (FCM + Socket)

Incoming calls are shown via CallKeep when:

1. **FCM (foreground/background/killed):** Backend must send **data-only** FCM messages (no `notification` payload). If the message has both `notification` and `data`, Android may not call our handler when the app is in background. Data payload should include at least:
   - `broadcast_id` (room ID)
   - `alert_type`: `CALLFROMWEB`, `DirectCall`, or `GroupCall`
   - `sender_name` or `caller_name` (caller display name)

2. **Socket:** When the app is in foreground and connected, `onNormalCallToGroupCall` also triggers the same incoming-call UI.

**Where to check FCM logs (important):** Check on **Android** — the device or emulator where the **React Native app is running** (the callee). When Swift initiates a call, the **server** sends FCM to the callee’s device; the RN app on that Android device receives the message and logs there. You do **not** check FCM delivery on iOS when testing Swift → RN.

**Debugging step-by-step:**

1. **On the Android device/emulator:** Start the RN app and log in (so the backend has this device’s FCM token and `device_type: 2`).
2. **On your computer:** Connect the Android device (or use emulator) and run:
   ```bash
   adb logcat *:S ReactNative:V ReactNativeJS:V
   ```
3. **From Swift (iOS):** Initiate a call to the user who is logged in on the RN Android app.
4. **Watch the Android logcat.** You should see one of:
   - **App in foreground:** `[VoipService] FCM Foreground Message received:` then `[VoipService] handleIncomingCall called with payload:`
   - **App in background/killed:** `[index.js] FCM background handler invoked` then `[index.js] FCM data:`
   - **Socket path (foreground):** `[SocketService] Incoming call via socket – showing CallKeep:`

If you **never** see any of these when Swift calls, the backend is probably not sending FCM to this Android device (e.g. token not stored, or wrong `device_type`). If you see `handleIncomingCall` but no incoming-call UI, check for `displayIncomingCall failed` or **CallKeep setup: false** (see below).

**CallKeep setup: false:** On Android, this usually means the app does not have the “phone accounts” / ConnectionService permission. The user must allow “Make and manage phone calls” (or equivalent) when the app prompts, or enable the app in **Settings → Apps → Default apps → Calling app** (or **Phone app**). Without this, the incoming-call screen may not show even when FCM is received.

### Real-time Chat

- Socket.IO for real-time messaging
- Support for one-on-one and group chats
- File attachments
- Message status indicators

### Secure Storage

- Uses React Native Keychain for sensitive data
- AsyncStorage for non-sensitive data
- Encryption for API requests/responses

## API Endpoints

All API endpoints are defined in `src/constants/index.ts`. The app uses encrypted POST requests with special headers matching the Swift implementation.

## State Management

Redux Toolkit is used for state management with the following slices:

- `authSlice` - Authentication and user data
- `chatSlice` - Chat messages and conversations
- `callSlice` - Video call state
- `inboxSlice` - Inbox messages and alerts
- `dashboardSlice` - Dashboard data
- `taskSlice` - Task management

## Development

### Adding New Screens

1. Create screen component in `src/screens/`
2. Add route to `src/navigation/AppNavigator.tsx` or `MainTabsNavigator.tsx`
3. Add types to `src/types/index.ts`
4. Add API endpoints to `src/constants/index.ts` if needed

### Adding New API Endpoints

1. Add endpoint constant to `src/constants/index.ts`
2. Use `apiService.postEncrypted()` or `apiService.post()` in your component
3. Handle response and update Redux state if needed

## Building for Production

### iOS

1. Update version in `ios/TiaTeleMD_RN/Info.plist`
2. Archive in Xcode
3. Upload to App Store

### Android

1. Update version in `android/app/build.gradle`
2. Generate signed APK/AAB
3. Upload to Google Play Store

## Security Considerations

- All API requests are encrypted
- Sensitive data stored in Keychain
- Session tokens managed securely
- No hardcoded secrets in code

## Troubleshooting

### iOS Build Issues

- Run `cd ios && pod install`
- Clean build folder in Xcode
- Check deployment target matches Podfile

### Android Build Issues

- Clean gradle: `cd android && ./gradlew clean`
- Check SDK versions in `build.gradle`
- Ensure Java version is compatible

### Metro Bundler Issues

- Clear cache: `npm start -- --reset-cache`
- Delete `node_modules` and reinstall

## License

Copyright © TiaTech. All rights reserved.

## Support

For issues or questions, please contact the development team.
