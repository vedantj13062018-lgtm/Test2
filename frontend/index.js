/**
 * @format
 */

// Silence Firebase v22 modular deprecation warnings (we use modular API; lib may still log)
if (typeof globalThis !== 'undefined') {
  globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
}

import { AppRegistry, Platform } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Register app first so "TiaTeleMD_RN has not been registered" never happens
// even if Firebase setup throws (e.g. getConstants of null)
AppRegistry.registerComponent(appName, () => App);

// FCM background handler – set after registration so native modules are ready.
// Use modular API (getApp, getMessaging, setBackgroundMessageHandler) to avoid deprecation and getConstants of null.
// Backend MUST send data-only messages for calls (no "notification" payload) or Android won't call this.
if (Platform.OS === 'android') {
  const setFcmBackgroundHandler = () => {
    try {
      // Load messaging package first so it registers with Firebase app (required for getMessaging(app))
      require('@react-native-firebase/messaging');
      const { getApp } = require('@react-native-firebase/app');
      const { getMessaging, setBackgroundMessageHandler } = require('@react-native-firebase/messaging');
      const app = getApp();
      const messaging = getMessaging(app);
      setBackgroundMessageHandler(messaging, async (remoteMessage) => {
        console.log('[index.js] FCM background handler invoked', remoteMessage ? 'has message' : 'null');
        if (!remoteMessage) return;
        const data = remoteMessage.data;
        console.log('[index.js] FCM data:', data ? JSON.stringify(data) : 'no data');
        if (!data) return;
        try {
          const voipService = require('./src/services/voipService').default;
          await voipService.handleIncomingCall(data);
          console.log('[index.js] FCM handleIncomingCall completed');
        } catch (e) {
          console.warn('[index.js] FCM background handler error:', e);
        }
      });
    } catch (e) {
      const msg = e?.message || String(e);
      if (msg.includes('could not be found') || msg.includes('messaging')) {
        // Optional: @react-native-firebase/messaging not installed or not linked
        __DEV__ && console.log('[index.js] FCM background handler skipped (messaging not available)');
      } else {
        console.warn('[index.js] FCM background handler setup failed:', e);
      }
    }
  };
  setImmediate(setFcmBackgroundHandler);
}
