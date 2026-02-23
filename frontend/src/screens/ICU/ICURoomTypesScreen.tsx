/**
 * ICURoomTypesScreen
 * Matches Java IcuList_FilterActivity - Filter ICU list by room/bed type
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiService from '../../services/apiService';
import { getStringFromStorage, saveStringToStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID, ORGANIZATION_ID } from '../../constants';

interface RoomType {
  id: string;
  name: string;
}

interface BedType {
  id: string;
  name: string;
}

const ICURoomTypesScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(false);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [bedTypes, setBedTypes] = useState<BedType[]>([]);

  const [patientName, setPatientName] = useState('');
  const [fin, setFin] = useState('');
  const [mrn, setMrn] = useState('');
  const [admitDate, setAdmitDate] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [selectedBedType, setSelectedBedType] = useState('');

  const fetchFilterOptions = useCallback(async () => {
    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      // Load saved filter values
      const savedPatientName = await getStringFromStorage('filter_icu_patient_name');
      const savedFIN = await getStringFromStorage('filter_icu_fin');
      const savedMRN = await getStringFromStorage('filter_icu_mrn');
      const savedAdmitDate = await getStringFromStorage('filter_icu_admit_date');
      const savedRoomType = await getStringFromStorage('filter_icu_room_type');
      const savedBedType = await getStringFromStorage('filter_icu_bed_type');

      if (savedPatientName) setPatientName(savedPatientName);
      if (savedFIN) setFin(savedFIN);
      if (savedMRN) setMrn(savedMRN);
      if (savedAdmitDate) setAdmitDate(savedAdmitDate);
      if (savedRoomType) setSelectedRoomType(savedRoomType);
      if (savedBedType) setSelectedBedType(savedBedType);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/getIcuFilterOptions', {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setRoomTypes(data?.roomTypes || data?.room_types || []);
        setBedTypes(data?.bedTypes || data?.bed_types || []);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const handleApplyFilter = async () => {
    try {
      await saveStringToStorage('filter_icu_patient_name', patientName);
      await saveStringToStorage('filter_icu_fin', fin);
      await saveStringToStorage('filter_icu_mrn', mrn);
      await saveStringToStorage('filter_icu_admit_date', admitDate);
      await saveStringToStorage('filter_icu_room_type', selectedRoomType);
      await saveStringToStorage('filter_icu_bed_type', selectedBedType);
      await saveStringToStorage('is_icu_filter_enabled', 'true');

      navigation.goBack();
    } catch (error) {
      console.error('Error saving filters:', error);
      Alert.alert('Error', 'Failed to save filters');
    }
  };

  const handleClearFilter = async () => {
    try {
      setPatientName('');
      setFin('');
      setMrn('');
      setAdmitDate('');
      setSelectedRoomType('');
      setSelectedBedType('');

      await saveStringToStorage('filter_icu_patient_name', '');
      await saveStringToStorage('filter_icu_fin', '');
      await saveStringToStorage('filter_icu_mrn', '');
      await saveStringToStorage('filter_icu_admit_date', '');
      await saveStringToStorage('filter_icu_room_type', '');
      await saveStringToStorage('filter_icu_bed_type', '');
      await saveStringToStorage('is_icu_filter_enabled', 'false');

      navigation.goBack();
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ICU Filter</Text>
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
        <Text style={styles.headerTitle}>ICU Filter</Text>
        <TouchableOpacity onPress={handleClearFilter} style={styles.clearButton}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Patient Name */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Patient Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter patient name"
            placeholderTextColor="#999"
            value={patientName}
            onChangeText={setPatientName}
          />
        </View>

        {/* FIN */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>FIN</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter FIN"
            placeholderTextColor="#999"
            value={fin}
            onChangeText={setFin}
          />
        </View>

        {/* MRN */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>MRN</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter MRN"
            placeholderTextColor="#999"
            value={mrn}
            onChangeText={setMrn}
          />
        </View>

        {/* Admit Date */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Admit Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              Alert.alert('Date Picker', 'Date picker would open here');
            }}
          >
            <Text style={admitDate ? styles.dateValue : styles.datePlaceholder}>
              {admitDate || 'Select date'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Room Type */}
        {roomTypes.length > 0 && (
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Room Type</Text>
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedRoomType === '' && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedRoomType('')}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedRoomType === '' && styles.optionTextSelected,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {roomTypes.map((room) => (
                <TouchableOpacity
                  key={room.id}
                  style={[
                    styles.optionButton,
                    selectedRoomType === room.id && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelectedRoomType(room.id)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedRoomType === room.id && styles.optionTextSelected,
                    ]}
                  >
                    {room.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Bed Type */}
        {bedTypes.length > 0 && (
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Bed Type</Text>
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedBedType === '' && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedBedType('')}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedBedType === '' && styles.optionTextSelected,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {bedTypes.map((bed) => (
                <TouchableOpacity
                  key={bed.id}
                  style={[
                    styles.optionButton,
                    selectedBedType === bed.id && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelectedBedType(bed.id)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedBedType === bed.id && styles.optionTextSelected,
                    ]}
                  >
                    {bed.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilter}>
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
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
  clearButton: {
    padding: 5,
  },
  clearText: {
    color: '#fff',
    fontSize: 14,
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
  content: {
    flex: 1,
    padding: 15,
  },
  filterSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  dateButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateValue: {
    fontSize: 14,
    color: '#333',
  },
  datePlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  optionButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionButtonSelected: {
    backgroundColor: '#0070a9',
    borderColor: '#0070a9',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextSelected: {
    color: '#fff',
  },
  footer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  applyButton: {
    backgroundColor: '#0070a9',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ICURoomTypesScreen;
