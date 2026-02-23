/**
 * Newsletter Screen
 * Replicated from StrokeTeamOne NewsLetterActivity
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
  Image,
  ToastAndroid,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import NewsletterListItem from '../components/NewsletterListItem';
import apiService from '../services/apiService';
import { getStringFromStorage } from '../utils/storage';
import { SESSION_ID, USER_ID } from '../constants';
import { API_FETCH_ALL_NEWSLETTERS } from '../constants';
import { Newsletter } from '../types';
import CustomDrawer from '../components/CustomDrawer';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Newsletters'>;

const NewsletterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = () => {
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const loadNewsletters = async () => {
    try {
      setLoading(true);
      
      // Check session first
      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      
      if (!sessionId || !userId || sessionId === '' || userId === '') {
        console.warn('[NewsletterScreen] Missing session data - sessionId:', sessionId || 'EMPTY', 'userId:', userId || 'EMPTY');
        setNewsletters([]);
        setLoading(false);
        return;
      }
      
      // Get timezone
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const params = {
        session_id: sessionId,
        user_id: userId,
        time_zone: timeZone,
      };
      
      console.log('[NewsletterScreen] Calling getAllNewsLetters with endpoint:', API_FETCH_ALL_NEWSLETTERS);
      console.log('[NewsletterScreen] Params:', params);
      
      // Use postEncrypted method (matches reference implementation pattern)
      // Note: The reference uses ApiClient.post() which encrypts with 'base' mode
      const response = await apiService.postEncrypted(API_FETCH_ALL_NEWSLETTERS, params);
      
      // Check for success (code "200" or "100" for success)
      if ((response.code === '200' || response.code === '100' || response.status === 'success') && response.data) {
        // The API returns a Newsletter object with newslestters array
        const newsletterList = response.data.newslestters || response.data.news_letters || [];
        setNewsletters(newsletterList || []);
      } else {
        const errorMsg = response.message || response.status || 'Unknown error';
        console.error('[NewsletterScreen] API returned error:', errorMsg, response);
        Alert.alert('Error', errorMsg);
        setNewsletters([]);
      }
    } catch (error: any) {
      console.error('[NewsletterScreen] Error loading newsletters:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load newsletters';
      let showAlert = true;
      
      if (error.code === 'MISSING_CREDENTIALS' || error.isExpected) {
        // Don't show alert for missing credentials - just show empty state
        showAlert = false;
        console.warn('[NewsletterScreen] Missing credentials - showing empty state');
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later or contact support.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (showAlert) {
        Alert.alert('Error', errorMessage);
      }
      setNewsletters([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNewsletters();
    }, [])
  );

  /** Show "No Permission" toast like FileShareScreen / StrokeTeamOne when file cannot be opened */
  const showNoPermissionToast = () => {
    if (Platform.OS === 'android' && ToastAndroid) {
      ToastAndroid.show('No Permission', ToastAndroid.SHORT);
    } else {
      Alert.alert('No Permission', '');
    }
  };

  /** Open PDF in-app (same as StrokeTeamOne: PdfDownloaderActivity with pdf_view_url + label). */
  const handleViewPress = (newsletter: Newsletter) => {
    if (!newsletter.file_url || !newsletter.file_url.trim()) {
      showNoPermissionToast();
      return;
    }
    navigation.navigate('PdfViewer', {
      pdfUrl: newsletter.file_url.trim(),
      title: newsletter.label || 'Newsletter',
    });
  };

  const renderNewsletterItem = ({ item, index }: { item: Newsletter; index: number }) => {
    return (
      <NewsletterListItem
        newsletter={item}
        index={index}
        onViewPress={handleViewPress}
      />
    );
  };

  const renderEmptyList = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.emptyText}>Loading newsletters...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No newsletters available</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00006e" />
      <CustomDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
      />
      
      {/* Header with Gradient */}
      <View style={styles.headerContainer}>
        {/* Left Drawer Icon Section - Dark Blue */}
        <TouchableOpacity 
          style={styles.drawerIconContainer}
          onPress={openDrawer}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../assets/images/side_bar_icon.png')}
            style={styles.drawerIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.headerGradientContainer}>
          <View style={styles.gradientHeader}>
            <View style={styles.gradientLeft} />
            <View style={styles.gradientMiddle} />
            <View style={styles.gradientRight} />
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Newsletters</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <FlatList
          data={newsletters}
          renderItem={renderNewsletterItem}
          keyExtractor={(item, index) => item.id || `newsletter-${index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    height: 50,
    width: '100%',
  },
  drawerIconContainer: {
    width: 65,
    height: '100%',
    backgroundColor: '#00006e',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  drawerIcon: {
    width: 40,
    height: 40,
  },
  headerGradientContainer: {
    flex: 1,
  },
  gradientHeader: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0070a9',
  },
  gradientLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '35%',
    backgroundColor: '#00006e',
  },
  gradientMiddle: {
    position: 'absolute',
    left: '35%',
    top: 0,
    bottom: 0,
    width: '30%',
    backgroundColor: '#0070a9',
  },
  gradientRight: {
    position: 'absolute',
    left: '65%',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#007eb6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
    marginLeft: 10,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginHorizontal: 5,
    marginBottom: 5,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
    fontFamily: 'Montserrat',
  },
});

export default NewsletterScreen;
