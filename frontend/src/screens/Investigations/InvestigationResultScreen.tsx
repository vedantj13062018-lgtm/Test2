/**
 * InvestigationResultScreen
 * Matches Java investigation result view - displays lab results
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

interface LabResult {
  result_id: string;
  test_name: string;
  result_value: string;
  unit: string;
  reference_range: string;
  status: string;
  result_date: string;
  is_abnormal: boolean;
  document_url?: string;
}

const InvestigationResultScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId, investigationId, investigationName } = route.params || {};

  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchResults = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/fetchResultsOfTest', {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        patient_id: patientId || '',
        investigation_id: investigationId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setResults(data?.results || data?.labResults || []);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      Alert.alert('Error', 'Failed to fetch investigation results');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId, investigationId]);

  useEffect(() => {
    fetchResults();
  }, []);

  const handleUploadResult = () => {
    navigation.navigate('LabResultUpload', {
      patientId,
      investigationId,
      investigationName,
    });
  };

  const handleViewDocument = (documentUrl: string) => {
    navigation.navigate('PdfViewer', {
      pdfUrl: documentUrl,
      title: investigationName,
    });
  };

  const handleDeleteResult = async (resultId: string) => {
    Alert.alert('Delete Result', 'Are you sure you want to delete this result?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            const sessionId = await getStringFromStorage(SESSION_ID);
            const userId = await getStringFromStorage(USER_ID);

            await apiService.postEncrypted('ApiTiaTeleMD/deleteResultsOfTest', {
              session_id: sessionId || '',
              user_id: userId || '',
              result_id: resultId,
            });

            fetchResults();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete result');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const renderResultItem = ({ item }: { item: LabResult }) => (
    <TouchableOpacity
      style={[styles.resultItem, item.is_abnormal && styles.resultItemAbnormal]}
      onPress={() => item.document_url && handleViewDocument(item.document_url)}
      onLongPress={() => handleDeleteResult(item.result_id)}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.testName}>{item.test_name}</Text>
        <Text style={styles.resultDate}>{item.result_date}</Text>
      </View>
      <View style={styles.resultBody}>
        <View style={styles.valueContainer}>
          <Text
            style={[styles.resultValue, item.is_abnormal && styles.resultValueAbnormal]}
          >
            {item.result_value}
          </Text>
          <Text style={styles.unit}>{item.unit}</Text>
        </View>
        <View style={styles.referenceContainer}>
          <Text style={styles.referenceLabel}>Reference:</Text>
          <Text style={styles.referenceValue}>{item.reference_range}</Text>
        </View>
      </View>
      <View style={styles.resultFooter}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'completed' ? '#4CAF50' : '#FF9800' },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        {item.document_url && (
          <TouchableOpacity
            style={styles.viewDocButton}
            onPress={() => handleViewDocument(item.document_url!)}
          >
            <Text style={styles.viewDocText}>View Document</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {investigationName || 'Results'}
        </Text>
        <TouchableOpacity onPress={handleUploadResult} style={styles.uploadButton}>
          <Text style={styles.uploadText}>Upload</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.result_id}
          renderItem={renderResultItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchResults(true)} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results available</Text>
              <TouchableOpacity style={styles.uploadNewButton} onPress={handleUploadResult}>
                <Text style={styles.uploadNewButtonText}>Upload Result</Text>
              </TouchableOpacity>
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
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  uploadButton: {
    padding: 5,
  },
  uploadText: {
    color: '#fff',
    fontSize: 14,
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
  resultItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  resultItemAbnormal: {
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  resultDate: {
    fontSize: 12,
    color: '#666',
  },
  resultBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  resultValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  resultValueAbnormal: {
    color: '#f44336',
  },
  unit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  referenceContainer: {
    alignItems: 'flex-end',
  },
  referenceLabel: {
    fontSize: 12,
    color: '#999',
  },
  referenceValue: {
    fontSize: 14,
    color: '#666',
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  viewDocButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
  },
  viewDocText: {
    color: '#0070a9',
    fontSize: 12,
    fontWeight: '500',
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
    marginBottom: 20,
  },
  uploadNewButton: {
    backgroundColor: '#0070a9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadNewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default InvestigationResultScreen;
