/**
 * DicomSeriesViewerScreen
 * Matches Java DICOM series viewer - displays series within a study
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
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../../services/apiService';
import { getStringFromStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID, ORGANIZATION_ID } from '../../constants';

const { width } = Dimensions.get('window');
const THUMBNAIL_SIZE = (width - 40) / 3;

interface DicomSeries {
  series_id: string;
  series_uid: string;
  series_description: string;
  modality: string;
  image_count: number;
  thumbnail_url?: string;
  series_number?: number;
}

interface DicomImage {
  image_id: string;
  image_url: string;
  instance_number: number;
}

const DicomSeriesViewerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId, studyId, studyUid, studyDescription } = route.params || {};

  const [series, setSeries] = useState<DicomSeries[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<DicomSeries | null>(null);
  const [images, setImages] = useState<DicomImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchSeries = useCallback(async () => {
    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const response = await apiService.postEncrypted('getSeriesList', {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        patient_id: patientId || '',
        study_uid: studyUid || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        const seriesList = data?.series || data?.seriesList || [];
        setSeries(seriesList);
        if (seriesList.length > 0) {
          setSelectedSeries(seriesList[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching series:', error);
      Alert.alert('Error', 'Failed to fetch DICOM series');
    } finally {
      setLoading(false);
    }
  }, [patientId, studyUid]);

  const fetchImages = useCallback(async (seriesUid: string) => {
    try {
      setLoadingImages(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      // This would typically fetch the images for the selected series
      // For now, we'll create placeholder data
      const placeholderImages: DicomImage[] = Array.from({ length: 10 }, (_, i) => ({
        image_id: `img_${i}`,
        image_url: `https://placeholder.com/dicom/${seriesUid}/${i}`,
        instance_number: i + 1,
      }));

      setImages(placeholderImages);
      setCurrentImageIndex(0);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoadingImages(false);
    }
  }, []);

  useEffect(() => {
    fetchSeries();
  }, []);

  useEffect(() => {
    if (selectedSeries) {
      fetchImages(selectedSeries.series_uid);
    }
  }, [selectedSeries]);

  const handleSeriesSelect = (item: DicomSeries) => {
    setSelectedSeries(item);
  };

  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const renderSeriesItem = ({ item }: { item: DicomSeries }) => {
    const isSelected = selectedSeries?.series_id === item.series_id;
    return (
      <TouchableOpacity
        style={[styles.seriesItem, isSelected && styles.seriesItemSelected]}
        onPress={() => handleSeriesSelect(item)}
      >
        <View style={styles.seriesThumbnail}>
          {item.thumbnail_url ? (
            <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnailImage} />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Text style={styles.placeholderText}>{item.modality}</Text>
            </View>
          )}
        </View>
        <Text style={styles.seriesDescription} numberOfLines={2}>
          {item.series_description || `Series ${item.series_number || ''}`}
        </Text>
        <Text style={styles.imageCount}>{item.image_count} images</Text>
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {studyDescription || 'DICOM Viewer'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading series...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Series List */}
          <View style={styles.seriesListContainer}>
            <Text style={styles.sectionTitle}>Series ({series.length})</Text>
            <FlatList
              data={series}
              keyExtractor={(item) => item.series_id || item.series_uid}
              renderItem={renderSeriesItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.seriesListContent}
            />
          </View>

          {/* Image Viewer */}
          <View style={styles.imageViewerContainer}>
            {loadingImages ? (
              <View style={styles.imageLoading}>
                <ActivityIndicator size="large" color="#0070a9" />
              </View>
            ) : images.length > 0 ? (
              <>
                <View style={styles.imageViewer}>
                  <View style={styles.dicomImagePlaceholder}>
                    <Text style={styles.dicomImageText}>
                      DICOM Image {currentImageIndex + 1}
                    </Text>
                    <Text style={styles.dicomImageSubtext}>
                      {selectedSeries?.series_description}
                    </Text>
                  </View>
                </View>
                <View style={styles.imageControls}>
                  <TouchableOpacity
                    style={[styles.navButton, currentImageIndex === 0 && styles.navButtonDisabled]}
                    onPress={handlePreviousImage}
                    disabled={currentImageIndex === 0}
                  >
                    <Text style={styles.navButtonText}>‹ Previous</Text>
                  </TouchableOpacity>
                  <Text style={styles.imageCounter}>
                    {currentImageIndex + 1} / {images.length}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      currentImageIndex === images.length - 1 && styles.navButtonDisabled,
                    ]}
                    onPress={handleNextImage}
                    disabled={currentImageIndex === images.length - 1}
                  >
                    <Text style={styles.navButtonText}>Next ›</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.noImagesContainer}>
                <Text style={styles.noImagesText}>No images available</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
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
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
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
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  seriesListContainer: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  seriesListContent: {
    paddingHorizontal: 10,
  },
  seriesItem: {
    width: 100,
    marginHorizontal: 5,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#3a3a3a',
  },
  seriesItemSelected: {
    backgroundColor: '#0070a9',
  },
  seriesThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4a4a4a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  seriesDescription: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 4,
  },
  imageCount: {
    color: '#aaa',
    fontSize: 10,
  },
  imageViewerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dicomImagePlaceholder: {
    width: width - 40,
    height: width - 40,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  dicomImageText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dicomImageSubtext: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 8,
  },
  imageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    width: '100%',
  },
  navButton: {
    backgroundColor: '#0070a9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navButtonDisabled: {
    backgroundColor: '#4a4a4a',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  imageCounter: {
    color: '#fff',
    fontSize: 16,
  },
  noImagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImagesText: {
    color: '#aaa',
    fontSize: 16,
  },
});

export default DicomSeriesViewerScreen;
