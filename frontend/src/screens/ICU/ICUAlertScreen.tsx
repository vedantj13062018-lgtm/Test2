/**
 * ICUAlertScreen
 * Matches Java AlertICUActivity - Critical alerts display for ICU patients
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../../services/apiService';
import { getStringFromStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID, ORGANIZATION_ID } from '../../constants';

interface ICUAlert {
  id: string;
  alert_type: string;
  alert_message: string;
  severity: 'critical' | 'warning' | 'info';
  parameter_name?: string;
  parameter_value?: string;
  threshold_value?: string;
  created_at: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

const ICUAlertScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId } = route.params || {};

  const [alerts, setAlerts] = useState<ICUAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/getIcuAlerts', {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        patient_id: patientId || '',
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setAlerts(data?.alerts || data?.alertList || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      Alert.alert('Error', 'Failed to fetch alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAcknowledge = async (alertId: string) => {
    try {
      setAcknowledging(alertId);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/acknowledgeIcuAlert', {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        alert_id: alertId,
      });

      if (response.code === '200' || response.code === '100') {
        fetchAlerts();
      } else {
        Alert.alert('Error', response.message || 'Failed to acknowledge alert');
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      Alert.alert('Error', 'Failed to acknowledge alert');
    } finally {
      setAcknowledging(null);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '#f44336';
      case 'warning':
        return '#FF9800';
      case 'info':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const renderAlertItem = ({ item }: { item: ICUAlert }) => (
    <View
      style={[
        styles.alertItem,
        { borderLeftColor: getSeverityColor(item.severity) },
        item.acknowledged && styles.alertItemAcknowledged,
      ]}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertTypeContainer}>
          <Text style={styles.alertIcon}>{getSeverityIcon(item.severity)}</Text>
          <View>
            <Text style={styles.alertType}>{item.alert_type}</Text>
            <Text style={[styles.severityLabel, { color: getSeverityColor(item.severity) }]}>
              {item.severity.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.alertTime}>{formatDate(item.created_at)}</Text>
      </View>

      <Text style={styles.alertMessage}>{item.alert_message}</Text>

      {item.parameter_name && (
        <View style={styles.parameterContainer}>
          <View style={styles.parameterRow}>
            <Text style={styles.parameterLabel}>{item.parameter_name}:</Text>
            <Text style={[styles.parameterValue, { color: getSeverityColor(item.severity) }]}>
              {item.parameter_value}
            </Text>
          </View>
          {item.threshold_value && (
            <Text style={styles.thresholdText}>Threshold: {item.threshold_value}</Text>
          )}
        </View>
      )}

      {item.acknowledged ? (
        <View style={styles.acknowledgedContainer}>
          <Text style={styles.acknowledgedText}>
            ✓ Acknowledged by {item.acknowledged_by} at {formatDate(item.acknowledged_at || '')}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.acknowledgeButton}
          onPress={() => handleAcknowledge(item.id)}
          disabled={acknowledging === item.id}
        >
          {acknowledging === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alerts</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Summary */}
      {alerts.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{alerts.length}</Text>
            <Text style={styles.summaryLabel}>Total Alerts</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#f44336' }]}>
              {unacknowledgedCount}
            </Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
              {alerts.length - unacknowledgedCount}
            </Text>
            <Text style={styles.summaryLabel}>Acknowledged</Text>
          </View>
        </View>
      )}

      {/* Alert List */}
      {loading && alerts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={renderAlertItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchAlerts();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>✓</Text>
              <Text style={styles.emptyText}>No alerts</Text>
              <Text style={styles.emptySubtext}>
                There are no active alerts for this patient
              </Text>
            </View>
          }
        />
      )}
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
  placeholder: {
    width: 50,
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 10,
  },
  alertItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  alertItemAcknowledged: {
    opacity: 0.7,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  alertTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  alertType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  severityLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  alertTime: {
    fontSize: 11,
    color: '#999',
  },
  alertMessage: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  parameterContainer: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  parameterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parameterLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  parameterValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  thresholdText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  acknowledgedContainer: {
    padding: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
  },
  acknowledgedText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  acknowledgeButton: {
    backgroundColor: '#0070a9',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  acknowledgeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    color: '#4CAF50',
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default ICUAlertScreen;
