/**
 * NotesWebViewScreen
 * HTML preview of notes content
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';

const NotesWebViewScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { noteTitle, noteContent, patientName, mrn, pdfUrl } = route.params || {};

  const [loading, setLoading] = useState(true);

  // If we have a PDF URL, show it directly
  if (pdfUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>View Note</Text>
          <View style={styles.placeholder} />
        </View>
        <WebView
          source={{ uri: pdfUrl }}
          style={styles.webView}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0070a9" />
            </View>
          )}
        />
      </View>
    );
  }

  // Generate HTML preview from note content
  const generateHtml = () => {
    const escapedContent = noteContent
      ?.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            margin: 0;
            background-color: #fff;
            color: #333;
            line-height: 1.6;
          }
          .header {
            border-bottom: 2px solid #0070a9;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #0070a9;
            margin: 0 0 10px 0;
          }
          .patient-info {
            font-size: 14px;
            color: #666;
          }
          .content {
            font-size: 16px;
            color: #333;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${noteTitle || 'Note'}</h1>
          <div class="patient-info">
            Patient: ${patientName || 'N/A'}${mrn ? ` (MRN: ${mrn})` : ''}
          </div>
        </div>
        <div class="content">
          ${escapedContent || 'No content'}
        </div>
        <div class="footer">
          Generated on ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${noteTitle}\n\nPatient: ${patientName}${mrn ? ` (MRN: ${mrn})` : ''}\n\n${noteContent}`,
        title: noteTitle,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handlePrint = () => {
    Alert.alert('Print', 'Print functionality would open print dialog here');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* WebView Preview */}
      <WebView
        source={{ html: generateHtml() }}
        style={styles.webView}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        originWhitelist={['*']}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0070a9" />
        </View>
      )}

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={handlePrint}>
          <Text style={styles.footerIcon}>🖨️</Text>
          <Text style={styles.footerButtonText}>Print</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={handleShare}>
          <Text style={styles.footerIcon}>📤</Text>
          <Text style={styles.footerButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  shareButton: {
    padding: 5,
  },
  shareText: {
    color: '#fff',
    fontSize: 14,
  },
  placeholder: {
    width: 50,
  },
  webView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 10,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 5,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  footerIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  footerButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default NotesWebViewScreen;
