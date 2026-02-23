/**
 * PatientNotesScreen
 * Matches Java NotesListActivity - Patient notes list view
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
import { SESSION_ID, USER_ID } from '../../constants';

interface Note {
  note_id: string;
  note_type: string;
  note_title: string;
  created_date: string;
  created_by: string;
  content_preview?: string;
  is_signed?: boolean;
}

const PatientNotesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId, patientName, roundId, mrn, consultDate } = route.params || {};

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/getNotes', {
        user_id: userId || '',
        session_id: sessionId || '',
        patient_id: patientId || '',
        round_id: roundId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setNotes(data?.notesDetails || data?.notes || []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      Alert.alert('Error', 'Failed to fetch notes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId, roundId]);

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleAddNote = () => {
    navigation.navigate('NoteTypes', {
      patientId,
      patientName,
      roundId,
      mrn,
      consultDate,
    });
  };

  const handleNotePress = (note: Note) => {
    navigation.navigate('NotesEditor', {
      noteId: note.note_id,
      noteType: note.note_type,
      noteTitle: note.note_title,
      patientId,
      patientName,
      roundId,
      mrn,
      consultDate,
      isView: true,
    });
  };

  const handleDeleteNote = (note: Note) => {
    Alert.alert(
      'Delete Confirmation',
      'Do you want to delete this note?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              const sessionId = await getStringFromStorage(SESSION_ID);
              const userId = await getStringFromStorage(USER_ID);

              const response = await apiService.postEncrypted('ApiTiaTeleMD/deleteNotes', {
                user_id: userId || '',
                session_id: sessionId || '',
                note_id: note.note_id,
              });

              if (response.code === '200' || response.code === '100') {
                fetchNotes();
              } else {
                Alert.alert('Error', response.message || 'Failed to delete note');
              }
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const renderNoteItem = ({ item }: { item: Note }) => (
    <TouchableOpacity style={styles.noteItem} onPress={() => handleNotePress(item)}>
      <View style={styles.noteHeader}>
        <View style={styles.noteTypeContainer}>
          <Text style={styles.noteIcon}>📝</Text>
          <View>
            <Text style={styles.noteType}>{item.note_type}</Text>
            <Text style={styles.noteTitle}>{item.note_title}</Text>
          </View>
        </View>
        {item.is_signed && (
          <View style={styles.signedBadge}>
            <Text style={styles.signedText}>Signed</Text>
          </View>
        )}
      </View>

      {item.content_preview && (
        <Text style={styles.contentPreview} numberOfLines={2}>
          {item.content_preview}
        </Text>
      )}

      <View style={styles.noteFooter}>
        <Text style={styles.noteDate}>{item.created_date}</Text>
        <Text style={styles.noteAuthor}>By: {item.created_by}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNote(item)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
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
        <Text style={styles.headerTitle}>Notes</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Patient Info */}
      {patientName && (
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>Patient: {patientName}</Text>
          {mrn && <Text style={styles.patientMrn}>(MRN: {mrn})</Text>}
        </View>
      )}

      {/* Notes List */}
      {loading && notes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.note_id}
          renderItem={renderNoteItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchNotes();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No notes found</Text>
              <Text style={styles.emptySubtext}>Tap + to add a new note</Text>
            </View>
          }
        />
      )}

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddNote}>
        <Text style={styles.addButtonText}>+ Add Notes</Text>
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
  patientInfo: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  patientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  patientMrn: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
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
  noteItem: {
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
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  noteTypeContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  noteIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  noteType: {
    fontSize: 12,
    color: '#0070a9',
    fontWeight: '500',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  signedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  signedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  contentPreview: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  noteDate: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  noteAuthor: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    color: '#f44336',
    fontSize: 12,
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
  addButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#0070a9',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PatientNotesScreen;
