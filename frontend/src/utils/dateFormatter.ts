/**
 * Date Formatting Utilities
 * Matches Swift date format constants
 */

import { format, parseISO, isValid } from 'date-fns';

/**
 * Format date to MM/dd/yyyy, h:mm a
 */
export const formatDateTime = (date: Date | string | number): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(dateObj)) return '';
    return format(dateObj, 'MM/dd/yyyy, h:mm a');
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

/**
 * Format date to MM-dd-yyyy h:mm a
 */
export const formatDateTimeDash = (date: Date | string | number): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(dateObj)) return '';
    return format(dateObj, 'MM-dd-yyyy h:mm a');
  } catch (error) {
    return '';
  }
};

/**
 * Format date to yyyy-MM-dd
 */
export const formatDate = (date: Date | string | number): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(dateObj)) return '';
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    return '';
  }
};

/**
 * Format date to MM-dd-yyyy
 */
export const formatDateDash = (date: Date | string | number): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(dateObj)) return '';
    return format(dateObj, 'MM-dd-yyyy');
  } catch (error) {
    return '';
  }
};

/**
 * Format date to MMM dd yyyy
 */
export const formatDateLong = (date: Date | string | number): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(dateObj)) return '';
    return format(dateObj, 'MMM dd yyyy');
  } catch (error) {
    return '';
  }
};

/**
 * Format time to h:mm a
 */
export const formatTime = (date: Date | string | number): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(dateObj)) return '';
    return format(dateObj, 'h:mm a');
  } catch (error) {
    return '';
  }
};

/**
 * Format date to dd MMM yyyy, h:mm a
 */
export const formatDateTimeLong = (date: Date | string | number): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(dateObj)) return '';
    return format(dateObj, 'dd MMM yyyy, h:mm a');
  } catch (error) {
    return '';
  }
};

/**
 * Format date for chat list timestamp: MM/dd/yy, h:mm a
 * Matches StrokeTeamOne Utils.convertDateFromUTC display format
 */
export const formatChatTimestamp = (date: Date | string | number): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(dateObj)) return '';
    return format(dateObj, 'MM/dd/yy, h:mm a');
  } catch (error) {
    return '';
  }
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: Date | string | number): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(dateObj)) return '';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return formatDateLong(dateObj);
  } catch (error) {
    return '';
  }
};
