/**
 * SearchMedicinesScreen
 * Medicine search functionality for prescriptions
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../../services/apiService';
import { getStringFromStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID } from '../../constants';

interface Medicine {
  id: string;
  item: string;
  code?: string;
  description?: string;
  strength?: string;
  form?: string;
  manufacturer?: string;
}

const SearchMedicinesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId, doctorId, onMedicineSelected } = route.params || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchMedicines = useCallback(async (query: string) => {
    if (query.length < 2) {
      setMedicines([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/searchMedicinesList', {
        user_id: userId || '',
        session_id: sessionId || '',
        patient_id: patientId || '',
        doctor_id: doctorId || '',
        search_key: query,
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        const medicinesList = data?.medicinesListArray || [];
        setMedicines(medicinesList.map((m: any, index: number) => ({
          id: m.id || String(index),
          item: m.item || m.name || '',
          code: m.code || '',
          description: m.description || '',
          strength: m.strength || '',
          form: m.form || '',
          manufacturer: m.manufacturer || '',
        })));
      }
    } catch (error) {
      console.error('Error searching medicines:', error);
      Alert.alert('Error', 'Failed to search medicines');
    } finally {
      setLoading(false);
    }
  }, [patientId, doctorId]);

  const handleSearch = () => {
    searchMedicines(searchQuery);
  };

  const handleMedicineSelect = (medicine: Medicine) => {
    if (onMedicineSelected) {
      onMedicineSelected(medicine);
    }
    navigation.goBack();
  };

  const renderMedicineItem = ({ item }: { item: Medicine }) => (
    <TouchableOpacity
      style={styles.medicineItem}
      onPress={() => handleMedicineSelect(item)}
    >
      <View style={styles.medicineIcon}>
        <Text style={styles.medicineIconText}>💊</Text>
      </View>
      <View style={styles.medicineInfo}>
        <Text style={styles.medicineName}>{item.item}</Text>
        {item.description && (
          <Text style={styles.medicineDescription} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <View style={styles.medicineDetails}>
          {item.strength && (
            <Text style={styles.medicineDetail}>Strength: {item.strength}</Text>
          )}
          {item.form && (
            <Text style={styles.medicineDetail}>Form: {item.form}</Text>
          )}
        </View>
        {item.manufacturer && (
          <Text style={styles.medicineManufacturer}>{item.manufacturer}</Text>
        )}
      </View>
      <Text style={styles.selectArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Medicines</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by medicine name..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {loading && (
            <ActivityIndicator size="small" color="#0070a9" style={styles.searchIndicator} />
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Enter at least 2 characters to search. Tap on a medicine to select it.
        </Text>
      </View>

      {/* Results List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={(item) => item.id}
          renderItem={renderMedicineItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            hasSearched ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>No medicines found</Text>
                <Text style={styles.emptySubtext}>Try a different search term</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>💊</Text>
                <Text style={styles.emptyText}>Search for medicines</Text>
                <Text style={styles.emptySubtext}>Enter a medicine name to search</Text>
              </View>
            )
          }
        />
      )}

      {/* Results Count */}
      {medicines.length > 0 && (
        <View style={styles.resultsFooter}>
          <Text style={styles.resultsCount}>
            {medicines.length} medicine{medicines.length !== 1 ? 's' : ''} found
          </Text>
        </View>
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
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  searchIndicator: {
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#0070a9',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsContainer: {
    backgroundColor: '#fff3e0',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  instructionsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
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
  medicineItem: {
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
  medicineIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  medicineIconText: {
    fontSize: 22,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  medicineDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  medicineDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  medicineDetail: {
    fontSize: 12,
    color: '#888',
    marginRight: 15,
  },
  medicineManufacturer: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  selectArrow: {
    fontSize: 24,
    color: '#ccc',
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  resultsFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  resultsCount: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});

export default SearchMedicinesScreen;
