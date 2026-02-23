/**
 * Secure Storage Utilities
 * Uses react-native-keychain for secure storage
 */

import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Save string to secure keychain storage
 * Skips saving empty or null values to avoid keychain errors
 */
export const saveStringToStorage = async (key: string, value: string): Promise<void> => {
  // Skip empty or null values to avoid keychain errors
  if (!value || value.trim() === '') {
    // For empty values, just use AsyncStorage (non-sensitive)
    await AsyncStorage.setItem(key, value || '');
    return;
  }
  
  try {
    await Keychain.setInternetCredentials(key, key, value);
  } catch (error) {
    console.error(`Error saving ${key} to keychain:`, error);
    // Fallback to AsyncStorage for non-sensitive data
    await AsyncStorage.setItem(key, value);
  }
};

/**
 * Get string from secure keychain storage
 */
export const getStringFromStorage = async (key: string): Promise<string | null> => {
  try {
    const credentials = await Keychain.getInternetCredentials(key);
    if (credentials) {
      return credentials.password;
    }
    // Fallback to AsyncStorage
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error(`Error getting ${key} from keychain:`, error);
    return await AsyncStorage.getItem(key);
  }
};

/**
 * Remove string from storage
 */
export const removeFromStorage = async (key: string): Promise<void> => {
  try {
    await Keychain.resetInternetCredentials(key);
  } catch (error) {
    console.error(`Error removing ${key} from keychain:`, error);
  }
  await AsyncStorage.removeItem(key);
};

/**
 * Save object to AsyncStorage (for non-sensitive data)
 */
export const saveObjectToStorage = async (key: string, value: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`Error saving object ${key}:`, error);
  }
};

/**
 * Get object from AsyncStorage
 */
export const getObjectFromStorage = async (key: string): Promise<any | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Error getting object ${key}:`, error);
    return null;
  }
};

/**
 * Clear all storage
 */
export const clearAllStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
    // Note: Keychain doesn't have a clear all method, so we clear specific keys
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};
