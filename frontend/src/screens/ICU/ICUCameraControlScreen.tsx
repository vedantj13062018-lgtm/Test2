/**
 * ICUCameraControlScreen
 * PTZ Camera control for ICU monitoring
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import apiService from '../../services/apiService';
import { getStringFromStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID, ORGANIZATION_ID } from '../../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ICUCameraControlScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId, videoUrl, bedId, bedName } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [streamUrl, setStreamUrl] = useState(videoUrl || '');
  const [controlLoading, setControlLoading] = useState(false);

  useEffect(() => {
    if (!videoUrl) {
      fetchVideoUrl();
    }
  }, []);

  const fetchVideoUrl = async () => {
    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/getIcuVideoStream', {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        patient_id: patientId || '',
        bed_id: bedId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setStreamUrl(data?.video_url || '');
      }
    } catch (error) {
      console.error('Error fetching video URL:', error);
      Alert.alert('Error', 'Failed to load video stream');
    } finally {
      setLoading(false);
    }
  };

  const handlePTZControl = async (direction: string) => {
    try {
      setControlLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/controlIcuCamera', {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        bed_id: bedId || '',
        direction,
      });

      if (response.code !== '200' && response.code !== '100') {
        Alert.alert('Error', response.message || 'Failed to control camera');
      }
    } catch (error) {
      console.error('Error controlling camera:', error);
      Alert.alert('Error', 'Failed to control camera');
    } finally {
      setControlLoading(false);
    }
  };

  const handleZoom = async (action: 'in' | 'out') => {
    try {
      setControlLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/controlIcuCameraZoom', {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        bed_id: bedId || '',
        zoom_action: action,
      });

      if (response.code !== '200' && response.code !== '100') {
        Alert.alert('Error', response.message || 'Failed to zoom camera');
      }
    } catch (error) {
      console.error('Error zooming camera:', error);
      Alert.alert('Error', 'Failed to zoom camera');
    } finally {
      setControlLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Camera Control</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Bed Info */}
      <View style={styles.bedInfo}>
        <Text style={styles.bedName}>{bedName || 'ICU Camera'}</Text>
      </View>

      {/* Video Stream */}
      <View style={styles.videoContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0070a9" />
            <Text style={styles.loadingText}>Loading video stream...</Text>
          </View>
        ) : streamUrl ? (
          <WebView
            source={{ uri: streamUrl }}
            style={styles.webView}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              Alert.alert('Error', 'Failed to load video stream');
            }}
          />
        ) : (
          <View style={styles.noVideoContainer}>
            <Text style={styles.noVideoText}>No video stream available</Text>
          </View>
        )}
      </View>

      {/* PTZ Controls */}
      <View style={styles.controlsContainer}>
        <Text style={styles.controlsTitle}>Camera Controls</Text>

        {/* Direction Controls */}
        <View style={styles.ptzGrid}>
          <View style={styles.ptzRow}>
            <View style={styles.ptzSpacer} />
            <TouchableOpacity
              style={styles.ptzButton}
              onPress={() => handlePTZControl('up')}
              disabled={controlLoading}
            >
              <Text style={styles.ptzButtonText}>▲</Text>
              <Text style={styles.ptzLabel}>Up</Text>
            </TouchableOpacity>
            <View style={styles.ptzSpacer} />
          </View>
          <View style={styles.ptzRow}>
            <TouchableOpacity
              style={styles.ptzButton}
              onPress={() => handlePTZControl('left')}
              disabled={controlLoading}
            >
              <Text style={styles.ptzButtonText}>◀</Text>
              <Text style={styles.ptzLabel}>Left</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ptzButton, styles.homeButton]}
              onPress={() => handlePTZControl('home')}
              disabled={controlLoading}
            >
              <Text style={styles.ptzButtonText}>⌂</Text>
              <Text style={styles.ptzLabel}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ptzButton}
              onPress={() => handlePTZControl('right')}
              disabled={controlLoading}
            >
              <Text style={styles.ptzButtonText}>▶</Text>
              <Text style={styles.ptzLabel}>Right</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ptzRow}>
            <View style={styles.ptzSpacer} />
            <TouchableOpacity
              style={styles.ptzButton}
              onPress={() => handlePTZControl('down')}
              disabled={controlLoading}
            >
              <Text style={styles.ptzButtonText}>▼</Text>
              <Text style={styles.ptzLabel}>Down</Text>
            </TouchableOpacity>
            <View style={styles.ptzSpacer} />
          </View>
        </View>

        {/* Zoom Controls */}
        <View style={styles.zoomContainer}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => handleZoom('out')}
            disabled={controlLoading}
          >
            <Text style={styles.zoomButtonText}>−</Text>
            <Text style={styles.zoomLabel}>Zoom Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => handleZoom('in')}
            disabled={controlLoading}
          >
            <Text style={styles.zoomButtonText}>+</Text>
            <Text style={styles.zoomLabel}>Zoom In</Text>
          </TouchableOpacity>
        </View>

        {controlLoading && (
          <View style={styles.controlLoadingOverlay}>
            <ActivityIndicator size="small" color="#0070a9" />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0070a9',
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingTop: 40,
  },
  backButton: {
    padding: 5,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 50,
  },
  bedInfo: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    alignItems: 'center',
  },
  bedName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  videoContainer: {
    height: SCREEN_WIDTH * 0.75,
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noVideoText: {
    color: '#666',
    fontSize: 14,
  },
  controlsContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    position: 'relative',
  },
  controlsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  ptzGrid: {
    alignItems: 'center',
  },
  ptzRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  ptzSpacer: {
    width: 70,
    height: 70,
  },
  ptzButton: {
    width: 70,
    height: 70,
    backgroundColor: '#333',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  homeButton: {
    backgroundColor: '#0070a9',
  },
  ptzButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  ptzLabel: {
    color: '#999',
    fontSize: 10,
    marginTop: 2,
  },
  zoomContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  zoomButton: {
    width: 100,
    height: 50,
    backgroundColor: '#333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  zoomButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  zoomLabel: {
    color: '#999',
    fontSize: 10,
    marginTop: 2,
  },
  controlLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ICUCameraControlScreen;
