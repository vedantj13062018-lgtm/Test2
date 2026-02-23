/**
 * InvestigationTypesScreen
 * Matches Java investigation type selection - searchable list of investigation types
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../../services/apiService';
import { getStringFromStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID, ORGANIZATION_ID } from '../../constants';

interface InvestigationType {
  id: string;
  name: string;
  category?: string;
  code?: string;
}

const InvestigationTypesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId, patientName, investigationType } = route.params || {};

  const [types, setTypes] = useState<InvestigationType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<InvestigationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const fetchInvestigationTypes = useCallback(async () => {
    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const response = await apiService.postEncrypted(
        'ApiTiaTeleMD/getInvestigationTypes',
        {
          session_id: sessionId || '',
          user_id: userId || '',
          organization_id: orgId || '',
          investigation_type: investigationType || 'laboratory',
        }
      );

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        const typesList = data?.investigationTypes || data?.types || [];
        setTypes(typesList);
        setFilteredTypes(typesList);
      }
    } catch (error) {
      console.error('Error fetching investigation types:', error);
      Alert.alert('Error', 'Failed to load investigation types');
    } finally {
      setLoading(false);
    }
  }, [investigationType]);

  useEffect(() => {
    fetchInvestigationTypes();
  }, []);

  useEffect(() => {
    if (searchText) {
      const filtered = types.filter(
        (type) =>
          type.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (type.code && type.code.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredTypes(filtered);
    } else {
      setFilteredTypes(types);
    }
  }, [searchText, types]);

  const handleTypeSelect = (typeId: string) => {
    setSelectedTypes((prev) => {
      if (prev.includes(typeId)) {
        return prev.filter((id) => id !== typeId);
      }
      return [...prev, typeId];
    });
  };

  const handleAddInvestigation = async () => {
    if (selectedTypes.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one investigation type');
      return;
    }

    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const selectedItems = types.filter((t) => selectedTypes.includes(t.id));
      const investigationData = selectedItems.map((item) => ({
        investigation_type_id: item.id,
        investigation_name: item.name,
      }));

      const response = await apiService.postEncrypted('ApiTiaTeleMD/addInvestigation', {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        patient_id: patientId || '',
        investigations: JSON.stringify(investigationData),
      });

      if (response.code === '200' || response.code === '100') {
        Alert.alert('Success', 'Investigation added successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to add investigation');
      }
    } catch (error) {
      console.error('Error adding investigation:', error);
      Alert.alert('Error', 'Failed to add investigation');
    } finally {
      setLoading(false);
    }
  };

  const renderTypeItem = ({ item }: { item: InvestigationType }) => {
    const isSelected = selectedTypes.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.typeItem, isSelected && styles.typeItemSelected]}
        onPress={() => handleTypeSelect(item.id)}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.typeInfo}>
          <Text style={styles.typeName}>{item.name}</Text>
          {item.code && <Text style={styles.typeCode}>Code: {item.code}</Text>}
          {item.category && <Text style={styles.typeCategory}>{item.category}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {investigationType === 'radiology' ? 'Radiology Types' : 'Laboratory Types'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search investigation types..."
          placeholderTextColor="#96969a"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Selection Count */}
      {selectedTypes.length > 0 && (
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>{selectedTypes.length} item(s) selected</Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTypes}
          keyExtractor={(item) => item.id}
          renderItem={renderTypeItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No investigation types found</Text>
            </View>
          }
        />
      )}

      {/* Add Button */}
      {selectedTypes.length > 0 && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddInvestigation}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>
            Add Selected ({selectedTypes.length})
          </Text>
        </TouchableOpacity>
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
  selectionInfo: {
    backgroundColor: '#e3f2fd',
    padding: 10,
  },
  selectionText: {
    color: '#0070a9',
    fontSize: 14,
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
  typeItem: {
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
  typeItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#0070a9',
    borderWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#0070a9',
    borderColor: '#0070a9',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  typeCode: {
    fontSize: 12,
    color: '#666',
  },
  typeCategory: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
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
  addButton: {
    backgroundColor: '#0070a9',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InvestigationTypesScreen;
