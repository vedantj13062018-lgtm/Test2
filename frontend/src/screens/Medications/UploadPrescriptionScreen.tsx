/**
 * UploadPrescriptionScreen
 * Matches Java PrescriptionDocumentUploadActivity - Upload prescription documents
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import apiService from '../../services/apiService';
import { getStringFromStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID } from '../../constants';

interface UploadedFile {
  id: string;
  filePath: string;
  fileName: string;
  fileType: string;
  thumbnail?: string;
}

const UploadPrescriptionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId, patientName, doctorId, encounterData, mrn, editMode, prescriptionId } = route.params || {};

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSourcePicker, setShowSourcePicker] = useState(false);

  const handleSelectSource = () => {
    setShowSourcePicker(true);
  };

  const handleCameraCapture = async () => {
    setShowSourcePicker(false);

    try {
      const result: ImagePickerResponse = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: true,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        addFileToList({
          id: String(Date.now()),
          filePath: asset.uri || '',
          fileName: asset.fileName || `photo_${Date.now()}.jpg`,
          fileType: asset.type || 'image/jpeg',
          thumbnail: asset.uri,
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const handleGallerySelect = async () => {
    setShowSourcePicker(false);

    try {
      const result: ImagePickerResponse = await launchImageLibrary({
        mediaType: 'mixed',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const fileType = asset.type || 'application/octet-stream';

        // Validate file type
        if (!['image/jpeg', 'image/png', 'application/pdf'].includes(fileType)) {
          Alert.alert('Invalid File', 'Please select JPEG, PNG images or PDF files only');
          return;
        }

        addFileToList({
          id: String(Date.now()),
          filePath: asset.uri || '',
          fileName: asset.fileName || `file_${Date.now()}`,
          fileType,
          thumbnail: fileType.startsWith('image/') ? asset.uri : undefined,
        });
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const addFileToList = (file: UploadedFile) => {
    setUploadedFiles(prev => [...prev, file]);
  };

  const handleDeleteFile = (id: string) => {
    Alert.alert(
      'Delete File',
      'Are you sure you want to remove this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setUploadedFiles(prev => prev.filter(f => f.id !== id));
          },
        },
      ]
    );
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      Alert.alert('No Files', 'Please add at least one file to upload');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('user_id', userId || '');
      formData.append('session_id', sessionId || '');
      formData.append('patient_id', patientId || '');
      formData.append('doctor_id', doctorId || '');
      formData.append('time_zone', Intl.DateTimeFormat().resolvedOptions().timeZone);
      formData.append('encounter_data', encounterData || '');

      // Add files
      uploadedFiles.forEach((file, index) => {
        formData.append('file_upload[]', {
          uri: file.filePath,
          name: file.fileName,
          type: file.fileType,
        } as any);
      });

      // Simulate progress for demo
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      const response = await apiService.postMultipart('ApiTiaTeleMD/savePrescriptionFiles', formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.code === '200' || response.code === '100') {
        Alert.alert('Success', 'Files uploaded successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to upload files');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload files');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const renderFileItem = ({ item }: { item: UploadedFile }) => (
    <View style={styles.fileItem}>
      <View style={styles.fileThumbnail}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnailImage} />
        ) : (
          <View style={styles.pdfPlaceholder}>
            <Text style={styles.pdfIcon}>📄</Text>
          </View>
        )}
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {item.fileName}
        </Text>
        <Text style={styles.fileType}>
          {item.fileType === 'application/pdf' ? 'PDF Document' : 'Image'}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteFileButton}
        onPress={() => handleDeleteFile(item.id)}
      >
        <Text style={styles.deleteFileText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Prescription</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Patient Info */}
      {patientName && (
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>Patient: {patientName}</Text>
          {mrn && <Text style={styles.patientMrn}>(MRN: {mrn})</Text>}
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Upload Prescription Documents</Text>
        <Text style={styles.instructionsText}>
          You can upload photos of prescriptions or PDF documents.
          Supported formats: JPEG, PNG, PDF
        </Text>
      </View>

      {/* Files List */}
      <FlatList
        data={uploadedFiles}
        keyExtractor={(item) => item.id}
        renderItem={renderFileItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={styles.emptyText}>No files added</Text>
            <Text style={styles.emptySubtext}>Tap + to add a file</Text>
          </View>
        }
      />

      {/* Add Button (FAB) */}
      <TouchableOpacity style={styles.fabButton} onPress={handleSelectSource}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Upload Button */}
      {uploadedFiles.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.uploadButtonText}>{uploadProgress}%</Text>
              </View>
            ) : (
              <Text style={styles.uploadButtonText}>
                {editMode ? 'Update' : 'Upload Files'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Progress Overlay */}
      {uploading && (
        <View style={styles.progressOverlay}>
          <View style={styles.progressCard}>
            <ActivityIndicator size="large" color="#0070a9" />
            <Text style={styles.progressText}>Uploading files...</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{uploadProgress}%</Text>
          </View>
        </View>
      )}

      {/* Source Picker Modal */}
      <Modal
        visible={showSourcePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSourcePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSourcePicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Source</Text>
            <TouchableOpacity style={styles.modalOption} onPress={handleCameraCapture}>
              <Text style={styles.modalOptionIcon}>📷</Text>
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={handleGallerySelect}>
              <Text style={styles.modalOptionIcon}>🖼️</Text>
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, styles.modalCancel]}
              onPress={() => setShowSourcePicker(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  instructionsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  listContent: {
    padding: 10,
    paddingBottom: 150,
  },
  fileItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  fileThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  pdfPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfIcon: {
    fontSize: 28,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  fileType: {
    fontSize: 12,
    color: '#666',
  },
  deleteFileButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteFileText: {
    color: '#f44336',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
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
  },
  fabButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0070a9',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  uploadButton: {
    backgroundColor: '#0070a9',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    width: '80%',
  },
  progressText: {
    fontSize: 16,
    color: '#333',
    marginTop: 15,
    marginBottom: 20,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0070a9',
  },
  progressPercent: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
  },
  modalOptionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalCancel: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    width: '100%',
  },
});

export default UploadPrescriptionScreen;
