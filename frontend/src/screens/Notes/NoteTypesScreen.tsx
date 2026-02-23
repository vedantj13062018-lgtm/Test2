/**
 * NoteTypesScreen
 * Note type selection dialog/screen
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

interface NoteType {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  template_id?: string;
}

const NoteTypesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId, patientName, roundId, mrn, consultDate } = route.params || {};

  const [noteTypes, setNoteTypes] = useState<NoteType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNoteTypes = useCallback(async () => {
    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/getNotesTypes', {
        user_id: userId || '',
        session_id: sessionId || '',
        patient_id: patientId || '',
        round_id: roundId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setNoteTypes(data?.notesDetails || data?.noteTypes || []);
      }
    } catch (error) {
      console.error('Error fetching note types:', error);
      Alert.alert('Error', 'Failed to fetch note types');
    } finally {
      setLoading(false);
    }
  }, [patientId, roundId]);

  useEffect(() => {
    fetchNoteTypes();
  }, []);

  const handleTypeSelect = (noteType: NoteType) => {
    navigation.navigate('NotesEditor', {
      noteTypeId: noteType.id,
      noteTypeName: noteType.name,
      templateId: noteType.template_id,
      patientId,
      patientName,
      roundId,
      mrn,
      consultDate,
      isCreate: true,
    });
  };

  const getIconForType = (type: string): string => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('progress')) return '📋';
    if (typeLower.includes('admission')) return '🏥';
    if (typeLower.includes('discharge')) return '🚪';
    if (typeLower.includes('consultation')) return '💬';
    if (typeLower.includes('procedure')) return '⚕️';
    if (typeLower.includes('operative')) return '🔬';
    return '📝';
  };

  const renderNoteTypeItem = ({ item }: { item: NoteType }) => (
    <TouchableOpacity style={styles.typeItem} onPress={() => handleTypeSelect(item)}>
      <View style={styles.typeIcon}>
        <Text style={styles.typeIconText}>{item.icon || getIconForType(item.name)}</Text>
      </View>
      <View style={styles.typeInfo}>
        <Text style={styles.typeName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.typeDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
      <Text style={styles.typeArrow}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Note Type</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading note types...</Text>
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
        <Text style={styles.headerTitle}>Select Note Type</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Note Types List */}
      <FlatList
        data={noteTypes}
        keyExtractor={(item) => item.id}
        renderItem={renderNoteTypeItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No note types available</Text>
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
  typeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  typeIconText: {
    fontSize: 24,
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  typeDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
  typeArrow: {
    fontSize: 20,
    color: '#999',
    marginLeft: 10,
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

export default NoteTypesScreen;
