/**
 * Login Screen
 * Matches Swift SignInViewController
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  ImageBackground,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import UsernameIcon from '../../components/icons/UsernameIcon';
import PasswordIcon from '../../components/icons/PasswordIcon';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setAuthenticating, loginSuccess, selectOrganization } from '../../store/slices/authSlice';
import { RootStackParamList } from '../../types';
import { validateRequired } from '../../utils/validation';
import { saveStringToStorage, getStringFromStorage, saveObjectToStorage, getObjectFromStorage } from '../../utils/storage';
import { getCurrentBaseURL } from '../../utils/storageHelpers';
import { SERVER_URL } from '../../constants';
import { getDeviceUniqueId } from '../../utils/device';
import { fetchAppConfig, setBaseURLManually } from '../../services/appCodeService';
import apiService from '../../services/apiService';
import socketService from '../../services/socketService';
import { DEFAULT_BASE_URL, DEFAULT_BASE_SOCKET_URL, APP_CODE, APP_NAME, IS_APIAPPCHECK_IN, USER_TYPE } from '../../constants';
import {
  LOGIN_URL,
  LOGIN_USER_TYPE,
  COLORS,
  SESSION_ID,
  USER_ID,
  USER_NAME,
  DOCTOR_NAME,
  SPECIALITY_ID,
  ORGANIZATION_COUNT,
  IS_LOGGED_IN,
  ORGANIZATION_ID,
  ORGANIZATION_NAME,
  PRACTICE_LOC_ID,
  PRACTICE_LOC_NAME,
  API_FETCH_ORGANIZATION_LIST,
} from '../../constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { isAuthenticating, isMFAEnabled } = useAppSelector((state) => state.auth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAppCodeModal, setShowAppCodeModal] = useState(false);
  const [appCode, setAppCode] = useState('');
  const [loadingAppCode, setLoadingAppCode] = useState(false);
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef<NodeJS.Timeout | null>(null);

  // Handle logo tap (8 taps to show app code dialog - matches Swift)
  const handleLogoTap = () => {
    logoTapCount.current += 1;

    // Reset counter after 2 seconds of no taps
    if (logoTapTimer.current) {
      clearTimeout(logoTapTimer.current);
    }
    logoTapTimer.current = setTimeout(() => {
      logoTapCount.current = 0;
    }, 2000);

    if (logoTapCount.current === 8) {
      logoTapCount.current = 0;
      if (logoTapTimer.current) {
        clearTimeout(logoTapTimer.current);
      }
      // Load current app code from storage
      getStringFromStorage(APP_CODE).then((code) => {
        setAppCode(code || '');
        setShowAppCodeModal(true);
      });
    }
  };

  // Handle organization selection - auto-select first organization and navigate to MainTabs
  const handleOrganizationSelection = async (organizations: any[]) => {
    // Auto-select the first organization (removed organization selection screen)
    const org = organizations[0];
    const orgId = String(org.organization_unit_id || org.id || org.organizationId);
    const orgName = org.organization_unit_name || org.name || org.organizationName;

    // Save to storage
    await saveStringToStorage(ORGANIZATION_ID, orgId);
    await saveStringToStorage(ORGANIZATION_NAME, orgName);
    await saveStringToStorage('IsOrganizationSelected', '1');

    // Set practice location if available
    const practiceArray = org.practice_array || [];
    if (practiceArray.length > 0) {
      const practice = practiceArray[0];
      await saveStringToStorage(PRACTICE_LOC_ID, String(practice.id || '0'));
      await saveStringToStorage(PRACTICE_LOC_NAME, practice.name || '');
    } else {
      // No practice_array - set empty practice
      await saveStringToStorage(PRACTICE_LOC_ID, '0');
      await saveStringToStorage(PRACTICE_LOC_NAME, '');
    }

    // Set organization in Redux state
    dispatch(selectOrganization({
      organizationId: orgId,
      organizationName: orgName,
    }));

    // Use reset instead of replace to ensure clean navigation stack
    // This prevents the double render issue
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  // Handle app code submission (matching Swift popUpOkAction - lines 536-580)
  const handleAppCodeSubmit = async () => {
    if (!appCode.trim()) {
      Alert.alert(APP_NAME, 'Please enter the App Code');
      return;
    }

    setLoadingAppCode(true);
    try {
      // Check if app code is the same as stored (matching Swift line 549)
      const storedAppCode = await getStringFromStorage(APP_CODE);
      if (storedAppCode === appCode.trim()) {
        console.log('App code unchanged, no update needed');
        setShowAppCodeModal(false);
        setAppCode('');
        setLoadingAppCode(false);
        return;
      }

      // Call appCheck API to get BASE_URL for the environment (UAT/DEV/PROD)
      // The app code determines which environment to use
      const success = await fetchAppConfig(appCode.trim());
      if (success) {
        // Success - BASE_URL is now set from the app code API
        // The environment (UAT/DEV/PROD) is determined by the app code
        Alert.alert(APP_NAME, 'App configuration updated successfully', [
          {
            text: 'OK',
            onPress: () => {
              setShowAppCodeModal(false);
              setAppCode('');
            },
          },
        ]);
      } else {
        // API failed or returned error
        Alert.alert(
          APP_NAME,
          'Failed to validate app code.\n\nPlease check:\n1. App code is correct\n2. Internet connection\n3. Try again',
          [
            {
              text: 'OK',
              onPress: () => {
                setLoadingAppCode(false);
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('App code error:', error);
      // Network error - offer fallback to local IP
      Alert.alert(
        APP_NAME,
        'Connection not available.\n\nWould you like to use the local server URL for testing?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setLoadingAppCode(false);
            },
          },
          {
            text: 'Use Local URL',
            onPress: async () => {
              // Set BASE_URL to local IP (matching Swift app)
              await setBaseURLManually(DEFAULT_BASE_URL, DEFAULT_BASE_SOCKET_URL);
              await saveStringToStorage(APP_CODE, appCode.trim());
              await saveStringToStorage(IS_APIAPPCHECK_IN, 'true');
              Alert.alert(APP_NAME, `BASE_URL set to:\n${DEFAULT_BASE_URL}\n\nYou can now login.`, [
                {
                  text: 'OK',
                  onPress: () => {
                    setShowAppCodeModal(false);
                    setAppCode('');
                    setLoadingAppCode(false);
                  },
                },
              ]);
            },
          },
        ]
      );
    }
  };

  const handleLogin = async () => {
    // Validate inputs
    const validation = validateRequired({ username, password });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    dispatch(setAuthenticating(true));

    try {
      // Verify PHP base URL is set (login uses BASE_URL / PHP backend; SERVER_URL is for Node/logout)
      let baseUrl = await getCurrentBaseURL();
      if (!baseUrl) {
        baseUrl = await getStringFromStorage(SERVER_URL) || '';
      }
      if (!baseUrl) {
        Alert.alert('Error', 'Server URL is not configured. Please enter the App Code first (tap logo 8 times).');
        dispatch(setAuthenticating(false));
        return;
      }

      // For Android emulator, replace 192.168.1.250 with 10.0.2.2 to access host machine
      // This is a common Android emulator networking requirement
      // Note: Only do this for local IPs, not for production/staging servers
      if (Platform.OS === 'android') {
        const isEmulator = await DeviceInfo.isEmulator();
        if (isEmulator && baseUrl.includes('192.168.1.250')) {
          console.warn('Android emulator detected. Replacing 192.168.1.250 with 10.0.2.2 for host machine access.');
          baseUrl = baseUrl.replace('192.168.1.250', '10.0.2.2');
          console.log('Updated BASE_URL for emulator:', baseUrl);
        }
      }

      console.log('Starting login with BASE_URL:', baseUrl);
      console.log('BASE_URL comes from app code API - environment determined by app code');

      let deviceToken = await getStringFromStorage('device_token') || '';
      // Android: backend needs FCM token to send call notifications (Swift -> RN). If not in storage yet, fetch now.
      if (Platform.OS === 'android' && !deviceToken) {
        try {
          require('@react-native-firebase/messaging');
          const { getApp } = require('@react-native-firebase/app');
          const { getMessaging, getToken } = require('@react-native-firebase/messaging');
          const app = getApp();
          const messaging = getMessaging(app);
          const token = await getToken(messaging);
          if (token) {
            deviceToken = token;
            await saveStringToStorage('device_token', token);
          }
        } catch (e: any) {
          const msg = e?.message || String(e);
          if (msg.includes('could not be found') || msg.includes('messaging')) {
            __DEV__ && console.log('FCM token skipped (messaging not available)');
          } else {
            console.warn('Could not get FCM token at login:', e);
          }
        }
      }
      const voipToken = await getStringFromStorage('voip_token') || '';
      const deviceUuid = await getDeviceUniqueId();
      // Match Swift (SignInViewController): device_type "1" for iOS.
      // Match StrokeTeamOne (LoginActivity): device_type "0" for Android.
      const deviceType = Platform.OS === 'ios' ? '1' : '0';

      // Login params matching Swift SignInViewController / StrokeTeamOne LoginActivity
      const params = {
        login_username: username,
        login_password: password,
        device_type: deviceType,
        app_type: LOGIN_USER_TYPE, // "Doctor"
        device_token: deviceToken,
        voip_token: voipToken,
        device_uuid: deviceUuid,
        app_environment: 'DEV', // Hardcoded in Swift - environment is determined by app code
      };

      console.log('Login params:', {
        ...params,
        login_password: '***',
        device_token_length: deviceToken ? deviceToken.length : 0, // Backend needs this for Swift -> RN calls
      });

      let response;
      try {
        response = await apiService.postEncrypted(LOGIN_URL, params);
      } catch (apiError: any) {
        console.error('API call failed:', apiError);
        // apiError might already be formatted as ApiResponse
        if (apiError.code && apiError.status) {
          response = apiError;
        } else {
          throw apiError;
        }
      }

      console.log('Login response received:', {
        code: response.code,
        status: response.status,
        hasData: !!response.data,
        hasSessionId: !!response.sessionId,
        hasToken: !!response.token,
        responseKeys: Object.keys(response),
        fullResponse: JSON.stringify(response).substring(0, 500),
      });

      // Handle code as string or number (Swift sometimes returns number)
      const responseCode = String(response.code || response.code);
      console.log('Response code (normalized):', responseCode);

      if (responseCode === '100' && response.data) {
        const data = response.data;
        const sessionId = response.sessionId;
        const token = response.token;

        console.log('Login success - parsing response:', {
          sessionId,
          hasToken: !!token,
          userId: data.userId,
          userName: data.user_name,
          organizationsCount: data.organizations?.length || 0,
        });

        if (!sessionId) {
          console.error('Login failed: No session ID in response');
          Alert.alert('Error', 'Login failed: No session ID received');
          dispatch(setAuthenticating(false));
          return;
        }

        // Save all user data (matching Swift implementation exactly - lines 227-253)
        await saveStringToStorage(SESSION_ID, sessionId);

        // Save token if present (matching Swift - token is in response)
        if (token) {
          await saveStringToStorage('token', token);
          console.log('Token saved');
        }

        await saveStringToStorage(USER_ID, String(data.userId));
        await saveStringToStorage(USER_NAME, data.user_name);
        await saveStringToStorage('user_level', String(data.userLevel || 0));
        await saveStringToStorage('admin', String(data.admin || false));
        await saveStringToStorage('nuance_org', data.nuance_org || '');
        await saveStringToStorage('nuance_guid', data.nuance_guid || '');
        await saveStringToStorage('nuance_user', data.nuance_user || '');
        await saveStringToStorage('time_zone', data.timezone || '');
        await saveStringToStorage('designation', data.designation || '');
        await saveStringToStorage('is_multifactor_enabled', String(data.multifactor_status || 0));

        // Save USER_TYPE as "Doctor" (matching Swift line 247)
        await saveStringToStorage(USER_TYPE, 'Doctor');

        if (data.doctor_id) {
          await saveStringToStorage('doctor_id', String(data.doctor_id));
        }
        if (data.doctor_name) {
          await saveStringToStorage(DOCTOR_NAME, data.doctor_name);
        }
        if (data.speciality_id) {
          await saveStringToStorage(SPECIALITY_ID, String(data.speciality_id));
        }
        if (response.chat_user_name) {
          await saveStringToStorage('chat_user_name', response.chat_user_name);
        }

        console.log('User data saved successfully');

        socketService.joinGroupAfterLogin();

        const organizations = data.organizations || [];
        if (organizations.length === 0) {
          Alert.alert('Error', 'Sorry\nYou are not added to any organization\nPlease contact your company Admin');
          dispatch(setAuthenticating(false));
          return;
        }

        await saveStringToStorage(ORGANIZATION_COUNT, String(organizations.length));
        await saveObjectToStorage('org_list', organizations);
        await saveStringToStorage(IS_LOGGED_IN, 'true');

        // Dispatch login success with all data
        dispatch(loginSuccess(response));

        // Check if MFA is enabled (matching Swift lines 254-262)
        if (data.multifactor_status === 1) {
          navigation.navigate('MFA', { userName: data.user_name });
        } else {
          // Check if organization already selected (matching TeleMD_FileShare_Fix LoginScreen)
          const orgId = await getStringFromStorage(ORGANIZATION_ID);
          if (orgId) {
            // Organization already selected, go to MainTabs
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          } else {
            // No organization selected, navigate to OrganizationSelection
            navigation.reset({
              index: 0,
              routes: [{ name: 'OrganizationSelection', params: { organizations } }],
            });
          }
        }
      } else if (responseCode === '100') {
        // USER ALREADY LOGGED IN: server returns code 100 with sessionId/userId/userName at top level, no data
        const sessionId = response.sessionId;
        const userId = response.userId;
        const userName = response.userName || response.user_name || '';

        if (!sessionId) {
          console.error('Login failed: No session ID in response (already logged in)');
          Alert.alert('Error', 'Login failed: No session ID received');
          dispatch(setAuthenticating(false));
          return;
        }

        // Validate session on base server (same as OrganizationListActivity fetDatas) – node session may not be valid on base
        let organizations: any[] = [];
        try {
          const orgResponse = await apiService.postEncrypted(API_FETCH_ORGANIZATION_LIST, {
            session_id: sessionId,
            user_id: userId,
          });
          if (String(orgResponse.code) === '401') {
            const msg = (orgResponse.status || orgResponse.message || 'Session expired or invalid.').toString();
            Alert.alert(
              'Session expired',
              msg + '\n\nPlease log in again with your password.',
              [{ text: 'OK' }]
            );
            dispatch(setAuthenticating(false));
            return;
          }
          const orgList = orgResponse.data?.organizationList || orgResponse.data?.organizations;
          if (Array.isArray(orgList)) organizations = orgList;
        } catch (e) {
          console.warn('[Login] Fetch organizations (already logged in) failed:', e);
          const cached = await getObjectFromStorage('org_list');
          if (Array.isArray(cached) && cached.length > 0) organizations = cached;
        }

        await saveStringToStorage(SESSION_ID, sessionId);
        await saveStringToStorage(USER_ID, String(userId));
        await saveStringToStorage(USER_NAME, userName);
        await saveStringToStorage(USER_TYPE, 'Doctor');
        await saveStringToStorage(IS_LOGGED_IN, 'true');
        if (response.token) await saveStringToStorage('token', response.token);

        if (organizations.length > 0) {
          await saveStringToStorage(ORGANIZATION_COUNT, String(organizations.length));
          await saveObjectToStorage('org_list', organizations);
        }

        socketService.joinGroupAfterLogin();

        dispatch(loginSuccess({ ...response, data: { userId, user_name: userName, organizations } }));

        const orgId = await getStringFromStorage(ORGANIZATION_ID);
        if (orgId) {
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        } else if (organizations.length > 0) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'OrganizationSelection', params: { organizations } }],
          });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        }
      } else if (responseCode === '200') {
        // Handle login failure with password reset option (matching Swift showLoginAttemptAlert - lines 479-493)
        const isPasswordWrong = response.is_password_wrong || 'false';
        const count = response.count || 0;
        const message = response.status || 'Login failed';

        if (isPasswordWrong === 'true') {
          Alert.alert(
            APP_NAME,
            message + (count > 0 ? `\nAttempts remaining: ${count}` : ''),
            [
              {
                text: 'Reset Password',
                style: 'default',
                onPress: () => {
                  // TODO: Navigate to reset password screen
                  Alert.alert('Info', 'Reset password feature will be implemented');
                },
              },
              {
                text: count > 0 ? 'Try Again' : 'Cancel',
                style: 'default',
              },
            ]
          );
        } else {
          Alert.alert(APP_NAME, message);
        }
      } else {
        Alert.alert(APP_NAME, response.status || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Check if error has a status message
      let errorMessage = 'Connection not available';
      if (error?.status) {
        errorMessage = error.status;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Show error (matching Swift line 407)
      Alert.alert(APP_NAME, errorMessage);
    } finally {
      dispatch(setAuthenticating(false));
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/login_bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.topBar} />

      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.logoContainer}
          onPress={handleLogoTap}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../../assets/images/login_main.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <UsernameIcon width={18} height={20} color="#00dbff" />
            </View>
            <TextInput
              style={[styles.input, !!errors.username && styles.inputError]}
              placeholder="User Name"
              placeholderTextColor="#96969a"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errors.username) {
                  setErrors({ ...errors, username: '' });
                }
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <PasswordIcon width={18} height={22} color="#00dbff" />
            </View>
            <TextInput
              style={[styles.input, styles.passwordInput, !!errors.password && styles.inputError]}
              placeholder="Password"
              placeholderTextColor="#96969a"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors({ ...errors, password: '' });
                }
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIconText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.loginButton, isAuthenticating && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator color="#000091" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Text style={styles.poweredByText}>Powered by</Text>
        <Image
          source={require('../../../assets/images/logo_tiatech.png')}
          style={styles.tiatechLogo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.bottomBar} />

      {/* App Code Modal */}
      <Modal
        visible={showAppCodeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAppCodeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.appCodeDialog}>
            <Text style={styles.dialogTitle}>Change App Data</Text>
            <TextInput
              style={styles.dialogInput}
              placeholder="Enter App Code"
              placeholderTextColor="#96969a"
              value={appCode}
              onChangeText={setAppCode}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={true}
              editable={!loadingAppCode}
            />
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogButtonCancel]}
                onPress={() => {
                  setShowAppCodeModal(false);
                  setAppCode('');
                }}
                disabled={loadingAppCode}
              >
                <Text style={styles.dialogButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogButtonOk]}
                onPress={handleAppCodeSubmit}
                disabled={loadingAppCode}
              >
                {loadingAppCode ? (
                  <ActivityIndicator color="#000091" size="small" />
                ) : (
                  <Text style={styles.dialogButtonOkText}>OK</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    height: 15,
    backgroundColor: '#00bcdc', // skyblue
    opacity: 0, // Hidden in login screen
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 15,
    backgroundColor: '#00bcdc', // skyblue
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 180,
    height: 180,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    marginBottom: 10,
    paddingLeft: 12,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Montserrat',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  passwordInput: {
    paddingRight: 40,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  eyeIcon: {
    padding: 5,
  },
  eyeIconText: {
    fontSize: 20,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  loginButton: {
    backgroundColor: '#00b8db', // colorPrimary
    alignSelf: 'stretch',
    marginHorizontal: 60,
    marginTop: 20,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000091', // login_text_color
    fontFamily: 'Montserrat',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  poweredByText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
  },
  tiatechLogo: {
    marginLeft: 10,
    width: 150,
    height: 34,
  },
  // App Code Dialog Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  appCodeDialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  dialogInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 5,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    fontFamily: 'Montserrat',
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dialogButton: {
    flex: 1,
    height: 45,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogButtonCancel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dialogButtonOk: {
    backgroundColor: '#00b8db', // colorPrimary
  },
  dialogButtonCancelText: {
    fontSize: 16,
    color: '#212121',
    fontFamily: 'Montserrat',
    fontWeight: '600',
  },
  dialogButtonOkText: {
    fontSize: 16,
    color: '#000091', // login_text_color
    fontFamily: 'Montserrat',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
