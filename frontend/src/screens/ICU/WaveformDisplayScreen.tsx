/**
 * WaveformDisplayScreen
 * Matches Java WaveformActivity - Real-time vitals waveform display via WebView
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const WaveformDisplayScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId, bedId, bedName } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [waveformUrl, setWaveformUrl] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchWaveformUrl();
  }, []);

  const fetchWaveformUrl = async () => {
    try {
      setLoading(true);
      setError(false);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/loadIcuWaveForm', {
        user_id: userId || '',
        bed_id: bedId || '',
        bed_name: bedName || '',
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        session_id: sessionId || '',
        organization_id: orgId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        const url = data?.waveformurl || data?.waveform_url || '';
        setWaveformUrl(url);
      } else {
        setError(true);
        Alert.alert('Error', response.message || 'Failed to load waveform');
      }
    } catch (error) {
      console.error('Error fetching waveform URL:', error);
      setError(true);
      Alert.alert('Error', 'Failed to load waveform');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchWaveformUrl();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Waveform</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Bed Info */}
      <View style={styles.bedInfo}>
        <Text style={styles.bedName}>{bedName || 'ICU Waveform'}</Text>
      </View>

      {/* Waveform Display */}
      <View style={styles.waveformContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0070a9" />
            <Text style={styles.loadingText}>Loading waveform data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>Failed to load waveform</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : waveformUrl ? (
          <WebView
            source={{ uri: waveformUrl }}
            style={styles.webView}
            javaScriptEnabled
            domStorageEnabled
            scalesPageToFit
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color="#0070a9" />
              </View>
            )}
            onError={() => {
              setError(true);
            }}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataIcon}>📊</Text>
            <Text style={styles.noDataText}>No waveform data available</Text>
            <Text style={styles.noDataSubtext}>
              Waveform data will appear here when available
            </Text>
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Vitals Legend</Text>
        <View style={styles.legendGrid}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>ECG</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
            <Text style={styles.legendText}>SpO2</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#f44336' }]} />
            <Text style={styles.legendText}>ABP</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>Resp</Text>
          </View>
        </View>
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
  refreshButton: {
    padding: 5,
  },
  refreshText: {
    color: '#fff',
    fontSize: 14,
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
  waveformContainer: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d0d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 15,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0070a9',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  noDataText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  noDataSubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  legendContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  legendTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  legendGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    color: '#ccc',
    fontSize: 12,
  },
});

export default WaveformDisplayScreen;
