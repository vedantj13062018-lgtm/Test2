/**
 * Storage Helper Utilities
 * For debugging and resetting storage values
 */

import { clearAllStorage, saveStringToStorage, getStringFromStorage } from './storage';
import { BASE_URL, BASE_SOCKET_URL, DEFAULT_BASE_URL, DEFAULT_BASE_SOCKET_URL } from '../constants';

/**
 * Reset BASE_URL to default (matching Swift app)
 */
export const resetBaseURL = async (): Promise<void> => {
  await saveStringToStorage(BASE_URL, DEFAULT_BASE_URL);
  await saveStringToStorage(BASE_SOCKET_URL, DEFAULT_BASE_SOCKET_URL);
  console.log('BASE_URL reset to:', DEFAULT_BASE_URL);
  console.log('BASE_SOCKET_URL reset to:', DEFAULT_BASE_SOCKET_URL);
};

/**
 * Get current BASE_URL from storage
 */
export const getCurrentBaseURL = async (): Promise<string | null> => {
  return await getStringFromStorage(BASE_URL);
};

/**
 * Clear all storage (for debugging)
 */
export const clearStorage = async (): Promise<void> => {
  await clearAllStorage();
  console.log('All storage cleared');
};
