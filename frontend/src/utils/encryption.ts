/**
 * Encryption Utilities
 * Matches Swift AESCryption implementation
 * Uses AES128 with key "abcdefghijklmnop"
 */

import CryptoJS from 'crypto-js';

// Encryption key matching Swift AESCryption (AES128)
const ENCRYPTION_KEY = 'abcdefghijklmnop'; // Must be exactly 16 bytes for AES128
// IV matching Swift AESCryption.aes128Encrypt(withIV:)
const ENCRYPTION_IV = '8548962579816302'; // Must be exactly 16 bytes

/**
 * Encrypt data using AES128 with IV (matches Swift AESCryption.aes128Encrypt(withIV:))
 * Swift uses AES128EncryptWithIV method with IV "8548962579816302"
 */
export const encryptData = (data: string): string => {
  try {
    // Use AES with 128-bit key and IV, matching Swift's AES128EncryptWithIV
    // CryptoJS uses PKCS7 padding by default (matches Swift's kCCOptionPKCS7Padding)
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
    const iv = CryptoJS.enc.Utf8.parse(ENCRYPTION_IV);

    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC, // CBC mode when IV is used
      padding: CryptoJS.pad.Pkcs7,
    });

    // Return base64 encoded string (matches Swift's base64Encoding)
    return encrypted.toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return data; // Return original if encryption fails
  }
};

/**
 * Decrypt data using AES128 with IV (matches Swift AESCryption.aes128Decrypt(withIV:))
 */
export const decryptData = (encryptedData: string): string => {
  try {
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
    const iv = CryptoJS.enc.Utf8.parse(ENCRYPTION_IV);

    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC, // CBC mode when IV is used
      padding: CryptoJS.pad.Pkcs7,
    });

    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    return decryptedString;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData; // Return original if decryption fails
  }
};

/**
 * Encrypt data using AES128 with Zero IV (matches StrokeTeamOne AESCrypt default for chat).
 */
export const encryptDataWithZeroIV = (data: string): string => {
  try {
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
    const iv = CryptoJS.enc.Hex.parse('00000000000000000000000000000000');
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
  } catch (error) {
    console.error('Encryption (Zero IV) error:', error);
    return data;
  }
};

/**
 * Encrypt JSON object (matches Swift getEncryptedParams)
 */
export const encryptJSON = (obj: any): string => {
  try {
    const jsonString = JSON.stringify(obj);
    return encryptData(jsonString);
  } catch (error) {
    console.error('JSON encryption error:', error);
    return '';
  }
};

/**
 * Decrypt JSON object (matches Swift getDecryptedString)
 */
/**
 * Decrypt data using AES128 with Zero IV (matches StrokeTeamOne AESCrypt default).
 */
function normalizeBase64(s: string): string {
  let n = (s || '').replace(/\s/g, '');
  n = n.replace(/-/g, '+').replace(/_/g, '/'); // URL-safe base64
  const pad = n.length % 4;
  if (pad) n += '='.repeat(4 - pad);
  return n;
}

export const decryptDataWithZeroIV = (encryptedData: string): string => {
  try {
    const normalized = normalizeBase64(encryptedData);
    if (!normalized) return encryptedData || '';
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
    const iv = CryptoJS.enc.Hex.parse('00000000000000000000000000000000');

    const decrypted = CryptoJS.AES.decrypt(normalized, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    return decryptedString || encryptedData;
  } catch (error) {
    return encryptedData;
  }
};

/**
 * Decrypt JSON object (matches Swift getDecryptedString)
 */
export const decryptJSON = (encryptedData: string): any => {
  // Try standard decryption first (with IV)
  try {
    const decryptedString = decryptData(encryptedData);
    // Validate if decryption looks successful (JSON starts with { or [)
    const cleanString = decryptedString.replace(/\0/g, '');
    const trimmed = cleanString.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return JSON.parse(trimmed);
    }
  } catch (e) {
    // Continue to fallback
  }

  // Fallback: Try with Zero IV
  try {
    const decryptedString = decryptDataWithZeroIV(encryptedData);
    const cleanString = decryptedString.replace(/\0/g, '');
    const trimmed = cleanString.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return JSON.parse(trimmed);
    }
  } catch (_e) {
    // ignore
  }
  return null;
};

/**
 * Generate hash for data
 */
export const generateHash = (data: string): string => {
  return CryptoJS.SHA256(data).toString();
};
