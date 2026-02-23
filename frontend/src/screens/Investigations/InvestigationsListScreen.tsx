/**
 * InvestigationsListScreen
 * Matches Java InvestigationsActivity - Tab-based view for Laboratory and Radiology investigations
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

interface Investigation {
  investigation_id: string;
  investigation_name: string;
  investigation_type: string;
  order_date?: string;
  status?: string;
  results?: string;
  patient_id?: string;
}

const InvestigationsListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId, patientName } = route.params || {};

  const [activeTab, setActiveTab] = useState<'laboratory' | 'radiology'>('laboratory');
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchInvestigations = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const params = {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        patient_id: patientId || '',
        investigation_type: activeTab,
        search_key: searchText,
      };

      const response = await apiService.postEncrypted(
        'ApiTiaTeleMD/getInvestigationTypes',
        params
      );

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setInvestigations(data?.investigations || data?.investigationTypes || []);
      }
    } catch (error) {
      console.error('Error fetching investigations:', error);
      Alert.alert('Error', 'Failed to fetch investigations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId, activeTab, searchText]);

  useEffect(() => {
    fetchInvestigations();
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvestigations();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  const handleAddInvestigation = () => {
    navigation.navigate('InvestigationTypes', {
      patientId,
      patientName,
      investigationType: activeTab,
    });
  };

  const handleInvestigationPress = (item: Investigation) => {
    if (activeTab === 'radiology') {
      navigation.navigate('RadiologyStudyList', {
        patientId,
        patientName,
        investigationId: item.investigation_id,
      });
    } else {
      navigation.navigate('InvestigationResult', {
        patientId,
        patientName,
        investigationId: item.investigation_id,
        investigationName: item.investigation_name,
      });
    }
  };

  const handleDeleteInvestigation = async (investigationId: string) => {
    Alert.alert(
      'Delete Investigation',
      'Are you sure you want to delete this investigation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const sessionId = await getStringFromStorage(SESSION_ID);
              const userId = await getStringFromStorage(USER_ID);

              await apiService.postEncrypted('ApiTiaTeleMD/deleteInvestigation', {
                session_id: sessionId || '',
                user_id: userId || '',
                investigation_id: investigationId,
              });

              fetchInvestigations();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete investigation');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderInvestigationItem = ({ item }: { item: Investigation }) => (
    <TouchableOpacity
      style={styles.investigationItem}
      onPress={() => handleInvestigationPress(item)}
      onLongPress={() => handleDeleteInvestigation(item.investigation_id)}
    >
      <View style={styles.investigationInfo}>
        <Text style={styles.investigationName}>{item.investigation_name}</Text>
        {item.order_date && (
          <Text style={styles.investigationDate}>Ordered: {item.order_date}</Text>
        )}
        {item.status && (
          <Text style={[
            styles.investigationStatus,
            { color: item.status === 'completed' ? '#4CAF50' : '#FF9800' }
          ]}>
            {item.status}
          </Text>
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
        <Text style={styles.headerTitle}>Investigations</Text>
        <TouchableOpacity onPress={handleAddInvestigation} style={styles.addButton}>
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Patient Info */}
      {patientName && (
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>Patient: {patientName}</Text>
        </View>
      )}

      {/* Tab Layout */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'laboratory' && styles.activeTab]}
          onPress={() => setActiveTab('laboratory')}
        >
          <Text style={[styles.tabText, activeTab === 'laboratory' && styles.activeTabText]}>
            Laboratory
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'radiology' && styles.activeTab]}
          onPress={() => setActiveTab('radiology')}
        >
          <Text style={[styles.tabText, activeTab === 'radiology' && styles.activeTabText]}>
            Radiology/Other
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search investigations..."
          placeholderTextColor="#96969a"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={investigations}
          keyExtractor={(item) => item.investigation_id}
          renderItem={renderInvestigationItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchInvestigations(true)} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No investigations found</Text>
              <TouchableOpacity style={styles.addNewButton} onPress={handleAddInvestigation}>
                <Text style={styles.addNewButtonText}>Add New Investigation</Text>
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 5,
  },
  addText: {
    color: '#fff',
    fontSize: 16,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0070a9',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#0070a9',
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
  investigationItem: {
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
  investigationInfo: {
    flex: 1,
  },
  investigationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  investigationDate: {
    fontSize: 12,
    color: '#666',
  },
  investigationStatus: {
    fontSize: 12,
    fontWeight: '500',
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
    marginBottom: 20,
  },
  addNewButton: {
    backgroundColor: '#0070a9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addNewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default InvestigationsListScreen;
