/**
 * Device Utilities
 */

import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

/**
 * Get device unique ID
 */
export const getDeviceUniqueId = async (): Promise<string> => {
  try {
    const uniqueId = await DeviceInfo.getUniqueId();
    return uniqueId;
  } catch (error) {
    console.error('Error getting device unique ID:', error);
    return 'unknown-device';
  }
};

/**
 * Get device type (iOS = 1, Android = 2)
 */
export const getDeviceType = (): string => {
  return Platform.OS === 'ios' ? '1' : '2';
};

/**
 * Get device model
 */
export const getDeviceModel = (): string => {
  return DeviceInfo.getModel();
};

/**
 * Get OS version
 */
export const getOSVersion = (): string => {
  return DeviceInfo.getSystemVersion();
};

/**
 * Get app version
 */
export const getAppVersion = (): string => {
  return DeviceInfo.getVersion();
};

/**
 * Get build number
 */
export const getBuildNumber = (): string => {
  return DeviceInfo.getBuildNumber();
};

/**
 * Check if device is tablet
 */
export const isTablet = (): boolean => {
  return DeviceInfo.isTablet();
};
