/**
 * App Code Service
 * Handles app code validation and fetching BASE_URL configuration
 */

import axios, { AxiosResponse } from 'axios';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import { saveStringToStorage, getStringFromStorage } from '../utils/storage';
import {
  APP_CODE,
  BASE_URL,
  BASE_SOCKET_URL,
  SERVER_URL,
  GROUP_CALL_URL,
  TURN_USERNAME,
  TURN_PASSWORD,
  TURN,
  IS_APIAPPCHECK_IN,
  DEFAULT_BASE_URL,
  DEFAULT_BASE_SOCKET_URL,
} from '../constants';
import { getAppVersion, getBuildNumber, getDeviceUniqueId } from '../utils/device';

const APP_CODE_API_BASE = 'https://mobappversion.tiamd.com/api';
const API_APPCHECK = 'appCheck';

/**
 * Generate headers for app code API (matches Swift headerGeneration)
 */
const generateHeaders = async (): Promise<Record<string, string>> => {
  const date = new Date();
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    hour12: false,
  });

  // Format: YYYYMMddHHmmss
  const timeStamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
  
  const deviceId = await getDeviceUniqueId();
  const method = `POST\n${timeStamp}\n${deviceId}\n`;
  
  // HMAC SHA256 with secret key
  const hmacString = CryptoJS.HmacSHA256(method, '1ff3fb645665593b7649fdc6afb70b0b').toString(CryptoJS.enc.Base64);
  const hmac = `PROCESSPROXY:${hmacString}`;

  return {
    'APP': 'TiaConcierge',
    'DATED': timeStamp,
    'DEVICEID': deviceId,
    'AUTH': hmac,
    'ISENCRYPTED': 'yes',
    'AUTHENCRYPTED': 'yes',
    'Content-Type': 'application/x-www-form-urlencoded',
  };
};

/**
 * Fetch app configuration using app code
 */
export const fetchAppConfig = async (appCode: string): Promise<boolean> => {
  try {
    const version = getAppVersion();
    const buildNumber = getBuildNumber();
    
    // Params matching Swift SignInViewController.swift lines 560-563
    // Swift sends: appCode, type: "IOS", version
    // Note: session_id, user_id, organization_id are not sent in Swift app code API
    const params = new URLSearchParams({
      appCode: appCode,
      type: Platform.OS === 'ios' ? 'IOS' : 'ANDROID', // Match Swift: "IOS" for iOS
      version: version || '1.0.0',
    });

    const headers = await generateHeaders();

    const response: AxiosResponse = await axios.post(
      `${APP_CODE_API_BASE}/${API_APPCHECK}`,
      params.toString(),
      {
        headers,
      }
    );

    if (response.data && response.data.code === '100') {
      const data = response.data.data;
      
      // Save app code
      await saveStringToStorage(APP_CODE, appCode);
      
      // Decode and decrypt the appData
      if (data.appData) {
        const decoded = await decodeAndDecryptAppData(data.appData);
        
        if (decoded) {
          // Save configuration values (match StrokeTeamOne LoginActivity.setAppDatas / AppData model)
          // api → SERVER_URL = Node (logout, socket). server_url → BASE_URL = PHP (login, base APIs).
          if (decoded.api) {
            await saveStringToStorage(SERVER_URL, decoded.api);
          }
          if (decoded.server_url) {
            await saveStringToStorage(BASE_URL, decoded.server_url);
          }
          if (decoded.base) {
            await saveStringToStorage(BASE_SOCKET_URL, decoded.base);
          }
          if (decoded.apiGroupCallURL) {
            await saveStringToStorage(GROUP_CALL_URL, decoded.apiGroupCallURL);
          }
          if (decoded.turnU) {
            await saveStringToStorage(TURN_USERNAME, decoded.turnU);
          }
          if (decoded.turnP) {
            await saveStringToStorage(TURN_PASSWORD, decoded.turnP);
          }
          if (decoded.turn) {
            await saveStringToStorage(TURN, decoded.turn);
          }
          
          // Save country code if available
          if (data.countryCode) {
            await saveStringToStorage('countryCode', data.countryCode);
          }
          
          // Save updated version if available
          if (data.updatedVersion) {
            await saveStringToStorage('app_version', data.updatedVersion);
          }
          
          // Mark app check as complete
          await saveStringToStorage(IS_APIAPPCHECK_IN, 'true');
          
          console.log('App configuration loaded successfully');
          console.log('BASE_URL (PHP / login, base APIs):', decoded.server_url);
          console.log('SERVER_URL (Node / logout, socket):', decoded.api);
          
          return true;
        }
      }
      
      // If appData is not present, try to use appCode from response
      if (data.appCode) {
        await saveStringToStorage(APP_CODE, data.appCode);
      }
      
      return false;
    } else {
      console.error('App code validation failed:', response.data?.status || 'Unknown error');
      return false;
    }
  } catch (error: any) {
    console.error('Error fetching app config:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error setting up request:', error.message);
    }
    return false;
  }
};

/**
 * Set BASE_URL manually (fallback for testing)
 * Uses the same URL as Swift Constant.swift. Sets both BASE_URL and SERVER_URL so login and other APIs work.
 */
export const setBaseURLManually = async (baseUrl?: string, socketUrl?: string): Promise<void> => {
  const urlToSet = baseUrl || DEFAULT_BASE_URL;
  const socketToSet = socketUrl || DEFAULT_BASE_SOCKET_URL;
  
  await saveStringToStorage(BASE_URL, urlToSet);
  await saveStringToStorage(SERVER_URL, urlToSet);
  await saveStringToStorage(BASE_SOCKET_URL, socketToSet);
  console.log('BASE_URL and SERVER_URL set manually to:', urlToSet);
  console.log('BASE_SOCKET_URL set manually to:', socketToSet);
};

/**
 * Base64 decode helper for React Native
 * Uses atob() if available, otherwise provides a polyfill
 */
const base64Decode = (base64String: string): string => {
  // Check if atob is available (should be in React Native 0.73+)
  if (typeof atob !== 'undefined') {
    return atob(base64String);
  }
  
  // Fallback: Simple base64 decoder for React Native
  // This is a basic implementation that should work in all environments
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  
  base64String = base64String.replace(/[^A-Za-z0-9\+\/\=]/g, '');
  
  for (let i = 0; i < base64String.length; i += 4) {
    const enc1 = chars.indexOf(base64String.charAt(i));
    const enc2 = chars.indexOf(base64String.charAt(i + 1));
    const enc3 = chars.indexOf(base64String.charAt(i + 2));
    const enc4 = chars.indexOf(base64String.charAt(i + 3));
    
    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;
    
    output += String.fromCharCode(chr1);
    
    if (enc3 !== 64) {
      output += String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output += String.fromCharCode(chr3);
    }
  }
  
  return output;
};

/**
 * Decode and decrypt app data
 * The Swift app:
 * 1. Decodes base64 -> NSData
 * 2. Converts to UTF-8 string
 * 3. Converts string to ASCII Data
 * 4. Parses JSON from Data
 * 
 * React Native compatible version using base64Decode() helper
 */
const decodeAndDecryptAppData = async (appData: string): Promise<any | null> => {
  try {
    // Step 1: Decode base64 to get the raw string
    let utf8String: string;
    
    try {
      // Use base64Decode helper (works in all React Native environments)
      utf8String = base64Decode(appData);
      console.log('Base64 decoded successfully, length:', utf8String.length);
    } catch (base64Error) {
      console.error('Base64 decode error:', base64Error);
      return null;
    }
    
    // Step 2: Try parsing as JSON directly (matching Swift's JSONSerialization)
    // Swift decodes base64 -> UTF-8 string -> ASCII data -> JSON
    // In JavaScript, we can parse JSON directly from the UTF-8 string
    try {
      const jsonData = JSON.parse(utf8String);
      console.log('Successfully parsed app data as JSON');
      console.log('Decoded keys:', Object.keys(jsonData));
      return jsonData;
    } catch (parseError: any) {
      // If direct JSON parse fails, log the error for debugging
      console.warn('Direct JSON parse failed');
      console.warn('Parse error:', parseError.message);
      console.warn('Raw decoded string (first 300 chars):', utf8String.substring(0, 300));
      console.warn('String length:', utf8String.length);
      
      // The data might have encoding issues or be in an unexpected format
      // Return null and let the user set BASE_URL manually if needed
      return null;
    }
  } catch (error: any) {
    console.error('Error decoding app data:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return null;
  }
};

/**
 * Check if app code is already set and valid
 */
export const checkAppCode = async (): Promise<boolean> => {
  const appCode = await getStringFromStorage(APP_CODE);
  const baseUrl = await getStringFromStorage(BASE_URL);
  const isAppCheckIn = await getStringFromStorage(IS_APIAPPCHECK_IN);
  
  return !!(appCode && baseUrl && isAppCheckIn === 'true');
};

/**
 * Get stored app code
 */
export const getAppCode = async (): Promise<string | null> => {
  return await getStringFromStorage(APP_CODE);
};
