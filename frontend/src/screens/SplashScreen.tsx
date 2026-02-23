/**
 * Splash Screen - Initial screen that loads app resources
 * Replicated from TeleMD_FileShare_Fix with UI matching activity_splash.xml
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Image,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DeviceInfo from 'react-native-device-info';
import { RootStackParamList } from '../types';
import { fetchAppConfig, getAppCode } from '../services/appCodeService';
import { getStringFromStorage, saveStringToStorage } from '../utils/storage';
import {
  APP_CODE,
  BASE_URL,
  BASE_SOCKET_URL,
  SERVER_URL,
  GROUP_CALL_URL,
  SESSION_ID,
  ORGANIZATION_ID,
} from '../constants';
import socketService from '../services/socketService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const RESOURCE_URL = 'https://mobappversion.tiamd.com/api/';
const RESOURCE_APPNAME = 'TIAMDANDROID';
const RESOURCE_TYPE = 'android';
const RESOURCE_ENV = 'production';

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [showCountryList, setShowCountryList] = useState(false);
  const [countryList, setCountryList] = useState<string[]>([]);
  const [tapCount, setTapCount] = useState(0);
  const [showAppCodeDialog, setShowAppCodeDialog] = useState(false);
  const [appCode, setAppCode] = useState('');

  useEffect(() => {
    initializeApp();
    loadAppCode();
  }, []);

  const loadAppCode = async () => {
    const savedAppCode = await getAppCode();
    setAppCode(savedAppCode || '');
  };

  const handleLogoPress = () => {
    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);
    
    if (newTapCount === 8) {
      setTapCount(0);
      setShowAppCodeDialog(true);
    }
  };

  const handleAppCodeSubmit = async () => {
    if (!appCode.trim()) {
      Alert.alert('Error', 'Please enter app code');
      return;
    }

    setShowAppCodeDialog(false);
    setLoading(true);

    try {
      console.log('=== APP CODE SUBMIT (SPLASH) ===');
      console.log('App Code:', appCode.trim());

      const success = await fetchAppConfig(appCode.trim());

      if (success) {
        Alert.alert('Success', 'App code updated successfully');
        // Reload app data
        await fetchResources();
      } else {
        Alert.alert('Error', 'No data found for this app code');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('=== APP CODE ERROR (SPLASH) ===');
      console.error('Error:', error);
      Alert.alert('Error', error?.message || 'Failed to update app code');
      setLoading(false);
    }
  };

  const initializeApp = async () => {
    let timeoutId: NodeJS.Timeout;
    
    try {
      const initPromise = new Promise(async (resolve, reject) => {
        try {
          const appCode = await getAppCode();
          if (appCode) {
            await fetchResources();
          } else {
            await fetchCountryList();
          }
          resolve(true);
        } catch (error) {
          reject(error);
        }
      });

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Initialization timed out. Please check your internet connection.'));
        }, 15000); // 15 seconds timeout
      });

      await Promise.race([initPromise, timeoutPromise]);
      clearTimeout(timeoutId!);
      
    } catch (error: any) {
      console.error('Initialization error:', error);
      Alert.alert(
        'Connection Error', 
        error.message || 'Failed to initialize app',
        [
          { text: 'Retry', onPress: () => initializeApp() }
        ]
      );
      setLoading(false);
    }
  };

  const fetchCountryList = async () => {
    try {
      // For now, we'll skip country list and go directly to login
      // This can be enhanced later to call the resource API
      console.log('No app code found, navigating to login');
      setLoading(false);
      navigateToLogin();
    } catch (error: any) {
      console.error('=== FETCH COUNTRY LIST ERROR ===');
      console.error('Error:', error);
      Alert.alert('Error', `Failed to fetch country list: ${error?.message || 'Network error'}`);
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const appCode = await getAppCode();
      if (!appCode) {
        await navigateFromStoredSession();
        return;
      }

      // Verify app code is still valid by checking if BASE_URL exists
      const baseUrl = await getStringFromStorage(BASE_URL);
      if (!baseUrl) {
        // No BASE_URL means app code wasn't properly set
        await navigateFromStoredSession();
        return;
      }

      // Process app data from storage (already saved by fetchAppConfig)
      await processAppDataFromStorage();
    } catch (error) {
      console.error('Resources error:', error);
      // Stay logged in: if we have a stored session, use it instead of forcing Login
      await navigateFromStoredSession();
    }
  };

  const processAppDataFromStorage = async () => {
    try {
      // Get socket URL and connect if available
      const socketUrl = await getStringFromStorage(BASE_SOCKET_URL);
      if (socketUrl) {
        socketService.initSocket().catch((err) => 
          console.warn('[SplashScreen] Socket connect background:', err)
        );
      }

      const sessionId = await getStringFromStorage(SESSION_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      if (!sessionId) {
        navigateToLogin();
        return;
      }

      // If organization not selected, go to Login (which handles organization selection)
      if (!orgId) {
        navigateToLogin();
        return;
      }

      // Ready for app
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' as never }],
      });
    } catch (error) {
      console.error('Process app data error:', error);
      navigateToLogin();
    }
  };

  /** Use stored session only (no fresh API). Keeps user "online" until they logout. */
  const navigateFromStoredSession = async () => {
    setLoading(false);
    const sessionId = await getStringFromStorage(SESSION_ID);
    if (!sessionId) {
      navigateToLogin();
      return;
    }
    const orgId = await getStringFromStorage(ORGANIZATION_ID);
    if (!orgId) {
      navigateToLogin();
      return;
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' as never }],
    });
  };

  const handleCountrySelect = async (country: string) => {
    try {
      setLoading(true);
      setShowCountryList(false);

      // For now, this is a placeholder - can be enhanced later
      // to call fetchLocationResources API
      console.log('Country selected:', country);
      Alert.alert('Info', 'Country selection feature will be implemented');
      setLoading(false);
    } catch (error: any) {
      console.error('=== LOCATION RESOURCES ERROR ===');
      console.error('Error:', error);
      Alert.alert('Error', `Failed to fetch location resources: ${error?.message || 'Network error'}`);
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    setLoading(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' as never }],
    });
  };

  // Country List Modal (matching dialog_country_list.xml)
  if (showCountryList) {
    return (
      <Modal
        visible={showCountryList}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCountryList(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.countryCard}>
            <Text style={styles.countryTitle}>Select Country</Text>
            <FlatList
              data={countryList}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => handleCountrySelect(item)}
                >
                  <Text style={styles.countryText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    );
  }

  // Main Splash Screen (matching activity_splash.xml)
  return (
    <ImageBackground 
      source={require('../../assets/images/login_bg.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      {/* Top Sky Blue Bar - 15dp */}
      <View style={styles.topBar} />
      
      {/* Logo - 200dp x 200dp, centered */}
      <TouchableOpacity 
        style={styles.logoContainer}
        onPress={handleLogoPress}
        activeOpacity={0.8}
      >
        <Image
          source={require('../../assets/images/login_main.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00bcdc" />
        </View>
      )}

      {/* Footer - Powered by TiaTech */}
      <View style={styles.footer}>
        <Text style={styles.poweredByText}>Powered by</Text>
        <Image
          source={require('../../assets/images/logo_tiatech.png')}
          style={styles.tiatechLogo}
          resizeMode="contain"
        />
      </View>

      {/* Bottom Sky Blue Bar - 15dp */}
      <View style={styles.bottomBar} />

      {/* App Code Dialog */}
      <Modal
        visible={showAppCodeDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAppCodeDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.appCodeDialog}>
            <Text style={styles.dialogTitle}>Enter App Code</Text>
            
            <TextInput
              style={styles.dialogInput}
              placeholder="Enter App Code"
              placeholderTextColor="#96969a"
              value={appCode}
              onChangeText={setAppCode}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={true}
            />

            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogButtonCancel]}
                onPress={() => setShowAppCodeDialog(false)}
              >
                <Text style={styles.dialogButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogButtonOk]}
                onPress={handleAppCodeSubmit}
              >
                <Text style={styles.dialogButtonOkText}>OK</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 15, // 15dp
    backgroundColor: '#00bcdc', // skyblue
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 15, // 15dp
    backgroundColor: '#00bcdc', // skyblue
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logoImage: {
    width: 200,
    height: 200,
  },
  loadingContainer: {
    marginTop: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 30, // Above bottom bar
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  poweredByText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Montserrat', // Will need to add Montserrat font
  },
  tiatechLogo: {
    marginLeft: 10,
    width: 150,
    height: 34,
  },
  // Country List Modal Styles (matching dialog_country_list.xml)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  countryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minHeight: 100,
  },
  countryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#9b9b9b', // grey_dark
    textAlign: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    fontFamily: 'Montserrat',
  },
  countryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  countryText: {
    fontSize: 16,
    color: '#212121',
    fontFamily: 'Montserrat',
  },
  // App Code Dialog Styles
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
    margin: 5,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#212121',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Montserrat',
    height: 40,
    textAlignVertical: 'center',
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
    marginBottom: 10,
    marginHorizontal: 5,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginHorizontal: 5,
    gap: 5,
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
    marginLeft: 5,
  },
  dialogButtonCancelText: {
    fontSize: 16,
    color: '#212121',
    fontFamily: 'Montserrat',
  },
  dialogButtonOkText: {
    fontSize: 16,
    color: '#000091', // login_text_color
    fontFamily: 'Montserrat',
    fontWeight: 'normal',
  },
});

export default SplashScreen;
