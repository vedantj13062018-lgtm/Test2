/**
 * ICDCPTScreen
 * ICD/CPT code search and selection
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

interface ICDCode {
  id: string;
  code: string;
  description: string;
  type: 'ICD' | 'CPT';
  is_favorite?: boolean;
}

interface ICDGroup {
  id: string;
  name: string;
  codes: ICDCode[];
}

const ICDCPTScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId, onSelect } = route.params || {};

  const [activeTab, setActiveTab] = useState<'ICD' | 'CPT'>('ICD');
  const [searchText, setSearchText] = useState('');
  const [codes, setCodes] = useState<ICDCode[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<ICDCode[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCodes = useCallback(async () => {
    if (!searchText.trim()) {
      setCodes([]);
      return;
    }

    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const endpoint = activeTab === 'ICD'
        ? 'ApiTiaTeleMD/searchICDCodes'
        : 'ApiTiaTeleMD/searchCPTCodes';

      const response = await apiService.postEncrypted(endpoint, {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        search_key: searchText,
        patient_id: patientId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setCodes(data?.codes || data?.results || []);
      }
    } catch (error) {
      console.error('Error searching codes:', error);
      Alert.alert('Error', 'Failed to search codes');
    } finally {
      setLoading(false);
    }
  }, [searchText, activeTab, patientId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCodes();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText, activeTab]);

  const handleCodeSelect = (code: ICDCode) => {
    const isSelected = selectedCodes.some((c) => c.id === code.id);

    if (isSelected) {
      setSelectedCodes(selectedCodes.filter((c) => c.id !== code.id));
    } else {
      setSelectedCodes([...selectedCodes, code]);
    }
  };

  const handleToggleFavorite = async (code: ICDCode) => {
    try {
      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      const endpoint = code.is_favorite
        ? 'ApiTiaTeleMD/removeFromFavorites'
        : 'ApiTiaTeleMD/addToFavorites';

      await apiService.postEncrypted(endpoint, {
        session_id: sessionId || '',
        user_id: userId || '',
        code_id: code.id,
        code_type: activeTab,
      });

      // Update local state
      setCodes(codes.map((c) =>
        c.id === code.id ? { ...c, is_favorite: !c.is_favorite } : c
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleViewFavorites = () => {
    navigation.navigate('FavouriteICDCPT', { patientId, codeType: activeTab });
  };

  const handleConfirm = () => {
    if (onSelect && selectedCodes.length > 0) {
      onSelect(selectedCodes);
    }
    navigation.goBack();
  };

  const renderCodeItem = ({ item }: { item: ICDCode }) => {
    const isSelected = selectedCodes.some((c) => c.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.codeItem, isSelected && styles.codeItemSelected]}
        onPress={() => handleCodeSelect(item)}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.codeInfo}>
          <Text style={styles.codeText}>{item.code}</Text>
          <Text style={styles.codeDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => handleToggleFavorite(item)}
        >
          <Text style={styles.favoriteIcon}>{item.is_favorite ? '★' : '☆'}</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>ICD/CPT Codes</Text>
        <TouchableOpacity onPress={handleViewFavorites} style={styles.favButton}>
          <Text style={styles.favButtonText}>★</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ICD' && styles.tabActive]}
          onPress={() => {
            setActiveTab('ICD');
            setSearchText('');
            setCodes([]);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'ICD' && styles.tabTextActive]}>
            ICD Codes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'CPT' && styles.tabActive]}
          onPress={() => {
            setActiveTab('CPT');
            setSearchText('');
            setCodes([]);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'CPT' && styles.tabTextActive]}>
            CPT Codes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab} codes...`}
          placeholderTextColor="#96969a"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Selected Count */}
      {selectedCodes.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedText}>{selectedCodes.length} code(s) selected</Text>
        </View>
      )}

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
        </View>
      ) : (
        <FlatList
          data={codes}
          keyExtractor={(item) => item.id}
          renderItem={renderCodeItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchText ? 'No codes found' : `Search for ${activeTab} codes`}
              </Text>
            </View>
          }
        />
      )}

      {/* Confirm Button */}
      {selectedCodes.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>
              Add {selectedCodes.length} Code(s)
            </Text>
          </TouchableOpacity>
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
  favButton: {
    padding: 5,
  },
  favButtonText: {
    color: '#FFD700',
    fontSize: 20,
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
  selectedContainer: {
    backgroundColor: '#e3f2fd',
    padding: 10,
  },
  selectedText: {
    color: '#0070a9',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 10,
  },
  codeItem: {
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
  codeItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#0070a9',
    borderWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  codeInfo: {
    flex: 1,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  codeDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  favoriteButton: {
    padding: 8,
  },
  favoriteIcon: {
    fontSize: 24,
    color: '#FFD700',
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
  footer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  confirmButton: {
    backgroundColor: '#0070a9',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ICDCPTScreen;
