/**
 * ClinicalAssessmentScreen
 * Matches Java ClinicalAssessmentActivity - Clinical assessment forms list
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../../services/apiService';
import { getStringFromStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID, ORGANIZATION_ID } from '../../constants';

interface AssessmentForm {
  id: string;
  form_id: string;
  form_name: string;
  created_date: string;
  created_by: string;
  status: string;
  file_path?: string;
}

const ClinicalAssessmentScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId, patientName, encounterData } = route.params || {};

  const [assessments, setAssessments] = useState<AssessmentForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/fetchPatientAssesmentHistory', {
        user_id: userId || '',
        organization_id: orgId || '',
        session_id: sessionId || '',
        patient_id: patientId || '',
        search_key: searchText,
        encounter_data: encounterData || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setAssessments(data?.clinicalassessments || data?.assessments || []);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
      Alert.alert('Error', 'Failed to fetch clinical assessments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId, searchText, encounterData]);

  useEffect(() => {
    fetchAssessments();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssessments();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  const handleAddNew = () => {
    navigation.navigate('FormCategories', { patientId, patientName });
  };

  const handleView = async (form: AssessmentForm) => {
    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/fetchAssessmentViewDetails', {
        user_id: userId || '',
        session_id: sessionId || '',
        patient_id: patientId || '',
        form_id: form.form_id,
        id: form.id,
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        if (data?.filepath) {
          navigation.navigate('PDFViewer', { pdfUrl: data.filepath });
        }
      }
    } catch (error) {
      console.error('Error fetching view details:', error);
      Alert.alert('Error', 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (form: AssessmentForm) => {
    navigation.navigate('FormItems', {
      patientId,
      patientName,
      formId: form.form_id,
      assessmentId: form.id,
      formName: form.form_name,
      isEdit: true,
    });
  };

  const handleCopy = (form: AssessmentForm) => {
    navigation.navigate('FormItems', {
      patientId,
      patientName,
      formId: form.form_id,
      assessmentId: form.id,
      formName: form.form_name,
      isCopy: true,
    });
  };

  const renderAssessmentItem = ({ item }: { item: AssessmentForm }) => (
    <View style={styles.assessmentItem}>
      <View style={styles.assessmentHeader}>
        <Text style={styles.formName}>{item.form_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.assessmentDetails}>
        <Text style={styles.detailText}>Created: {item.created_date}</Text>
        <Text style={styles.detailText}>By: {item.created_by}</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionButton, styles.viewButton]} onPress={() => handleView(item)}>
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => handleEdit(item)}>
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.copyButton]} onPress={() => handleCopy(item)}>
          <Text style={styles.actionButtonText}>Copy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clinical Assessment</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search assessments..."
          placeholderTextColor="#96969a"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Assessment List */}
      {loading && assessments.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={assessments}
          keyExtractor={(item) => item.id}
          renderItem={renderAssessmentItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchAssessments();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No clinical assessments found</Text>
              <Text style={styles.emptySubtext}>Tap + to add a new assessment</Text>
            </View>
          }
        />
      )}

      {/* Add Button */}
      <TouchableOpacity style={styles.fabButton} onPress={handleAddNew}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  searchContainer: {
    padding: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    paddingBottom: 80,
  },
  assessmentItem: {
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
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  formName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  assessmentDetails: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  viewButton: {
    backgroundColor: '#2196F3',
  },
  editButton: {
    backgroundColor: '#FF9800',
  },
  copyButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0070a9',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
  },
});

export default ClinicalAssessmentScreen;
