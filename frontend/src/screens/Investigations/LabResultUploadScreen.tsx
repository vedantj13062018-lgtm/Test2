/**
 * LabResultUploadScreen
 * Matches Java lab result upload - upload lab result documents
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import apiService from '../../services/apiService';
import { getStringFromStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID, ORGANIZATION_ID } from '../../constants';

interface DocumentType {
  id: string;
  name: string;
}

const LabResultUploadScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId, investigationId, investigationName } = route.params || {};

  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDocTypeDropdown, setShowDocTypeDropdown] = useState(false);

  const fetchDocumentTypes = useCallback(async () => {
    try {
      setLoading(true);
      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/fetchdocumentTypes', {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setDocumentTypes(data?.documentTypes || data?.types || []);
      }
    } catch (error) {
      console.error('Error fetching document types:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  const handleSelectFromGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        quality: 0.8,
      });

      if (result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const handleSelectDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
      });

      if (result && result.length > 0) {
        setSelectedFile({
          uri: result[0].uri,
          type: result[0].type,
          name: result[0].name,
          fileSize: result[0].size,
        });
      }
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        console.error('Error selecting document:', error);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file to upload');
      return;
    }

    if (!selectedDocType) {
      Alert.alert('Error', 'Please select a document type');
      return;
    }

    try {
      setUploading(true);
      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      // Use the uploadFilesDocWithFiles method from apiService
      const response = await apiService.uploadFilesDocWithFiles(
        [
          {
            uri: selectedFile.uri,
            name: selectedFile.name || selectedFile.fileName || 'file',
            type: selectedFile.type || 'application/octet-stream',
          },
        ],
        {
          notes: notes,
          fileDetails: [
            {
              file_name: selectedFile.name || selectedFile.fileName || 'file',
              file_type: selectedDocType,
              patient_id: patientId || '',
              image_notes: notes,
            },
          ],
        }
      );

      if (response.code === '200' || response.code === '100') {
        Alert.alert('Success', 'File uploaded successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const selectedDocTypeName =
    documentTypes.find((dt) => dt.id === selectedDocType)?.name || 'Select document type';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Result</Text>
        <TouchableOpacity
          onPress={handleUpload}
          style={[styles.saveButton, (!selectedFile || uploading) && styles.saveButtonDisabled]}
          disabled={!selectedFile || uploading}
        >
          <Text style={styles.saveText}>{uploading ? 'Uploading...' : 'Upload'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Investigation Info */}
        {investigationName && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Investigation</Text>
            <Text style={styles.infoValue}>{investigationName}</Text>
          </View>
        )}

        {/* Document Type Dropdown */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Document Type *</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDocTypeDropdown(!showDocTypeDropdown)}
          >
            <Text
              style={[styles.dropdownText, !selectedDocType && styles.dropdownPlaceholder]}
            >
              {selectedDocTypeName}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          {showDocTypeDropdown && (
            <View style={styles.dropdownList}>
              {documentTypes.map((dt) => (
                <TouchableOpacity
                  key={dt.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedDocType(dt.id);
                    setShowDocTypeDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{dt.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about this result..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

        {/* File Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>File *</Text>
          {selectedFile ? (
            <View style={styles.selectedFileContainer}>
              {selectedFile.type?.includes('image') ? (
                <Image source={{ uri: selectedFile.uri }} style={styles.filePreview} />
              ) : (
                <View style={styles.documentPreview}>
                  <Text style={styles.documentIcon}>📄</Text>
                  <Text style={styles.documentName} numberOfLines={2}>
                    {selectedFile.name || selectedFile.fileName || 'Document'}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.removeButton} onPress={handleRemoveFile}>
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.fileSelectionContainer}>
              <TouchableOpacity style={styles.fileButton} onPress={handleSelectFromGallery}>
                <Text style={styles.fileButtonIcon}>🖼️</Text>
                <Text style={styles.fileButtonText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fileButton} onPress={handleTakePhoto}>
                <Text style={styles.fileButtonIcon}>📷</Text>
                <Text style={styles.fileButtonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fileButton} onPress={handleSelectDocument}>
                <Text style={styles.fileButtonIcon}>📁</Text>
                <Text style={styles.fileButtonText}>Document</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {(loading || uploading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>
            {uploading ? 'Uploading...' : 'Loading...'}
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
  saveButton: {
    padding: 5,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0070a9',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownPlaceholder: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 100,
  },
  selectedFileContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filePreview: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  documentPreview: {
    alignItems: 'center',
    marginBottom: 10,
  },
  documentIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  documentName: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  removeButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  fileSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  fileButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '30%',
  },
  fileButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  fileButtonText: {
    fontSize: 12,
    color: '#333',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
});

export default LabResultUploadScreen;
