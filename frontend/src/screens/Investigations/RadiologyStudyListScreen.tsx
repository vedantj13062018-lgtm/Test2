/**
 * RadiologyStudyListScreen
 * Matches Java InvestigationRadiologyActivity - DICOM study list
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

interface DicomStudy {
  study_id: string;
  study_uid: string;
  study_date: string;
  study_description: string;
  modality: string;
  accession_number?: string;
  series_count?: number;
  patient_name?: string;
}

const RadiologyStudyListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId, patientName } = route.params || {};

  const [studies, setStudies] = useState<DicomStudy[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStudies = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const response = await apiService.postEncrypted('getStudyList', {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        patient_id: patientId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setStudies(data?.studies || data?.studyList || []);
      }
    } catch (error) {
      console.error('Error fetching studies:', error);
      Alert.alert('Error', 'Failed to fetch DICOM studies');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchStudies();
  }, []);

  const handleStudyPress = (study: DicomStudy) => {
    navigation.navigate('DicomSeriesViewer', {
      patientId,
      patientName,
      studyId: study.study_id,
      studyUid: study.study_uid,
      studyDescription: study.study_description,
    });
  };

  const getModalityIcon = (modality: string): string => {
    switch (modality?.toUpperCase()) {
      case 'CT':
        return '🔬';
      case 'MR':
      case 'MRI':
        return '🧲';
      case 'XR':
      case 'CR':
        return '☢️';
      case 'US':
        return '📡';
      default:
        return '📷';
    }
  };

  const renderStudyItem = ({ item }: { item: DicomStudy }) => (
    <TouchableOpacity style={styles.studyItem} onPress={() => handleStudyPress(item)}>
      <View style={styles.modalityContainer}>
        <Text style={styles.modalityIcon}>{getModalityIcon(item.modality)}</Text>
        <Text style={styles.modalityText}>{item.modality}</Text>
      </View>
      <View style={styles.studyInfo}>
        <Text style={styles.studyDescription}>{item.study_description || 'No Description'}</Text>
        <Text style={styles.studyDate}>Date: {item.study_date}</Text>
        {item.accession_number && (
          <Text style={styles.accessionNumber}>Accession: {item.accession_number}</Text>
        )}
        {item.series_count !== undefined && (
          <Text style={styles.seriesCount}>{item.series_count} series</Text>
        )}
      </View>
      <View style={styles.arrowContainer}>
        <Text style={styles.arrow}>›</Text>
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
        <Text style={styles.headerTitle}>DICOM Studies</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Patient Info */}
      {patientName && (
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>Patient: {patientName}</Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading studies...</Text>
        </View>
      ) : (
        <FlatList
          data={studies}
          keyExtractor={(item) => item.study_id || item.study_uid}
          renderItem={renderStudyItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchStudies(true)} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No DICOM studies found</Text>
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
  patientInfo: {
    backgroundColor: '#e3f2fd',
    padding: 10,
  },
  patientName: {
    fontSize: 14,
    color: '#0070a9',
    fontWeight: '500',
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
  studyItem: {
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
  modalityContainer: {
    alignItems: 'center',
    marginRight: 15,
    width: 50,
  },
  modalityIcon: {
    fontSize: 24,
  },
  modalityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0070a9',
    marginTop: 4,
  },
  studyInfo: {
    flex: 1,
  },
  studyDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  studyDate: {
    fontSize: 12,
    color: '#666',
  },
  accessionNumber: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  seriesCount: {
    fontSize: 12,
    color: '#0070a9',
    marginTop: 4,
  },
  arrowContainer: {
    paddingLeft: 10,
  },
  arrow: {
    fontSize: 24,
    color: '#999',
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

export default RadiologyStudyListScreen;
