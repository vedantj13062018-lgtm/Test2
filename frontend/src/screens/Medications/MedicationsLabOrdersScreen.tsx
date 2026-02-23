/**
 * MedicationsLabOrdersScreen
 * Matches Java PrescriptionActivity - Medication orders list view
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

interface MedicationItem {
  id: string;
  medicine_id: string;
  medicine_name: string;
  quantity: string;
  frequency: string;
  duration: string;
  route: string;
  notes: string;
  is_start?: boolean;
}

interface MedicationOrder {
  prescription_id: string;
  order_date: string;
  doctor_name: string;
  status: string;
  items: MedicationItem[];
}

const MedicationsLabOrdersScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId, patientName, roundId, mrn, doctorId, encounterData, editMode, prescriptionId } = route.params || {};

  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchMedicationHistory = useCallback(async () => {
    if (!editMode) return;

    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/getMedicationHistory', {
        user_id: userId || '',
        session_id: sessionId || '',
        patient_id: patientId || '',
        prescription_id: prescriptionId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        const items = data?.medicationItemsList || data?.items || [];
        setMedications(items.map((item: any) => ({
          id: item.id || String(Math.random()),
          medicine_id: item.medicine || item.medicine_id,
          medicine_name: item.itemDescription || item.medicine_name,
          quantity: item.quantity || '',
          frequency: item.frequency || '',
          duration: item.duration || '',
          route: item.route || '',
          notes: item.notes || '',
        })));
      }
    } catch (error) {
      console.error('Error fetching medication history:', error);
      Alert.alert('Error', 'Failed to load medication history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId, prescriptionId, editMode]);

  useEffect(() => {
    if (editMode) {
      fetchMedicationHistory();
    }
  }, []);

  const handleAddMedication = () => {
    navigation.navigate('AddPrescription', {
      patientId,
      patientName,
      doctorId,
      onMedicationAdded: (item: MedicationItem) => {
        setMedications(prev => [...prev, { ...item, id: String(Date.now()) }]);
      },
    });
  };

  const handleEditMedication = (item: MedicationItem, index: number) => {
    navigation.navigate('AddPrescription', {
      patientId,
      patientName,
      doctorId,
      prescriptionData: item,
      position: index,
      onMedicationUpdated: (updatedItem: MedicationItem, pos: number) => {
        setMedications(prev => {
          const updated = [...prev];
          updated[pos] = updatedItem;
          return updated;
        });
      },
    });
  };

  const handleDeleteMedication = (index: number) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to remove this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setMedications(prev => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (medications.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one medication');
      return;
    }

    try {
      setSaving(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      const endpoint = editMode
        ? 'ApiTiaTeleMD/editMedicationOrder'
        : 'ApiTiaTeleMD/addMedicationOrder';

      const params: any = {
        user_id: userId || '',
        session_id: sessionId || '',
        patient_id: patientId || '',
        doctor_id: doctorId || '',
        medications: JSON.stringify(medications),
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        encounter_data: encounterData || '',
      };

      if (editMode && prescriptionId) {
        params.prescription_id = prescriptionId;
      }

      const response = await apiService.postEncrypted(endpoint, params);

      if (response.code === '200' || response.code === '100') {
        Alert.alert('Success', 'Medications saved successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to save medications');
      }
    } catch (error) {
      console.error('Error saving medications:', error);
      Alert.alert('Error', 'Failed to save medications');
    } finally {
      setSaving(false);
    }
  };

  const renderMedicationItem = ({ item, index }: { item: MedicationItem; index: number }) => (
    <View style={styles.medicationItem}>
      <View style={styles.medicationHeader}>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicineName}>{item.medicine_name || 'Unknown Medicine'}</Text>
          <Text style={styles.medicineDetails}>
            {item.frequency && `Frequency: ${item.frequency}`}
            {item.duration && ` | Duration: ${item.duration}`}
          </Text>
        </View>
      </View>

      <View style={styles.medicationDetails}>
        {item.quantity && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>{item.quantity}</Text>
          </View>
        )}
        {item.route && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Route:</Text>
            <Text style={styles.detailValue}>{item.route}</Text>
          </View>
        )}
        {item.notes && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Notes:</Text>
            <Text style={styles.detailValue}>{item.notes}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditMedication(item, index)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteMedication(index)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medications</Text>
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
        <Text style={styles.headerTitle}>Prescription</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Patient Info */}
      {patientName && (
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>Patient: {patientName}</Text>
          {mrn && <Text style={styles.patientMrn}>(MRN: {mrn})</Text>}
        </View>
      )}

      {/* Medications List */}
      <FlatList
        data={medications}
        keyExtractor={(item) => item.id}
        renderItem={renderMedicationItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchMedicationHistory();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💊</Text>
            <Text style={styles.emptyText}>No medications added</Text>
            <Text style={styles.emptySubtext}>Tap + to add a medication</Text>
          </View>
        }
      />

      {/* Add Button (FAB) */}
      <TouchableOpacity style={styles.fabButton} onPress={handleAddMedication}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Save Button */}
      {medications.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {editMode ? 'Update' : 'Save'}
              </Text>
            )}
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
    paddingBottom: 150,
  },
  medicationItem: {
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
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  medicationInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  medicineDetails: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  medicationDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    width: 80,
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  editButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  editButtonText: {
    color: '#0070a9',
    fontSize: 13,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#f44336',
    fontSize: 13,
    fontWeight: '500',
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

export default MedicationsLabOrdersScreen;
