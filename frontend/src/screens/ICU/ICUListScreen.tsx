/**
 * ICUListScreen
 * Matches Java ICU_ListPatient_Activity - ICU patients list with tabs for Admissions/Discharges
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
import { getStringFromStorage, saveStringToStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID, ORGANIZATION_ID } from '../../constants';

interface ICUPatient {
  patient_id: string;
  patient_name: string;
  mrn: string;
  fin: string;
  dob: string;
  age: string;
  gender_name: string;
  room: string;
  bed_name: string;
  bed_id: string;
  station: string;
  location: string;
  principal_diagnosis: string;
  icu_admit_date: string;
  ip_admit_date: string;
  nurse_id: string;
  nurse_name: string;
  video_url: string;
  alert_count?: string;
}

const ICUListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { fromDischarge } = route.params || {};

  const [activeTab, setActiveTab] = useState<'admissions' | 'discharges'>(
    fromDischarge ? 'discharges' : 'admissions'
  );
  const [patients, setPatients] = useState<ICUPatient[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [totalCount, setTotalCount] = useState('0');
  const [isFilterEnabled, setIsFilterEnabled] = useState(false);

  const fetchICUList = useCallback(async (isScrolling = false) => {
    try {
      if (!isScrolling) {
        setLoading(true);
      }

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      // Debug logging
      console.log('=== ICUListScreen API Debug ===');
      console.log('Session ID:', sessionId ? 'SET' : 'EMPTY');
      console.log('User ID:', userId ? 'SET' : 'EMPTY');
      console.log('Organization ID:', orgId ? 'SET' : 'EMPTY');
      
      if (!sessionId || !userId || !orgId) {
        console.warn('Missing required session data for ICU List API');
        Alert.alert('Session Required', 'Please login to view ICU patients');
        setLoading(false);
        return;
      }

      // Get filter values
      const filterPatientName = await getStringFromStorage('filter_icu_patient_name') || '';
      const filterFIN = await getStringFromStorage('filter_icu_fin') || '';
      const filterMRN = await getStringFromStorage('filter_icu_mrn') || '';
      const filterAdmitDate = await getStringFromStorage('filter_icu_admit_date') || '';
      const filterRoomType = await getStringFromStorage('filter_icu_room_type') || '';
      const filterBedType = await getStringFromStorage('filter_icu_bed_type') || '';
      const filterEnabled = await getStringFromStorage('is_icu_filter_enabled');

      setIsFilterEnabled(filterEnabled === 'true');

      const params = {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        patient_name: filterPatientName,
        fin: filterFIN,
        mrn: filterMRN,
        admit_date: filterAdmitDate,
        room_type: filterRoomType,
        bed_type: filterBedType,
        search_string: searchText,
        list_type: activeTab === 'admissions' ? 'Admission' : 'Discharge',
        start: isScrolling ? String(patients.length) : '0',
        limit: '10',
      };

      console.log('Request params:', JSON.stringify(params, null, 2));

      const response = await apiService.postEncrypted('ApiTiaTeleMD/fetchIcuList', params);

      console.log('API Response code:', response.code);
      console.log('API Response data:', JSON.stringify(response.data, null, 2));

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        // Java model uses @SerializedName("icu_list") - check multiple possible keys
        const patientList = data?.icu_list || data?.icuListArrayList || data?.iculist || data?.patientList || [];
        console.log('ICU patient list count:', patientList.length);
        setTotalCount(data?.total_count || data?.totalcount || '0');

        if (isScrolling) {
          setPatients((prev) => [...prev, ...patientList]);
        } else {
          setPatients(patientList);
        }
      } else {
        console.warn('API returned non-success code:', response.code, response.status);
      }
    } catch (error) {
      console.error('Error fetching ICU list:', error);
      Alert.alert('Error', 'Failed to fetch ICU patients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchText, activeTab, patients.length]);

  useEffect(() => {
    fetchICUList();
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchICUList();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  const handlePatientPress = (patient: ICUPatient) => {
    navigation.navigate('ICUPatientDetails', {
      patientId: patient.patient_id,
      patName: patient.patient_name,
      txtdob: patient.dob,
      txtage: patient.age,
      txtgender: patient.gender_name,
      txtbed: `${patient.room} | ${patient.bed_name}`,
      txtpd: patient.principal_diagnosis,
      txtstation: patient.station,
      txtadmitdate: patient.icu_admit_date,
      txtfin: patient.fin,
      txtmrn: patient.mrn,
      txtipadmitdate: patient.ip_admit_date,
      txtlocation: patient.location,
      bedId: patient.bed_id,
      bedName: patient.bed_name,
      videoUrl: patient.video_url,
    });
  };

  const handleFilterPress = () => {
    navigation.navigate('ICURoomTypes');
  };

  const handleAlertPress = (patient: ICUPatient) => {
    navigation.navigate('ICUAlert', { patientId: patient.patient_id });
  };

  const handleCallPress = (patient: ICUPatient) => {
    Alert.alert('Call', `Calling nurse for ${patient.patient_name}`);
  };

  const renderPatientItem = ({ item }: { item: ICUPatient }) => (
    <TouchableOpacity style={styles.patientItem} onPress={() => handlePatientPress(item)}>
      <View style={styles.patientHeader}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.patient_name}</Text>
          <Text style={styles.patientMrn}>MRN: {item.mrn}</Text>
        </View>
        <View style={styles.bedBadge}>
          <Text style={styles.bedText}>{item.bed_name}</Text>
        </View>
      </View>

      <View style={styles.patientDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Room:</Text>
          <Text style={styles.detailValue}>{item.room}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Station:</Text>
          <Text style={styles.detailValue}>{item.station}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Admit Date:</Text>
          <Text style={styles.detailValue}>{item.icu_admit_date}</Text>
        </View>
        {item.principal_diagnosis && (
          <View style={styles.diagnosisRow}>
            <Text style={styles.detailLabel}>Diagnosis:</Text>
            <Text style={styles.diagnosisText} numberOfLines={2}>
              {item.principal_diagnosis}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.alertButton]}
          onPress={() => handleAlertPress(item)}
        >
          <Text style={styles.actionButtonText}>Alerts</Text>
          {item.alert_count && parseInt(item.alert_count) > 0 && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>{item.alert_count}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.callButton]}
          onPress={() => handleCallPress(item)}
        >
          <Text style={styles.actionButtonText}>Call Nurse</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>ICU List</Text>
        <TouchableOpacity onPress={handleFilterPress} style={styles.filterHeaderButton}>
          <Text style={styles.filterHeaderText}>Filter</Text>
          {isFilterEnabled && <View style={styles.filterIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'admissions' && styles.tabActive]}
          onPress={() => {
            setActiveTab('admissions');
            setPatients([]);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'admissions' && styles.tabTextActive]}>
            Admissions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discharges' && styles.tabActive]}
          onPress={() => {
            setActiveTab('discharges');
            setPatients([]);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'discharges' && styles.tabTextActive]}>
            Discharges
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients..."
          placeholderTextColor="#96969a"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Patient List */}
      {loading && patients.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.patient_id}
          renderItem={renderPatientItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchICUList();
              }}
            />
          }
          onEndReached={() => {
            if (parseInt(totalCount) > patients.length && !loading) {
              fetchICUList(true);
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No patients found</Text>
            </View>
          }
          ListFooterComponent={
            loading && patients.length > 0 ? (
              <ActivityIndicator style={styles.footerLoader} color="#0070a9" />
            ) : null
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
  filterHeaderButton: {
    padding: 5,
    position: 'relative',
  },
  filterHeaderText: {
    color: '#fff',
    fontSize: 14,
  },
  filterIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f44336',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0070a9',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#0070a9',
    fontWeight: 'bold',
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
  },
  patientItem: {
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
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  patientMrn: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  bedBadge: {
    backgroundColor: '#0070a9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  patientDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    width: 90,
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  diagnosisRow: {
    marginTop: 4,
  },
  diagnosisText: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  alertButton: {
    backgroundColor: '#f44336',
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  alertBadge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  alertBadgeText: {
    color: '#f44336',
    fontSize: 10,
    fontWeight: 'bold',
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
  footerLoader: {
    marginVertical: 20,
  },
});

export default ICUListScreen;
