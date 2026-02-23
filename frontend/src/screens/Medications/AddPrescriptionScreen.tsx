/**
 * AddPrescriptionScreen
 * Matches Java PatientPrescriptionAddActivity - Add/edit prescription form
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../../services/apiService';
import { getStringFromStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID } from '../../constants';

interface Frequency {
  id: string;
  frequency: string;
  frequency_value: string;
}

interface Route {
  id: string;
  name: string;
}

interface Medicine {
  item: string;
  code?: string;
}

const AddPrescriptionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    patientId,
    patientName,
    doctorId,
    prescriptionData,
    position,
    onMedicationAdded,
    onMedicationUpdated,
  } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [medicineName, setMedicineName] = useState(prescriptionData?.medicine_name || '');
  const [medicineCode, setMedicineCode] = useState(prescriptionData?.medicine_id || '');
  const [quantity, setQuantity] = useState(prescriptionData?.quantity || '');
  const [duration, setDuration] = useState(prescriptionData?.duration || '');
  const [notes, setNotes] = useState(prescriptionData?.notes || '');
  const [startMedication, setStartMedication] = useState(prescriptionData?.is_start || false);

  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [selectedFrequency, setSelectedFrequency] = useState<number>(0);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<number>(prescriptionData?.route_position || 0);
  const [showRoutePicker, setShowRoutePicker] = useState(false);

  const [medicineSearchResults, setMedicineSearchResults] = useState<Medicine[]>([]);
  const [showMedicineResults, setShowMedicineResults] = useState(false);
  const [searchingMedicine, setSearchingMedicine] = useState(false);

  const fetchFrequencies = useCallback(async () => {
    try {
      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/getPrescriptionFrequency', {
        user_id: userId || '',
        session_id: sessionId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        const list = data?.frequencyList || [];
        setFrequencies([{ id: '-1', frequency: '-Select-', frequency_value: '0' }, ...list]);

        // Set initial selection if editing
        if (prescriptionData?.frequency) {
          const idx = list.findIndex((f: Frequency) => f.frequency === prescriptionData.frequency);
          if (idx >= 0) setSelectedFrequency(idx + 1);
        }
      }
    } catch (error) {
      console.error('Error fetching frequencies:', error);
    }
  }, [prescriptionData]);

  const fetchRoutes = useCallback(async () => {
    try {
      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/getPrescriptionRouteList', {
        user_id: userId || '',
        session_id: sessionId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        const list = data?.routeList || [];
        setRoutes([{ id: '-1', name: '-Select-' }, ...list]);

        // Set initial selection if editing
        if (prescriptionData?.route_position) {
          setSelectedRoute(prescriptionData.route_position);
        }
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  }, [prescriptionData]);

  const searchMedicines = async (searchKey: string) => {
    if (searchKey.length < 2) {
      setMedicineSearchResults([]);
      setShowMedicineResults(false);
      return;
    }

    try {
      setSearchingMedicine(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/searchMedicinesList', {
        user_id: userId || '',
        session_id: sessionId || '',
        patient_id: patientId || '',
        doctor_id: doctorId || '',
        search_key: searchKey,
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setMedicineSearchResults(data?.medicinesListArray || []);
        setShowMedicineResults(true);
      }
    } catch (error) {
      console.error('Error searching medicines:', error);
    } finally {
      setSearchingMedicine(false);
    }
  };

  useEffect(() => {
    fetchFrequencies();
    fetchRoutes();
  }, []);

  useEffect(() => {
    // Auto-calculate quantity based on duration and frequency
    if (duration && selectedFrequency > 0 && frequencies[selectedFrequency]) {
      const freqValue = parseInt(frequencies[selectedFrequency].frequency_value || '0', 10);
      const durationValue = parseInt(duration, 10);
      if (!isNaN(freqValue) && !isNaN(durationValue)) {
        setQuantity(String(freqValue * durationValue));
      }
    }
  }, [duration, selectedFrequency, frequencies]);

  const handleMedicineSelect = (medicine: Medicine) => {
    setMedicineName(medicine.item);
    setMedicineCode(medicine.code || medicine.item);
    setShowMedicineResults(false);
    setMedicineSearchResults([]);
  };

  const handleSave = () => {
    if (!duration.trim()) {
      Alert.alert('Validation Error', 'Please enter duration');
      return;
    }

    if (selectedFrequency <= 0) {
      Alert.alert('Validation Error', 'Please select frequency');
      return;
    }

    const medicationItem = {
      medicine_id: medicineCode,
      medicine_name: medicineName,
      quantity,
      frequency: frequencies[selectedFrequency]?.frequency || '',
      duration,
      route: routes[selectedRoute]?.name || '',
      route_position: selectedRoute,
      notes,
      is_start: startMedication,
    };

    if (prescriptionData && onMedicationUpdated) {
      onMedicationUpdated(medicationItem, position);
    } else if (onMedicationAdded) {
      onMedicationAdded(medicationItem);
    }

    navigation.goBack();
  };

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
        <Text style={styles.headerTitle}>Add Prescription</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Medicine Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Medicine Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Search medicine..."
            placeholderTextColor="#999"
            value={medicineName}
            onChangeText={(text) => {
              setMedicineName(text);
              searchMedicines(text);
            }}
          />
          {searchingMedicine && (
            <ActivityIndicator size="small" color="#0070a9" style={styles.searchIndicator} />
          )}
          {showMedicineResults && medicineSearchResults.length > 0 && (
            <View style={styles.searchResults}>
              {medicineSearchResults.map((medicine, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.searchResultItem}
                  onPress={() => handleMedicineSelect(medicine)}
                >
                  <Text style={styles.searchResultText}>{medicine.item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Frequency Picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Frequency</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowFrequencyPicker(!showFrequencyPicker)}
          >
            <Text style={styles.pickerButtonText}>
              {frequencies[selectedFrequency]?.frequency || '-Select-'}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
          {showFrequencyPicker && (
            <View style={styles.pickerOptions}>
              {frequencies.map((freq, index) => (
                <TouchableOpacity
                  key={freq.id}
                  style={[
                    styles.pickerOption,
                    selectedFrequency === index && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedFrequency(index);
                    setShowFrequencyPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedFrequency === index && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {freq.frequency}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Duration */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Duration (days)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter duration..."
            placeholderTextColor="#999"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
          />
        </View>

        {/* Quantity (auto-calculated) */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Quantity</Text>
          <TextInput
            style={[styles.input, styles.inputReadonly]}
            placeholder="Auto-calculated..."
            placeholderTextColor="#999"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
          <Text style={styles.inputHint}>Auto-calculated from frequency × duration</Text>
        </View>

        {/* Route Picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Route</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowRoutePicker(!showRoutePicker)}
          >
            <Text style={styles.pickerButtonText}>
              {routes[selectedRoute]?.name || '-Select-'}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
          {showRoutePicker && (
            <View style={styles.pickerOptions}>
              {routes.map((rt, index) => (
                <TouchableOpacity
                  key={rt.id}
                  style={[
                    styles.pickerOption,
                    selectedRoute === index && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedRoute(index);
                    setShowRoutePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedRoute === index && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {rt.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Notes/Directions</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Enter notes or directions..."
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Start Medication Checkbox */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setStartMedication(!startMedication)}
        >
          <View style={[styles.checkbox, startMedication && styles.checkboxChecked]}>
            {startMedication && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Start medication immediately</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save & Close</Text>
        </TouchableOpacity>
      </View>
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
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputReadonly: {
    backgroundColor: '#f9f9f9',
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  searchIndicator: {
    position: 'absolute',
    right: 15,
    top: 40,
  },
  searchResults: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 5,
    maxHeight: 200,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultText: {
    fontSize: 14,
    color: '#333',
  },
  pickerButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#333',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#666',
  },
  pickerOptions: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 5,
    maxHeight: 200,
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#333',
  },
  pickerOptionTextSelected: {
    color: '#0070a9',
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#0070a9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#0070a9',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
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
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddPrescriptionScreen;
