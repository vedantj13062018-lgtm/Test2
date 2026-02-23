/**
 * FrequencyRouteListScreen
 * Frequency and route selection list for prescriptions
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
import { SESSION_ID, USER_ID } from '../../constants';

interface ListItem {
  id: string;
  name: string;
  value?: string;
  description?: string;
}

type ListType = 'frequency' | 'route';

const FrequencyRouteListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { listType, selectedId, onItemSelected } = route.params || {};

  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string>(selectedId || '');

  const getTitle = (): string => {
    switch (listType as ListType) {
      case 'frequency':
        return 'Select Frequency';
      case 'route':
        return 'Select Route';
      default:
        return 'Select Item';
    }
  };

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      let endpoint = '';
      switch (listType as ListType) {
        case 'frequency':
          endpoint = 'ApiTiaTeleMD/getPrescriptionFrequency';
          break;
        case 'route':
          endpoint = 'ApiTiaTeleMD/getPrescriptionRouteList';
          break;
        default:
          return;
      }

      const response = await apiService.postEncrypted(endpoint, {
        user_id: userId || '',
        session_id: sessionId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        let list: ListItem[] = [];

        switch (listType as ListType) {
          case 'frequency':
            list = (data?.frequencyList || []).map((item: any) => ({
              id: item.id,
              name: item.frequency,
              value: item.frequency_value,
              description: item.description || `${item.frequency_value}x per day`,
            }));
            break;
          case 'route':
            list = (data?.routeList || []).map((item: any) => ({
              id: item.id,
              name: item.name,
              description: item.description,
            }));
            break;
        }

        setItems(list);
      }
    } catch (error) {
      console.error('Error fetching list:', error);
      Alert.alert('Error', 'Failed to load list');
    } finally {
      setLoading(false);
    }
  }, [listType]);

  useEffect(() => {
    fetchList();
  }, []);

  const handleItemSelect = (item: ListItem) => {
    setSelectedItem(item.id);

    if (onItemSelected) {
      onItemSelected(item);
    }

    navigation.goBack();
  };

  const getIconForType = (): string => {
    switch (listType as ListType) {
      case 'frequency':
        return '⏰';
      case 'route':
        return '💉';
      default:
        return '📋';
    }
  };

  const renderItem = ({ item }: { item: ListItem }) => (
    <TouchableOpacity
      style={[styles.listItem, selectedItem === item.id && styles.listItemSelected]}
      onPress={() => handleItemSelect(item)}
    >
      <View style={[styles.itemIcon, selectedItem === item.id && styles.itemIconSelected]}>
        <Text style={styles.itemIconText}>{getIconForType()}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, selectedItem === item.id && styles.itemNameSelected]}>
          {item.name}
        </Text>
        {item.description && (
          <Text style={styles.itemDescription}>{item.description}</Text>
        )}
        {item.value && listType === 'frequency' && (
          <Text style={styles.itemValue}>Times per day: {item.value}</Text>
        )}
      </View>
      {selectedItem === item.id && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getTitle()}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading...</Text>
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
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          {listType === 'frequency'
            ? 'Select how often the medication should be taken'
            : 'Select the administration route for the medication'}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>{getIconForType()}</Text>
            <Text style={styles.emptyText}>No items available</Text>
          </View>
        }
      />
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
  instructionsContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  instructionsText: {
    fontSize: 13,
    color: '#0070a9',
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
  listItem: {
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  listItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#0070a9',
  },
  itemIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemIconSelected: {
    backgroundColor: '#0070a9',
  },
  itemIconText: {
    fontSize: 20,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemNameSelected: {
    color: '#0070a9',
  },
  itemDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  itemValue: {
    fontSize: 12,
    color: '#0070a9',
    marginTop: 4,
    fontWeight: '500',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0070a9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  },
});

export default FrequencyRouteListScreen;
