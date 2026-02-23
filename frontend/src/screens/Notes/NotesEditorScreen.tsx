/**
 * NotesEditorScreen
 * Note creation and editing with rich text support
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../../services/apiService';
import { getStringFromStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID } from '../../constants';

const NotesEditorScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    noteId,
    noteTypeId,
    noteTypeName,
    noteTitle: initialTitle,
    templateId,
    patientId,
    patientName,
    roundId,
    mrn,
    consultDate,
    isCreate,
    isView,
  } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteTitle, setNoteTitle] = useState(initialTitle || noteTypeName || '');
  const [noteContent, setNoteContent] = useState('');
  const [templateContent, setTemplateContent] = useState('');

  const fetchNoteDetails = useCallback(async () => {
    if (!noteId) return;

    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/getNoteDetails', {
        user_id: userId || '',
        session_id: sessionId || '',
        note_id: noteId,
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setNoteTitle(data?.note_title || data?.title || '');
        setNoteContent(data?.note_content || data?.content || '');
      }
    } catch (error) {
      console.error('Error fetching note:', error);
      Alert.alert('Error', 'Failed to load note');
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  const fetchTemplate = useCallback(async () => {
    if (!templateId && !noteTypeId) return;

    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/getNoteTemplate', {
        user_id: userId || '',
        session_id: sessionId || '',
        template_id: templateId || '',
        note_type_id: noteTypeId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setTemplateContent(data?.template_content || data?.content || '');
        if (!noteContent) {
          setNoteContent(data?.template_content || data?.content || '');
        }
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    } finally {
      setLoading(false);
    }
  }, [templateId, noteTypeId]);

  useEffect(() => {
    if (noteId) {
      fetchNoteDetails();
    } else if (isCreate) {
      fetchTemplate();
    }
  }, []);

  const handleVoiceRecord = () => {
    navigation.navigate('VoiceRecord', {
      onTextReceived: (text: string) => {
        setNoteContent((prev) => prev + ' ' + text);
      },
    });
  };

  const handleSave = async () => {
    if (!noteContent.trim()) {
      Alert.alert('Validation Error', 'Please enter note content');
      return;
    }

    try {
      setSaving(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      const endpoint = noteId ? 'ApiTiaTeleMD/updateNote' : 'ApiTiaTeleMD/saveNote';

      const response = await apiService.postEncrypted(endpoint, {
        user_id: userId || '',
        session_id: sessionId || '',
        patient_id: patientId || '',
        round_id: roundId || '',
        note_id: noteId || '',
        note_type_id: noteTypeId || '',
        note_title: noteTitle,
        note_content: noteContent,
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (response.code === '200' || response.code === '100') {
        Alert.alert('Success', 'Note saved successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    navigation.navigate('NotesWebView', {
      noteTitle,
      noteContent,
      patientName,
      mrn,
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Note</Text>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isView ? 'View Note' : isCreate ? 'New Note' : 'Edit Note'}</Text>
        {!isView && (
          <TouchableOpacity onPress={handlePreview} style={styles.previewButton}>
            <Text style={styles.previewText}>Preview</Text>
          </TouchableOpacity>
        )}
        {isView && <View style={styles.placeholder} />}
      </View>

      {/* Patient Info */}
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{patientName}</Text>
        {mrn && <Text style={styles.patientMrn}>MRN: {mrn}</Text>}
      </View>

      <ScrollView style={styles.content}>
        {/* Note Title */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Note Title</Text>
          <TextInput
            style={[styles.titleInput, isView && styles.inputDisabled]}
            placeholder="Enter note title..."
            placeholderTextColor="#999"
            value={noteTitle}
            onChangeText={setNoteTitle}
            editable={!isView}
          />
        </View>

        {/* Note Content */}
        <View style={styles.inputContainer}>
          <View style={styles.contentHeader}>
            <Text style={styles.inputLabel}>Note Content</Text>
            {!isView && (
              <TouchableOpacity style={styles.voiceButton} onPress={handleVoiceRecord}>
                <Text style={styles.voiceIcon}>🎤</Text>
                <Text style={styles.voiceText}>Voice</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={[styles.contentInput, isView && styles.inputDisabled]}
            placeholder="Enter note content..."
            placeholderTextColor="#999"
            value={noteContent}
            onChangeText={setNoteContent}
            multiline
            textAlignVertical="top"
            editable={!isView}
          />
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      {!isView && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Note</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
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
  previewButton: {
    padding: 5,
  },
  previewText: {
    color: '#fff',
    fontSize: 14,
  },
  placeholder: {
    width: 50,
  },
  patientInfo: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  patientMrn: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
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
  content: {
    flex: 1,
    padding: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  voiceIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  voiceText: {
    fontSize: 12,
    color: '#0070a9',
    fontWeight: '500',
  },
  contentInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 300,
    lineHeight: 22,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  footer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#0070a9',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NotesEditorScreen;
