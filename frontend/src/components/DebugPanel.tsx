/**
 * Debug Panel Component
 * Shows API debug information on screen for testing
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { getStringFromStorage } from '../utils/storage';
import {
  SESSION_ID,
  USER_ID,
  ORGANIZATION_ID,
  BASE_URL,
} from '../constants';

interface DebugPanelProps {
  visible: boolean;
  onClose: () => void;
  apiResponse?: any;
  apiError?: string;
  endpoint?: string;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  visible,
  onClose,
  apiResponse,
  apiError,
  endpoint,
}) => {
  const [sessionInfo, setSessionInfo] = useState({
    sessionId: '',
    userId: '',
    organizationId: '',
    baseUrl: '',
  });

  useEffect(() => {
    loadSessionInfo();
  }, [visible]);

  const loadSessionInfo = async () => {
    const sessionId = await getStringFromStorage(SESSION_ID);
    const userId = await getStringFromStorage(USER_ID);
    const organizationId = await getStringFromStorage(ORGANIZATION_ID);
    const baseUrl = await getStringFromStorage(BASE_URL);

    setSessionInfo({
      sessionId: sessionId || 'NOT SET',
      userId: userId || 'NOT SET',
      organizationId: organizationId || 'NOT SET',
      baseUrl: baseUrl || 'NOT SET',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerText}>🔧 Debug Panel</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Session Info */}
            <Text style={styles.sectionTitle}>Session Info</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Session ID:</Text>
              <Text style={[styles.value, sessionInfo.sessionId === 'NOT SET' && styles.errorValue]}>
                {sessionInfo.sessionId.substring(0, 20)}...
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>User ID:</Text>
              <Text style={[styles.value, sessionInfo.userId === 'NOT SET' && styles.errorValue]}>
                {sessionInfo.userId}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Org ID:</Text>
              <Text style={[styles.value, sessionInfo.organizationId === 'NOT SET' && styles.errorValue]}>
                {sessionInfo.organizationId}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Base URL:</Text>
              <Text style={styles.value} numberOfLines={2}>
                {sessionInfo.baseUrl}
              </Text>
            </View>

            {/* API Info */}
            {endpoint && (
              <>
                <Text style={styles.sectionTitle}>API Request</Text>
                <Text style={styles.endpoint}>{endpoint}</Text>
              </>
            )}

            {/* API Response */}
            {apiResponse && (
              <>
                <Text style={styles.sectionTitle}>API Response</Text>
                <View style={styles.responseBox}>
                  <Text style={styles.responseText}>
                    {JSON.stringify(apiResponse, null, 2).substring(0, 1000)}
                    {JSON.stringify(apiResponse).length > 1000 ? '...(truncated)' : ''}
                  </Text>
                </View>
              </>
            )}

            {/* API Error */}
            {apiError && (
              <>
                <Text style={styles.sectionTitle}>API Error</Text>
                <View style={[styles.responseBox, styles.errorBox]}>
                  <Text style={styles.errorText}>{apiError}</Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000053',
    padding: 15,
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  content: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000053',
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: 100,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  errorValue: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  endpoint: {
    fontSize: 12,
    color: '#00b8db',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 5,
  },
  responseBox: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    maxHeight: 200,
  },
  responseText: {
    fontSize: 11,
    color: '#333',
    fontFamily: 'monospace',
  },
  errorBox: {
    backgroundColor: '#fdeaea',
  },
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
  },
});

export default DebugPanel;
