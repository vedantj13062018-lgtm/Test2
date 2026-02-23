/**
 * Help Screen
 * Replicated from StrokeTeamOne HelpActivity – same UI and APIs.
 * - Privacy Policy card: opens WebView with core/privacypolicy (SERVER_URL + HELP_CONTENT_URL)
 * - Contact Us card: expandable, fetchSupportdetails → Technical (phone), Email
 * - Version footer: Version :{version} AES
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Linking,
  Modal,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import apiService from '../services/apiService';
import { getStringFromStorage } from '../utils/storage';
import { SESSION_ID, USER_ID, SERVER_URL } from '../constants';
import { API_FETCH_SUPPORT_DETAILS, HELP_CONTENT_URL } from '../constants';
import { getAppVersion } from '../utils/device';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Help'>;

interface SupportDetailsData {
  tech_support?: string;
  billing?: string;
  email?: string;
  details?: string;
  office?: string;
  cell?: string;
  fax?: string;
}

const HelpScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [contactExpanded, setContactExpanded] = useState(true);
  const [support, setSupport] = useState<SupportDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [privacyUrl, setPrivacyUrl] = useState<string | null>(null);
  const [versionString, setVersionString] = useState('');

  const fetchSupportDetails = useCallback(async () => {
    try {
      setLoading(true);
      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const response = await apiService.postEncrypted<SupportDetailsData>(
        API_FETCH_SUPPORT_DETAILS,
        { user_id: userId || '', session_id: sessionId || '' }
      );
      if (response.code === '200' || response.code === '100') {
        setSupport(response.data ?? null);
      } else {
        setSupport(null);
      }
    } catch (e) {
      console.error('[HelpScreen] fetchSupportdetails error:', e);
      setSupport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSupportDetails();
      setVersionString(`Version : ${getAppVersion()} AES`);
    }, [fetchSupportDetails])
  );

  const openPrivacyPolicy = async () => {
    const baseUrl = await getStringFromStorage(SERVER_URL);
    if (!baseUrl || !baseUrl.trim()) {
      return;
    }
    const url = baseUrl.replace(/\/$/, '') + '/' + HELP_CONTENT_URL.replace(/^\//, '');
    setPrivacyUrl(url);
    setPrivacyModalVisible(true);
  };

  const hasSupportContent =
    support &&
    ((support.tech_support && support.tech_support.trim() !== '') ||
      (support.email && support.email.trim() !== '') ||
      (support.billing && support.billing.trim() !== ''));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0070a9" />
      {/* Header – blue bar, back + Help title + right icons (shield, chat) */}
      <View style={styles.headerContainer}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help</Text>
          <View style={styles.headerRight}>
            <Text style={styles.headerIconText}>🛡</Text>
            <Text style={styles.headerIconText}>💬</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Privacy Policy card */}
        <TouchableOpacity
          style={styles.card}
          onPress={openPrivacyPolicy}
          activeOpacity={0.8}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardIconWrap}>
              <Text style={styles.cardIconEmoji}>📄</Text>
            </View>
            <Text style={styles.cardTitle}>Privacy Policy</Text>
          </View>
          <View style={styles.cardBottomBar} />
        </TouchableOpacity>

        {/* Contact Us card – expandable */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => setContactExpanded(!contactExpanded)}
            activeOpacity={0.8}
          >
            <View style={styles.cardIconWrap}>
              <Text style={styles.cardIconEmoji}>📞</Text>
            </View>
            <Text style={styles.cardTitle}>Contact Us</Text>
            <View style={styles.chevronWrap}>
              <Text style={styles.chevronText}>{contactExpanded ? '▲' : '▼'}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.contactDivider} />
          {contactExpanded && (
            <View style={styles.contactContent}>
              {loading ? (
                <ActivityIndicator size="small" color="#0070a9" style={styles.loader} />
              ) : (
                <>
                  {hasSupportContent && (
                    <Text style={styles.supportHeading}>Support</Text>
                  )}
                  {support?.tech_support?.trim() && (
                    <View style={styles.contactRow}>
                      <Text style={styles.contactLabel}>Technical: </Text>
                      <TouchableOpacity
                        onPress={() =>
                          Linking.openURL(`tel:${support.tech_support!.trim()}`)
                        }
                      >
                        <Text style={styles.contactLink}>{support.tech_support.trim()}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {support?.billing?.trim() && (
                    <View style={styles.contactRow}>
                      <Text style={styles.contactLabel}>Billing: </Text>
                      <TouchableOpacity
                        onPress={() =>
                          Linking.openURL(`tel:${support.billing!.trim()}`)
                        }
                      >
                        <Text style={styles.contactLink}>{support.billing.trim()}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {support?.email?.trim() && (
                    <View style={styles.contactRow}>
                      <Text style={styles.contactLabel}>Email: </Text>
                      <TouchableOpacity
                        onPress={() =>
                          Linking.openURL(`mailto:${support.email!.trim()}`)
                        }
                      >
                        <Text style={styles.contactLink}>{support.email.trim()}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {!hasSupportContent && !loading && (
                    <Text style={styles.contactEmpty}>No support details available.</Text>
                  )}
                </>
              )}
            </View>
          )}
          <View style={styles.cardBottomBar} />
        </View>

        {/* Version footer */}
        <Text style={styles.versionText}>{versionString}</Text>
      </ScrollView>

      {/* Privacy Policy WebView modal – full screen, no extra top space (match PdfViewerScreen) */}
      <Modal
        visible={privacyModalVisible}
        animationType="slide"
        onRequestClose={() => setPrivacyModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#0070a9" />
          <View
            style={[
              styles.modalHeader,
              {
                paddingTop:
                  Platform.OS === 'android'
                    ? (StatusBar.currentHeight ?? 0)
                    : insets.top,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setPrivacyModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          {privacyUrl ? (
            <WebView
              source={{ uri: privacyUrl }}
              style={styles.webView}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color="#0070a9" />
                </View>
              )}
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    backgroundColor: '#0070a9',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 80,
    justifyContent: 'flex-end',
  },
  headerIconText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    marginTop: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingLeft: 5,
    paddingRight: 10,
  },
  cardIconWrap: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconEmoji: {
    fontSize: 28,
  },
  chevronText: {
    fontSize: 18,
    color: '#00006e',
    fontWeight: 'bold',
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00006e',
    marginLeft: 4,
  },
  chevronWrap: {
    padding: 4,
  },
  cardBottomBar: {
    height: 5,
    backgroundColor: '#0070a9',
  },
  contactDivider: {
    height: 1,
    backgroundColor: '#888',
    marginHorizontal: 10,
  },
  contactContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 12,
  },
  loader: {
    marginVertical: 8,
  },
  supportHeading: {
    fontSize: 18,
    color: '#00006e',
    marginBottom: 6,
    marginLeft: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  contactLabel: {
    fontSize: 14,
    color: '#333',
  },
  contactLink: {
    fontSize: 14,
    color: '#00006e',
    textDecorationLine: 'underline',
  },
  contactEmpty: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  versionText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
    paddingVertical: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    minHeight: 44,
    backgroundColor: '#0070a9',
  },
  modalCloseBtn: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
});

export default HelpScreen;
