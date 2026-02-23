/**
 * FavouriteICDCPTScreen
 * Favorite ICD/CPT codes management
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../../services/apiService';
import { getStringFromStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID, ORGANIZATION_ID } from '../../constants';

interface FavoriteCode {
  id: string;
  code: string;
  description: string;
  type: 'ICD' | 'CPT';
  group_name?: string;
}

interface FavoriteGroup {
  id: string;
  name: string;
  codes: FavoriteCode[];
  expanded?: boolean;
}

const FavouriteICDCPTScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId, codeType, onSelect } = route.params || {};

  const [groups, setGroups] = useState<FavoriteGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<FavoriteCode[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/getFavoriteCodes', {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        code_type: codeType || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setGroups(data?.groups || data?.favoriteGroups || []);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      Alert.alert('Error', 'Failed to fetch favorite codes');
    } finally {
      setLoading(false);
    }
  }, [codeType]);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleGroupToggle = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleCodeSelect = (code: FavoriteCode) => {
    const isSelected = selectedCodes.some((c) => c.id === code.id);

    if (isSelected) {
      setSelectedCodes(selectedCodes.filter((c) => c.id !== code.id));
    } else {
      setSelectedCodes([...selectedCodes, code]);
    }
  };

  const handleRemoveFavorite = async (code: FavoriteCode) => {
    Alert.alert(
      'Remove Favorite',
      `Remove "${code.code}" from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const sessionId = await getStringFromStorage(SESSION_ID);
              const userId = await getStringFromStorage(USER_ID);

              await apiService.postEncrypted('ApiTiaTeleMD/removeFromFavorites', {
                session_id: sessionId || '',
                user_id: userId || '',
                code_id: code.id,
              });

              fetchFavorites();
            } catch (error) {
              console.error('Error removing favorite:', error);
              Alert.alert('Error', 'Failed to remove from favorites');
            }
          },
        },
      ]
    );
  };

  const handleConfirm = () => {
    if (onSelect && selectedCodes.length > 0) {
      onSelect(selectedCodes);
    }
    navigation.goBack();
  };

  const renderCodeItem = (code: FavoriteCode) => {
    const isSelected = selectedCodes.some((c) => c.id === code.id);

    return (
      <View key={code.id} style={styles.codeItem}>
        <TouchableOpacity
          style={styles.codeContent}
          onPress={() => handleCodeSelect(code)}
        >
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={styles.codeInfo}>
            <Text style={styles.codeText}>{code.code}</Text>
            <Text style={styles.codeDescription} numberOfLines={2}>
              {code.description}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFavorite(code)}
        >
          <Text style={styles.removeIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderGroupItem = ({ item }: { item: FavoriteGroup }) => {
    const isExpanded = expandedGroups[item.id] !== false;

    return (
      <View style={styles.groupContainer}>
        <TouchableOpacity
          style={styles.groupHeader}
          onPress={() => handleGroupToggle(item.id)}
        >
          <View style={styles.groupIcon}>
            <Text style={styles.groupIconText}>📁</Text>
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupCount}>{item.codes.length} codes</Text>
          </View>
          <Text style={[styles.expandIcon, isExpanded && styles.expandIconRotated]}>
            ▼
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.groupCodes}>
            {item.codes.map(renderCodeItem)}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Favorites</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Favorite {codeType || 'ICD/CPT'} Codes
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Selected Count */}
      {selectedCodes.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedText}>
            {selectedCodes.length} code(s) selected
          </Text>
        </View>
      )}

      {/* Groups List */}
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroupItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>★</Text>
            <Text style={styles.emptyText}>No favorite codes</Text>
            <Text style={styles.emptySubtext}>
              Star codes while searching to add them here
            </Text>
          </View>
        }
      />

      {/* Confirm Button */}
      {selectedCodes.length > 0 && onSelect && (
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
  placeholder: {
    width: 50,
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
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 10,
  },
  groupContainer: {
    marginBottom: 10,
  },
  groupHeader: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff3e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupIconText: {
    fontSize: 20,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  groupCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 12,
    color: '#666',
    transform: [{ rotate: '0deg' }],
  },
  expandIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  groupCodes: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 2,
    paddingVertical: 5,
    marginLeft: 52,
  },
  codeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  codeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: '#0070a9',
    borderColor: '#0070a9',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  codeInfo: {
    flex: 1,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  codeDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  removeButton: {
    padding: 8,
  },
  removeIcon: {
    fontSize: 16,
    color: '#f44336',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    color: '#FFD700',
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

export default FavouriteICDCPTScreen;
