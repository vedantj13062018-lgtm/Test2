/**
 * AssessmentHistoryScreen
 * Assessment history view for a patient
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

interface AssessmentHistoryItem {
  id: string;
  form_id: string;
  form_name: string;
  category_name: string;
  created_date: string;
  created_by: string;
  modified_date?: string;
  modified_by?: string;
  status: string;
  score?: string;
}

const AssessmentHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId, patientName, formId, formName } = route.params || {};

  const [history, setHistory] = useState<AssessmentHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/fetchAssessmentHistory', {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        patient_id: patientId || '',
        form_id: formId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setHistory(data?.history || data?.assessmentHistory || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      Alert.alert('Error', 'Failed to fetch assessment history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId, formId]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleViewItem = (item: AssessmentHistoryItem) => {
    navigation.navigate('FormItems', {
      patientId,
      patientName,
      formId: item.form_id,
      assessmentId: item.id,
      formName: item.form_name,
      isView: true,
    });
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const renderHistoryItem = ({ item, index }: { item: AssessmentHistoryItem; index: number }) => (
    <TouchableOpacity style={styles.historyItem} onPress={() => handleViewItem(item)}>
      <View style={styles.versionBadge}>
        <Text style={styles.versionText}>v{history.length - index}</Text>
      </View>
      <View style={styles.historyContent}>
        <View style={styles.historyHeader}>
          <Text style={styles.formName}>{item.form_name}</Text>
          {item.score && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>Score: {item.score}</Text>
            </View>
          )}
        </View>

        <View style={styles.historyDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>{formatDate(item.created_date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>By:</Text>
            <Text style={styles.detailValue}>{item.created_by}</Text>
          </View>
          {item.modified_date && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Modified:</Text>
                <Text style={styles.detailValue}>{formatDate(item.modified_date)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>By:</Text>
                <Text style={styles.detailValue}>{item.modified_by}</Text>
              </View>
            </>
          )}
        </View>

        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: item.status === 'completed' ? '#4CAF50' : '#FF9800' },
          ]}
        />
      </View>
      <Text style={styles.arrowIcon}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assessment History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Form Name */}
      {formName && (
        <View style={styles.formNameContainer}>
          <Text style={styles.formNameLabel}>{formName}</Text>
          <Text style={styles.patientLabel}>Patient: {patientName}</Text>
        </View>
      )}

      {/* History List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchHistory();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No history available</Text>
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
  formNameContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
  },
  formNameLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  patientLabel: {
    fontSize: 14,
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
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  versionBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0070a9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  versionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyContent: {
    flex: 1,
    position: 'relative',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  scoreBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 12,
    color: '#0070a9',
    fontWeight: '500',
  },
  historyDetails: {
    paddingRight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    width: 70,
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  statusIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  arrowIcon: {
    fontSize: 20,
    color: '#999',
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default AssessmentHistoryScreen;
