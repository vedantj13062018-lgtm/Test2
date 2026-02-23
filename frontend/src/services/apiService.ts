/**
 * API Service
 * Matches Swift BaseWebService implementation with encryption
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { encryptJSON, decryptJSON, decryptData, encryptData } from '../utils/encryption';
import { getStringFromStorage } from '../utils/storage';
import { getDeviceUniqueId } from '../utils/device';
import {
  SESSION_ID,
  USER_ID,
  ORGANIZATION_ID,
  BASE_URL,
  SERVER_URL,
} from '../constants';
import { ApiResponse } from '../types';

/** Endpoints that use base URL + base headers (tiamd, TIATIAMDNOTES) with form-encoded encrypted body - match StrokeTeamOne getClient("base") */
const BASE_SERVER_ENDPOINTS = [
  'ApiTiaTeleMD/getAllFilesList',
  'ApiTiaTeleMD/fetchfileTypes',
  'ApiTiaTeleMD/deleteuploadFiles',
  'ApiTiaTeleMD/fetchGroupsList',
  'ApiTiaTeleMD/searchPatientbynames',
  'ApiTiaTeleMD/getAllDoctorsLists',
  'ApiTiaTeleMD/shareDocumentToUsers',
  'ApiTiaTeleMD/uploadFilesDoc',
  'ApiTiaTeleMD/getAllNewsLetters',
  'ApiTiaTeleMD/fetchConcernTypes',
  'ApiTiaTeleMD/saveConcernTypes',
  'ApiTiaTeleMD/fetchSupportdetails',
  // OrganizationListActivity / DataManager.saveDoctorOrganization, fetchOrganizationList use getClient("base")
  'ApiTiaTeleMD/saveDoctorOrganization',
  'ApiTiaTeleMD/fetchOrganizationList',
];

function isBaseServerEndpoint(endpoint: string): boolean {
  return BASE_SERVER_ENDPOINTS.some((e) => endpoint.includes(e) || endpoint === e);
}

/** Build form-encoded string from params (match TeleMD_FileShare_Fix ApiClient URLSearchParams + encryptData(plainBody)) */
function buildFormEncodedString(params: Record<string, any>): string {
  const pairs: string[] = [];
  Object.keys(params).forEach((key) => {
    const value = params[key];
    const str = value === undefined || value === null ? '' : String(value);
    pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(str)}`);
  });
  return pairs.join('&');
}

class ApiService {
  private axiosInstance: AxiosInstance;
  private baseURL: string = '';

  constructor() {
    // Don't set default Content-Type - Swift doesn't set it for encrypted requests
    // We'll set it per-request as needed
    this.axiosInstance = axios.create({
      timeout: 60000, // Increased timeout to 60 seconds for network issues
      validateStatus: (status) => {
        // Accept all status codes (we'll handle errors in the catch block)
        return status >= 200 && status < 600;
      },
    });

    // Load base URL from storage
    this.loadBaseURL();
  }

  /**
   * Load base URL from storage
   */
  private async loadBaseURL(): Promise<void> {
    const baseUrl = await getStringFromStorage(BASE_URL);
    if (baseUrl) {
      this.baseURL = baseUrl;
    } else {
      this.baseURL = '';
      // BASE_URL not set until app code is validated; avoid warning on fresh launch
    }
  }

  /**
   * Get base URL for request (match StrokeTeamOne RapidApiClient.getClient(mode)).
   * - Login uses SERVER_URL (node) – match DataManager.doLoginUser(getClient("node")).
   * - Logout uses SERVER_URL (node) – match DataManager.doLogoutUser(getClient("node")).
   * - Other APIs use BASE_URL (server_url from app config).
   */
  private async getRequestBaseURL(endpoint: string): Promise<string> {
    await this.loadBaseURL();
    // Login and logout both use Node URL – match Android DataManager.doLoginUser / doLogoutUser(getClient("node"))
    const isLoginOrLogout =
      endpoint === 'login' ||
      endpoint.endsWith('/login') ||
      endpoint === 'logout' ||
      endpoint.endsWith('/logout');
    if (isLoginOrLogout) {
      const nodeUrl = await getStringFromStorage(SERVER_URL);
      if (nodeUrl && nodeUrl.trim() !== '') {
        console.log(
          '[ApiService]',
          endpoint.includes('login') ? 'Login' : 'Logout',
          'endpoint - using SERVER_URL (node):',
          nodeUrl,
        );
        return nodeUrl.trim().replace(/\/$/, '');
      }
      if (this.baseURL) {
        console.log(
          '[ApiService]',
          endpoint.includes('login') ? 'Login' : 'Logout',
          '- SERVER_URL not set, using BASE_URL:',
          this.baseURL,
        );
        return this.baseURL;
      }
    }
    return this.baseURL || '';
  }

  /**
   * Generate HMAC SHA256
   */
  private hmacSHA256(data: string, secret: string): string {
    return CryptoJS.HmacSHA256(data, secret).toString(CryptoJS.enc.Base64);
  }

  /**
   * Generate headers for Numr API requests (matching Swift headerGenerationNumr)
   * Used for dashboard and other endpoints that use SERVER_URL
   */
  private async generateNumrHeaders(): Promise<Record<string, string>> {
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

    const formattedDate = dateFormatter.format(date).replace(/[^\d]/g, '');
    const timeStamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;

    const deviceId = await getDeviceUniqueId();
    
    // Numr uses different HMAC: "127.0.0.1\nPOST\n{timestamp}\n{deviceId}\n" with secret "iuM5t0eEaMlWmzQUrzxjkni4pJOGsK8Z"
    const method = `127.0.0.1\nPOST\n${timeStamp}\n${deviceId}\n`;
    const hmacString = this.hmacSHA256(method, 'iuM5t0eEaMlWmzQUrzxjkni4pJOGsK8Z');
    const hmac = `TIATIAMDNOTES:${hmacString}`;

    return {
      APPNAME: 'tiamd',
      DATED: timeStamp,
      DEVICEID: deviceId,
      AUTH: hmac,
      TIMEZONE: 'UTC',
      'Content-Type': 'application/x-www-form-urlencoded',
      isEncrypted: 'yes',
      AUTHENCRYPTED: 'yes',
    };
  }

  /** Get date in GMT format yyyyMMddHHmmss (match TeleMD_FileShare_Fix / Java Utils.getDate()) */
  private getDateInGMT(): string {
    const now = new Date();
    return (
      `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}` +
      `${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}${String(now.getUTCSeconds()).padStart(2, '0')}`
    );
  }

  /**
   * Generate headers for encrypted requests.
   * File Share and "base" mode use APPNAME/tiamd + TIATIAMDNOTES (match TeleMD_FileShare_Fix addAuthHeaders mode 'base').
   */
  private async generateHeaders(isJsonRequest: boolean = false): Promise<Record<string, string>> {
    const deviceId = await getDeviceUniqueId();
    const date = new Date();
    const timeStampLocal = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
    const timeStampGMT = this.getDateInGMT();

    if (isJsonRequest) {
      // Base mode: TIATIAMDNOTES HMAC, GMT date (match Fix ApiClient addAuthHeaders mode 'base')
      const method = `127.0.0.1\nPOST\n${timeStampGMT}\n${deviceId}\n`;
      const hmacString = this.hmacSHA256(method, 'iuM5t0eEaMlWmzQUrzxjkni4pJOGsK8Z');
      const hmac = `TIATIAMDNOTES:${hmacString}`;

      return {
        APPNAME: 'tiamd',
        DATED: timeStampGMT,
        DEVICEID: deviceId,
        AUTH: hmac,
        TIMEZONE: 'UTC',
        'Content-Type': 'application/x-www-form-urlencoded',
        isencrypted: 'yes',
        AUTHENCRYPTED: 'yes',
        isRequestJson: 'yes',
      };
    } else {
      const method = `POST\n${timeStampLocal}\n${deviceId}\n`;
      const hmacString = this.hmacSHA256(method, '1ff3fb645665593b7649fdc6afb70b0b');
      const hmac = `PROCESSPROXY:${hmacString}`;

      return {
        APP: 'TiaConcierge',
        DATED: timeStampLocal,
        DEVICEID: deviceId,
        AUTH: hmac,
        ISENCRYPTED: 'yes',
        AUTHENCRYPTED: 'yes',
      };
    }
  }

  /**
   * Generate params with device details (matching Swift paramsGeneration - lines 143-152)
   * Note: Swift adds session_id, user_id, organization_id to ALL requests
   * But for login, these will be empty strings since user is not logged in yet
   */
  private async generateParamsWithDeviceDetails(
    params: Record<string, any>,
  ): Promise<Record<string, any>> {
    const sessionId = await getStringFromStorage(SESSION_ID);
    const userId = await getStringFromStorage(USER_ID);
    const orgId = await getStringFromStorage(ORGANIZATION_ID);

    // Note: Swift paramsGeneration adds these to ALL requests, even login
    // For login, these will be empty strings which is correct
    return {
      ...params,
      session_id: sessionId || '',
      user_id: userId || '',
      organization_id: orgId || '',
    };
  }

  /**
   * Build login payload exactly like StrokeTeamOne LoginActivity.getLoginResources (lines 541–566).
   * Keys: session_id, login_username, login_password, device_token, app_type, device_type, app_name.
   * Encrypted with same key/IV as Android AESCrypt(NODE).
   */
  private buildLoginPayloadForEncryption(params: Record<string, any>, sessionId: string): Record<string, any> {
    return {
      session_id: sessionId || '',
      login_username: params.login_username ?? '',
      login_password: params.login_password ?? '',
      device_token: params.device_token ?? '',
      app_type: params.app_type ?? 'Doctor',
      device_type: params.device_type ?? '0',
      app_name: 'TiaConcierge', // AppConstants.APP_NAME
    };
  }

  /**
   * POST request with encryption
   */
  async postEncrypted<T = any>(
    endpoint: string,
    params: Record<string, any>,
    isJsonRequest: boolean = false,
  ): Promise<ApiResponse<T>> {
    let requestBaseURL = '';
    try {
      // Login and logout use SERVER_URL (node); others use BASE_URL
      requestBaseURL = await this.getRequestBaseURL(endpoint);
      if (!requestBaseURL) {
        throw new Error('BASE_URL is not set. Please ensure the app code has been validated and BASE_URL is stored.');
      }
      
      // For Android emulator, replace 192.168.1.250 with 10.0.2.2 to access host machine
      if (Platform.OS === 'android') {
        const isEmulator = await DeviceInfo.isEmulator();
        console.log('Android device detected. Is emulator?', isEmulator);
        if (isEmulator && requestBaseURL.includes('192.168.1.250')) {
          console.warn('Android emulator detected. Replacing 192.168.1.250 with 10.0.2.2 for host machine access.');
          requestBaseURL = requestBaseURL.replace('192.168.1.250', '10.0.2.2');
        } else if (!isEmulator) {
          console.log('Physical Android device detected. Using original BASE_URL:', requestBaseURL);
        }
      }
      
      // Construct full URL
      const cleanBaseURL = requestBaseURL.replace(/\/$/, '');
      let pathSegment = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      // PHP backend often serves API under /api/; root may return HTML. Use /api/login when base has no /api path.
      const isLogin = pathSegment === 'login' || pathSegment.endsWith('/login');
      const baseHasApiPath = /\/api\/?$/.test(cleanBaseURL) || cleanBaseURL.includes('/api/');
      if (isLogin && !baseHasApiPath) {
        pathSegment = `api/${pathSegment}`;
        if (__DEV__) {
          console.log('[ApiService] Base URL has no /api path; using path:', pathSegment);
        }
      }
      const cleanEndpoint = pathSegment.startsWith('/') ? pathSegment : `/${pathSegment}`;
      const fullUrl = `${cleanBaseURL}${cleanEndpoint}`;
      console.log('Making API request to:', fullUrl);
      console.log('Request BASE_URL:', requestBaseURL);
      console.log('Endpoint:', endpoint);
      
      // File Share endpoints require "base" headers (APPNAME, TIATIAMDNOTES, isRequestJson) - match TeleMD_FileShare_Fix
      const useBaseHeaders = isJsonRequest || isBaseServerEndpoint(endpoint);
      const headers = await this.generateHeaders(useBaseHeaders);
      const paramsWithDevice = await this.generateParamsWithDeviceDetails(params);

      // Login: encrypt exactly the payload Android sends (LoginActivity.getLoginResources) so PHP/Node can decrypt and find login_username/login_password
      const isLoginEndpoint = endpoint === 'login' || endpoint.endsWith('/login');
      let payloadToEncrypt: Record<string, any>;
      if (isLoginEndpoint) {
        const sessionId = await getStringFromStorage(SESSION_ID);
        payloadToEncrypt = this.buildLoginPayloadForEncryption(params, sessionId || '');
      } else {
        payloadToEncrypt = paramsWithDevice;
      }

      // File Share endpoints: encrypt form-encoded body. Others: encrypt JSON.
      const encryptedData = isBaseServerEndpoint(endpoint)
        ? encryptData(buildFormEncodedString(payloadToEncrypt))
        : encryptJSON(payloadToEncrypt);
      console.log('Encrypted data length:', encryptedData.length);
      
      // Swift sends as form-encoded data: {"app_data": encryptedString} with URLEncoding.default
      // This means it should be sent as application/x-www-form-urlencoded, not JSON
      // Swift does NOT include Content-Type in headers for regular encrypted requests (only for JSON requests)
      // But Axios needs it to send form data correctly, so we'll include it
      const formDataString = `app_data=${encodeURIComponent(encryptedData)}`;
      
      const config: AxiosRequestConfig = {
        method: 'POST',
        url: fullUrl, // Use full URL instead of just endpoint
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: formDataString,
        timeout: 60000, // 60 seconds timeout
      };

      console.log('Request config:', {
        url: fullUrl,
        method: 'POST',
        headers: Object.keys(headers),
        timeout: config.timeout,
      });

      console.log('Sending request...');
      console.log('Request URL:', fullUrl);
      console.log('Request headers:', JSON.stringify(headers, null, 2));
      console.log('Request data (first 200 chars):', formDataString.substring(0, 200));
      
      const startTime = Date.now();
      const response: AxiosResponse<any> = await this.axiosInstance.request(config);
      const duration = Date.now() - startTime;
      console.log(`Request completed in ${duration}ms`);
      
      console.log('Response received!');
      console.log('Response status:', response.status);
      console.log('Response data type:', typeof response.data);
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        console.log('Response data keys:', Object.keys(response.data));
      }

      // HTTP 4xx/5xx: return a structured error so callers don't get HTML/string body
      if (response.status >= 400) {
        const message =
          response.data && typeof response.data === 'object' && response.data.message
            ? response.data.message
            : response.status === 404
              ? 'Service or endpoint not found'
              : `Request failed (${response.status})`;
        return {
          code: String(response.status),
          status: 'error',
          message,
          data: null,
        } as ApiResponse<T>;
      }
      
      // Swift receives response.value as [String:String] and calls getDecryptedString
      // getDecryptedString expects {"app_result": encryptedString}
      // The response should be a dictionary with "app_result" key
      if (response.data && typeof response.data === 'object') {
        // Check if response is already decrypted (plain JSON)
        // Swift sometimes returns code as string "100" or number 100
        const hasCode = response.data.code !== undefined;
        const hasStatus = response.data.status !== undefined;
        
        if (hasCode && hasStatus) {
          // Already decrypted, normalize code to string (matching Swift behavior)
          console.log('Response appears to be already decrypted');
          const normalizedResponse = {
            ...response.data,
            code: String(response.data.code), // Ensure code is always a string
          };
          console.log('Normalized response code:', normalizedResponse.code);
          return normalizedResponse as ApiResponse<T>;
        }
        
        // Check for encrypted response
        if (response.data.app_result) {
          console.log('Found app_result in response, decrypting...');
          const decryptedResponse = decryptJSON(response.data.app_result);
          if (decryptedResponse) {
            console.log('Decryption successful');
            const code = decryptedResponse.code;
            const normalizedResponse = {
              ...decryptedResponse,
              code: String(code),
            };
            console.log('Decrypted response code:', normalizedResponse.code);
            if (String(code) === '401') {
              console.warn('[ApiService] 401 response:', JSON.stringify({ status: decryptedResponse.status, message: decryptedResponse.message }));
            }
            return normalizedResponse as ApiResponse<T>;
          } else {
            console.error('Decryption failed');
            console.error('Encrypted string (first 200 chars):', response.data.app_result.substring(0, 200));
          }
        } else {
          console.warn('No app_result found in response. Response keys:', Object.keys(response.data));
          console.warn('Response data (first 500 chars):', JSON.stringify(response.data).substring(0, 500));
        }
      }
      
      // If not encrypted, return as is (but normalize code)
      console.log('Returning response data as-is');
      if (response.data && typeof response.data === 'object' && response.data.code !== undefined) {
        return {
          ...response.data,
          code: String(response.data.code),
        } as ApiResponse<T>;
      }
      return response.data;
    } catch (error: any) {
      console.error('API Error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        request: error.request,
        config: error.config?.url,
      });
      
      // Provide more detailed error message
      let errorMessage = 'Server call failed';
      const isAndroid = Platform.OS === 'android';
      const isEmulator = isAndroid ? await DeviceInfo.isEmulator() : false;
      
      console.log('Error analysis:', {
        code: error.code,
        message: error.message,
        isTimeout: error.request?._response === 'timeout' || error.code === 'ECONNABORTED',
        isNetworkError: error.message?.includes('Network Error'),
        isConnectionRefused: error.code === 'ECONNREFUSED',
        requestUrl: error.config?.url || requestBaseURL || this.baseURL,
        isAndroid,
        isEmulator,
      });
      
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || error.request?._response === 'timeout' || error.code === 'ECONNABORTED') {
        if (isAndroid && isEmulator) {
          errorMessage = `Cannot connect to server.\n\nYou're on Android emulator.\n\nIf server is on host machine, ensure BASE_URL uses 10.0.2.2 instead of 192.168.1.250\n\nCurrent URL: ${error.config?.url || requestBaseURL || this.baseURL}\n\nTroubleshooting:\n1. Check if server is running on your computer\n2. Try: curl http://10.0.2.2:2017/api/login from terminal\n3. Check Android emulator network settings`;
        } else if (isAndroid && !isEmulator) {
          errorMessage = `Cannot connect to server.\n\nYou're on Android device.\n\nEnsure:\n1. Device and server are on same WiFi network\n2. Server is running on 192.168.1.250:2017\n3. Firewall allows connections on port 2017\n4. Test from device browser: http://192.168.1.250:2017\n\nCurrent URL: ${error.config?.url || requestBaseURL || this.baseURL}\n\nTroubleshooting:\n1. Ping 192.168.1.250 from device (if possible)\n2. Check server logs to see if request arrives\n3. Verify server IP hasn't changed`;
        } else {
          errorMessage = `Cannot connect to server.\n\nPlease check:\n1. Server is running on ${requestBaseURL || this.baseURL}\n2. Network connection\n3. Firewall settings\n\nCurrent URL: ${error.config?.url || requestBaseURL || this.baseURL}`;
        }
      } else if (error.response) {
        errorMessage = `Server error: ${error.response.status} - ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your network connection.';
      } else {
        errorMessage = error.message || 'Server call failed';
      }
      
      throw {
        code: '500',
        status: errorMessage,
        data: null,
      };
    }
  }

  /**
   * POST request with Numr-style encryption (matching Swift postWithParametersNumr)
   * Uses SERVER_URL instead of BASE_URL
   * Uses percent-encoded parameters before encryption
   * Uses Numr headers (APPNAME: tiamd, TIATIAMDNOTES HMAC)
   */
  async postNumr<T = any>(
    endpoint: string,
    params: Record<string, any>,
  ): Promise<ApiResponse<T>> {
    try {
      // Load SERVER_URL instead of BASE_URL
      const serverUrl = await getStringFromStorage(SERVER_URL);
      
      if (!serverUrl) {
        throw new Error('SERVER_URL is not set. Please ensure the app code has been validated and SERVER_URL is stored.');
      }
      
      // For Android emulator, replace 192.168.1.250 with 10.0.2.2
      let requestServerURL = serverUrl;
      if (Platform.OS === 'android') {
        const isEmulator = await DeviceInfo.isEmulator();
        if (isEmulator && requestServerURL.includes('192.168.1.250')) {
          requestServerURL = requestServerURL.replace('192.168.1.250', '10.0.2.2');
        }
      }
      
      // Construct full URL (matching Swift: baseUrl + API_GET_DASHBOARD_DATA)
      const fullUrl = `${requestServerURL}${endpoint}`;
      console.log('Making Numr API request to:', fullUrl);
      console.log('SERVER_URL:', serverUrl);
      
      const headers = await this.generateNumrHeaders();
      const paramsWithDevice = await this.generateParamsWithDeviceDetails(params);
      
      // Percent-encode parameters before encryption (matching Swift getEncryptedParam)
      const percentEncoded = Object.entries(paramsWithDevice)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
      
      console.log('Percent-encoded params:', percentEncoded.substring(0, 200));
      
      // Encrypt the percent-encoded string
      const encryptedData = encryptData(percentEncoded);
      console.log('Encrypted data length:', encryptedData.length);
      
      const formDataString = `app_data=${encodeURIComponent(encryptedData)}`;
      
      const config: AxiosRequestConfig = {
        method: 'POST',
        url: fullUrl,
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: formDataString,
        timeout: 60000,
      };

      console.log('Sending Numr request...');
      const startTime = Date.now();
      const response: AxiosResponse<any> = await this.axiosInstance.request(config);
      const duration = Date.now() - startTime;
      console.log(`Numr request completed in ${duration}ms`);
      
      console.log('Numr response received!');
      console.log('Response status:', response.status);
      console.log('Response data type:', typeof response.data);
      
      // Swift receives response.value as [String:String] and calls getDecryptedString
      if (response.data && typeof response.data === 'object') {
        // Check if response is already decrypted
        const hasCode = response.data.code !== undefined;
        const hasStatus = response.data.status !== undefined;
        
        if (hasCode && hasStatus) {
          const normalizedResponse = {
            ...response.data,
            code: String(response.data.code),
          };
          console.log('Numr response code:', normalizedResponse.code);
          return normalizedResponse as ApiResponse<T>;
        }
        
        // Check for encrypted response
        if (response.data.app_result) {
          console.log('Found app_result in Numr response, decrypting...');
          console.log('Encrypted app_result length:', response.data.app_result.length);
          console.log('Encrypted app_result (first 200 chars):', response.data.app_result.substring(0, 200));
          
          const decryptedResponse = decryptJSON(response.data.app_result);
          if (!decryptedResponse) {
            console.warn('Numr app_result decryption failed or invalid JSON');
            return {
              code: '500',
              status: 'error',
              data: null,
              message: 'Failed to decrypt response',
            } as ApiResponse<T>;
          }
          {
            console.log('=== DECRYPTED RESPONSE STRUCTURE ===');
            console.log('Full decrypted response (first 2000 chars):', JSON.stringify(decryptedResponse, null, 2).substring(0, 2000));
            console.log('Decrypted response keys:', Object.keys(decryptedResponse));
            console.log('Has code:', 'code' in decryptedResponse, decryptedResponse.code);
            console.log('Has status:', 'status' in decryptedResponse, decryptedResponse.status);
            console.log('Has data:', 'data' in decryptedResponse);
            
            // Log the actual OpList if it exists at the top level
            if ('OpList' in decryptedResponse) {
              console.log('OpList found at top level:', {
                isArray: Array.isArray(decryptedResponse.OpList),
                length: Array.isArray(decryptedResponse.OpList) ? decryptedResponse.OpList.length : 'N/A',
                type: typeof decryptedResponse.OpList,
                value: decryptedResponse.OpList,
              });
            }
            
            // Log the data.OpList if it exists
            if (decryptedResponse.data) {
              console.log('decryptedResponse.data keys:', Object.keys(decryptedResponse.data));
              if ('OpList' in decryptedResponse.data) {
                console.log('OpList found in decryptedResponse.data:', {
                  isArray: Array.isArray(decryptedResponse.data.OpList),
                  length: Array.isArray(decryptedResponse.data.OpList) ? decryptedResponse.data.OpList.length : 'N/A',
                  type: typeof decryptedResponse.data.OpList,
                  value: decryptedResponse.data.OpList,
                });
              }
            }
            
            const code = String(decryptedResponse.code || decryptedResponse.code);
            
            // For code "200", Swift returns the data dictionary directly (not nested in "data")
            // Matching Swift: if code == "200" { if let dataDictionary = response["data"] { onCompletion(code, dataDictionary, nil) } }
            // The completion handler receives: (code, result, error) where result is the data dictionary
            if (code === '200') {
              // Check if there's a nested "data" property in the decrypted response
              // Swift checks: if let dataDictionary = response["data"] as? [String:AnyObject]
              if (decryptedResponse.data && typeof decryptedResponse.data === 'object' && !Array.isArray(decryptedResponse.data)) {
                // Return with data nested (response has {code, status, data: {...}})
                // The data property contains OpList, IpList, etc.
                console.log('Numr response has nested data property');
                console.log('Nested data keys:', Object.keys(decryptedResponse.data));
                return {
                  code,
                  status: decryptedResponse.status || 'success',
                  data: decryptedResponse.data,
                } as ApiResponse<T>;
              } else {
                // For "200", if no nested "data", the entire decrypted response (minus code/status) IS the data
                // This matches Swift where result is the data dictionary directly
                const { code: _, status: __, ...dataDict } = decryptedResponse;
                console.log('Numr response has no nested data, using entire response as data');
                console.log('Data dict keys:', Object.keys(dataDict));
                return {
                  code,
                  status: decryptedResponse.status || 'success',
                  data: Object.keys(dataDict).length > 0 ? dataDict : decryptedResponse, // Use dataDict if it has keys, otherwise use full response
                } as ApiResponse<T>;
              }
            } else {
              // For other codes, return normally
              return {
                ...decryptedResponse,
                code,
              } as ApiResponse<T>;
            }
          }
        }
      }
      
      // If not encrypted, return as is
      if (response.data && typeof response.data === 'object' && response.data.code !== undefined) {
        const code = String(response.data.code);
        if (code === '200' && !response.data.data) {
          // For code "200" without nested data, the entire response.data IS the data
          return {
            code,
            status: response.data.status || 'success',
            data: response.data, // Entire response.data is the data dictionary
          } as ApiResponse<T>;
        }
        return {
          ...response.data,
          code,
        } as ApiResponse<T>;
      }
      // Response shape not recognized (e.g. only app_result and decryption failed, or empty). Return normalized error so UI shows a clear message.
      const code = response.data?.code != null ? String(response.data.code) : '500';
      const data = response.data?.data !== undefined ? response.data.data : null;
      return {
        code,
        status: response.data?.status ?? 'error',
        data,
        message: (response.data as any)?.message ?? (code !== '200' ? 'Failed to fetch data' : undefined),
      } as ApiResponse<T>;
    } catch (error: any) {
      console.error('Numr API Error:', error);
      throw {
        code: '500',
        status: error.message || 'Server call failed',
        data: null,
      };
    }
  }

  /**
   * POST request without encryption (for some endpoints)
   */
  async post<T = any>(
    endpoint: string,
    params: Record<string, any>,
  ): Promise<ApiResponse<T>> {
    try {
      await this.loadBaseURL();
      
      if (!this.baseURL) {
        throw new Error('BASE_URL is not set. Please ensure the app code has been validated and BASE_URL is stored.');
      }
      
      // For Android emulator, replace 192.168.1.250 with 10.0.2.2
      let requestBaseURL = this.baseURL;
      if (Platform.OS === 'android') {
        const isEmulator = await DeviceInfo.isEmulator();
        if (isEmulator && requestBaseURL.includes('192.168.1.250')) {
          requestBaseURL = requestBaseURL.replace('192.168.1.250', '10.0.2.2');
        }
      }
      
      const fullUrl = `${requestBaseURL}${endpoint}`;
      const headers = await this.generateHeaders(false);
      const paramsWithDevice = await this.generateParamsWithDeviceDetails(params);
      
      const config: AxiosRequestConfig = {
        method: 'POST',
        url: fullUrl,
        headers,
        data: paramsWithDevice,
      };

      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.request(config);
      return response.data;
    } catch (error: any) {
      console.error('API Error:', error);
      throw {
        code: '500',
        status: error.message || 'Server call failed',
        data: null,
      };
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      await this.loadBaseURL();
      
      if (!this.baseURL) {
        throw new Error('BASE_URL is not set. Please ensure the app code has been validated and BASE_URL is stored.');
      }
      
      // For Android emulator, replace 192.168.1.250 with 10.0.2.2
      let requestBaseURL = this.baseURL;
      if (Platform.OS === 'android') {
        const isEmulator = await DeviceInfo.isEmulator();
        if (isEmulator && requestBaseURL.includes('192.168.1.250')) {
          requestBaseURL = requestBaseURL.replace('192.168.1.250', '10.0.2.2');
        }
      }
      
      const fullUrl = `${requestBaseURL}${endpoint}`;
      const headers = await this.generateHeaders(false);
      
      const config: AxiosRequestConfig = {
        method: 'GET',
        url: fullUrl,
        headers,
        params,
      };

      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.request(config);
      return response.data;
    } catch (error: any) {
      console.error('API Error:', error);
      throw {
        code: '500',
        status: error.message || 'Server call failed',
        data: null,
      };
    }
  }

  /**
   * Upload file
   */
  async uploadFile(
    endpoint: string,
    fileUri: string,
    fileType: string,
    additionalParams?: Record<string, any>,
  ): Promise<ApiResponse> {
    try {
      await this.loadBaseURL();
      
      if (!this.baseURL) {
        throw new Error('BASE_URL is not set. Please ensure the app code has been validated and BASE_URL is stored.');
      }
      
      // For Android emulator, replace 192.168.1.250 with 10.0.2.2
      let requestBaseURL = this.baseURL;
      if (Platform.OS === 'android') {
        const isEmulator = await DeviceInfo.isEmulator();
        if (isEmulator && requestBaseURL.includes('192.168.1.250')) {
          requestBaseURL = requestBaseURL.replace('192.168.1.250', '10.0.2.2');
        }
      }
      
      const fullUrl = `${requestBaseURL}${endpoint}`;
      const headers = await this.generateHeaders(false);
      const paramsWithDevice = await this.generateParamsWithDeviceDetails(additionalParams || {});
      
      const FormData = require('form-data');
      const formData = new FormData();
      
      // Add file
      formData.append('file', {
        uri: fileUri,
        type: fileType,
        name: fileUri.split('/').pop(),
      });
      
      // Add other params
      Object.keys(paramsWithDevice).forEach((key) => {
        formData.append(key, paramsWithDevice[key]);
      });
      
      const config: AxiosRequestConfig = {
        method: 'POST',
        url: fullUrl,
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
        data: formData,
      };

      const response = await this.axiosInstance.request(config);
      return response.data;
    } catch (error: any) {
      console.error('Upload Error:', error);
      throw {
        code: '500',
        status: error.message || 'Upload failed',
        data: null,
      };
    }
  }

  // File Share APIs
  async fetchFileTypes(): Promise<ApiResponse<any>> {
    return await this.postEncrypted('ApiTiaTeleMD/fetchfileTypes', {});
  }

  async getAllFilesList(params: {
    filters?: string;
    start?: string;
    limit?: string;
    get_share_by_users?: string;
  }): Promise<ApiResponse<any>> {
    return await this.postEncrypted('ApiTiaTeleMD/getAllFilesList', {
      filters: params.filters || '{}',
      start: params.start || '0',
      limit: params.limit || '10',
      get_share_by_users: params.get_share_by_users || '0',
    });
  }

  async getAllDoctorsLists(): Promise<ApiResponse<any>> {
    return await this.postEncrypted('ApiTiaTeleMD/getAllDoctorsLists', {});
  }

  async fetchGroupsList(): Promise<ApiResponse<any>> {
    return await this.postEncrypted('ApiTiaTeleMD/fetchGroupsList', {});
  }

  async searchPatientByName(params: { search_key: string; search_type: 'patient_name' | 'patient_mrn' }): Promise<ApiResponse<any>> {
    return await this.postEncrypted('ApiTiaTeleMD/searchPatientbynames', {
      search_key: params.search_key,
      search_type: params.search_type,
    });
  }

  async deleteUploadFiles(fileId: string): Promise<ApiResponse<any>> {
    return await this.postEncrypted('ApiTiaTeleMD/deleteuploadFiles', {
      file_id: fileId,
    });
  }

  /**
   * POST multipart form data request
   * Used for file uploads with FormData
   */
  async postMultipart<T = any>(
    endpoint: string,
    formData: FormData,
  ): Promise<ApiResponse<T>> {
    try {
      let requestBaseURL = await this.getRequestBaseURL(endpoint);
      if (!requestBaseURL) {
        throw new Error('BASE_URL is not set. Please ensure the app code has been validated and BASE_URL is stored.');
      }

      // For Android emulator, replace 192.168.1.250 with 10.0.2.2
      if (Platform.OS === 'android') {
        const isEmulator = await DeviceInfo.isEmulator();
        if (isEmulator && requestBaseURL.includes('192.168.1.250')) {
          requestBaseURL = requestBaseURL.replace('192.168.1.250', '10.0.2.2');
        }
      }

      const cleanBaseURL = requestBaseURL.replace(/\/$/, '');
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const fullUrl = `${cleanBaseURL}${cleanEndpoint}`;
      console.log('Making multipart POST to:', fullUrl);

      const headers = await this.generateHeaders(true);
      // Remove Content-Type so fetch can set multipart/form-data with boundary
      const { 'Content-Type': _, ...headersWithoutContentType } = headers;

      const response = await fetch(fullUrl, {
        method: 'POST',
        body: formData as any,
        headers: headersWithoutContentType as any,
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error('[ApiService] postMultipart - HTTP error:', response.status, responseText?.slice(0, 500));
        return {
          code: String(response.status),
          status: 'error',
          message: `Request failed (${response.status})`,
          data: null,
        } as ApiResponse<T>;
      }

      let data: any;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (_) {
        console.error('[ApiService] postMultipart - Response not JSON:', responseText?.slice(0, 300));
        return { code: '500', status: 'error', message: 'Invalid server response', data: null } as ApiResponse<T>;
      }

      // Check for encrypted response
      if (data && typeof data === 'object' && data.app_result) {
        const decrypted = decryptJSON(data.app_result);
        if (decrypted) {
          return { ...decrypted, code: String(decrypted.code) } as ApiResponse<T>;
        }
      }

      // Return plain response
      if (data.code !== undefined) {
        return { ...data, code: String(data.code) } as ApiResponse<T>;
      }

      return data as ApiResponse<T>;
    } catch (error: any) {
      console.error('[ApiService] postMultipart error:', error);
      throw {
        code: '500',
        status: error.message || 'Request failed',
        data: null,
      };
    }
  }

  /**
   * Upload files with multipart (match Android uploadFilesDoc). Builds app_data (encrypted) and file_upload[].
   * Uses fetch instead of axios for better React Native file upload support.
   */
  async uploadFilesDocWithFiles(
    files: Array<{ uri: string; name?: string; type?: string }>,
    options?: {
      notes?: string;
      fileDetails?: Array<{ file_name: string; file_type: string | number; patient_id: string | number; image_notes: string }>;
      apply_to_all?: string;
      group_id?: string;
      share_users?: string;
    }
  ): Promise<ApiResponse<any>> {
    try {
      // Use same base URL as other File Share endpoints (SERVER_URL when set) – match TeleMD_FileShare_Fix
      let requestBaseURL = await this.getRequestBaseURL('ApiTiaTeleMD/uploadFilesDoc');
      if (!requestBaseURL) {
        throw new Error('BASE_URL is not set. Please ensure the app code has been validated and BASE_URL is stored.');
      }

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const fileDetails =
        options?.fileDetails && options.fileDetails.length === files.length
          ? options.fileDetails.map((d) => ({
              file_name: d.file_name,
              file_type: d.file_type === '' || d.file_type === undefined ? '' : Number(d.file_type),
              patient_id: d.patient_id === '' || d.patient_id === undefined ? '' : Number(d.patient_id),
              image_notes: d.image_notes ?? '',
            }))
          : files.map((f) => ({
              file_name: f.name || f.uri.split('/').pop() || 'file',
              file_type: '',
              patient_id: '',
              image_notes: options?.notes ?? '',
            }));

      const appDataParams: Record<string, string> = {
        organization_id: orgId ?? '',
        file_details: JSON.stringify(fileDetails),
        time_zone: timeZone,
        apply_to_all: options?.apply_to_all ?? '0',
        group_id: options?.group_id ?? '',
        user_id: userId ?? '',
        share_users: options?.share_users ?? '',
        session_id: sessionId ?? '',
      };

      // Build param string and encrypt
      const paramString = Object.entries(appDataParams)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      const encrypted = encryptData(paramString).replace(/\n/g, '');

      // Create FormData (React Native has built-in FormData)
      const formData = new FormData();
      formData.append('app_data', encrypted);
      
      files.forEach((file) => {
        const uri = file.uri?.trim() || '';
        const name = file.name || (uri ? uri.split('/').pop() || 'file' : 'file');
        const type = file.type || 'application/octet-stream';
        formData.append('file_upload[]', {
          uri: Platform.OS === 'android' ? uri : uri.replace(/^file:\/\//, ''),
          name,
          type,
        } as any);
      });

      // Android emulator: replace 192.168.1.250 with 10.0.2.2
      if (Platform.OS === 'android') {
        const isEmulator = await DeviceInfo.isEmulator();
        if (isEmulator && requestBaseURL.includes('192.168.1.250')) {
          requestBaseURL = requestBaseURL.replace('192.168.1.250', '10.0.2.2');
        }
      }

      const cleanBaseURL = requestBaseURL.replace(/\/$/, '');
      const url = `${cleanBaseURL}/ApiTiaTeleMD/uploadFilesDoc`;
      console.log('[ApiService] uploadFilesDocMultipart - URL:', url);

      // File Share upload requires base headers (APPNAME, TIATIAMDNOTES, isRequestJson) – match other File Share endpoints
      const baseHeaders = await this.generateHeaders(true);
      // Omit Content-Type so fetch sets multipart/form-data with boundary
      const { 'Content-Type': _, ...headers } = baseHeaders;

      const response = await fetch(url, {
        method: 'POST',
        body: formData as any,
        headers: headers as any,
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('[ApiService] uploadFilesDocMultipart - HTTP error:', response.status, responseText?.slice(0, 500));
        let message = `Upload failed (${response.status})`;
        try {
          const errJson = JSON.parse(responseText);
          if (errJson?.message) message = errJson.message;
        } catch (_) {
          // Ignore parse errors
        }
        return { code: String(response.status), status: 'error', message, data: null };
      }

      let data: any;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (_) {
        console.error('[ApiService] uploadFilesDocMultipart - Response not JSON:', responseText?.slice(0, 300));
        return { code: '500', status: 'error', message: 'Invalid server response', data: null };
      }

      if (data && typeof data === 'object' && data.app_result) {
        try {
          const decrypted = decryptJSON(data.app_result);
          if (decrypted) {
            return { ...decrypted, data: decrypted.data ?? decrypted };
          }
        } catch (e: any) {
          console.error('[ApiService] uploadFilesDocMultipart - Decrypt/parse error:', e?.message);
          const msg = e?.message ? `Failed to parse upload response: ${e.message}` : 'Failed to parse upload response';
          return { code: '500', status: 'error', message: msg, data: null };
        }
      }

      // Plain JSON (no app_result): normalize so UI can check code/status at top level
      const out: any = { ...data, data: data?.data ?? data };
      if (out.code == null && out.status == null && out.data && typeof out.data === 'object') {
        out.code = out.data.code;
        out.status = out.data.status;
        if (out.message == null) out.message = out.data.message;
      }
      return out;
    } catch (error: any) {
      console.error('[ApiService] uploadFilesDocMultipart error:', error);
      throw {
        code: '500',
        status: error.message || 'Upload failed',
        data: null,
      };
    }
  }
}

export default new ApiService();
