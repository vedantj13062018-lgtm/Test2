/**
 * In-app PDF viewer – displays PDF in a WebView (no react-native-pdf / react-native-blob-util).
 * Avoids "getConstants of null" on Android. Uses Google Docs viewer for reliable in-app display.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
  ToastAndroid,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PdfViewer'>;
type PdfViewerRouteProp = RouteProp<RootStackParamList, 'PdfViewer'>;

const PdfViewerScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PdfViewerRouteProp>();
  const { pdfUrl, title } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const showToast = (message: string) => {
    if (Platform.OS === 'android' && ToastAndroid) {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('', message);
    }
  };

  if (!pdfUrl || !pdfUrl.trim()) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{title || 'PDF'}</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>No PDF URL provided</Text>
        </View>
      </View>
    );
  }

  const url = pdfUrl.trim();
  // Google Docs viewer embeds the PDF in-app without native PDF modules
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00006e" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title || 'PDF'}</Text>
      </View>

      {error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.openExternalBtn}
            onPress={() => url && Linking.openURL(url)}
          >
            <Text style={styles.openExternalText}>Open in browser</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0070a9" />
              <Text style={styles.loadingText}>Loading PDF...</Text>
            </View>
          )}
          <WebView
            source={{ uri: viewerUrl }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              setLoading(false);
              setError(nativeEvent.description || 'Loading error');
              showToast('Loading error');
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              if (nativeEvent.statusCode >= 400) {
                setLoading(false);
                setError(`Failed to load (${nativeEvent.statusCode})`);
              }
            }}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    width: '100%',
    paddingHorizontal: 8,
    backgroundColor: '#00006e',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  webview: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  openExternalBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#0070a9',
    borderRadius: 8,
  },
  openExternalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PdfViewerScreen;
