/**
 * PatientDetailsScreen
 * Main patient profile screen with tabs for Clinical Assessment, Notes, Medications, etc.
 * Matches Java DashBoardPatientActivity flow
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import apiService from '../../services/apiService';
import { COLORS } from '../../constants';
import { getStringFromStorage } from '../../utils/storage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PatientDetailsRouteProp = RouteProp<RootStackParamList, 'PatientDetails'>;

interface PatientInfo {
  patient_id: string;
  patient_name: string;
  gender: string;
  age: string;
  dob: string;
  mrn: string;
  encounter_id: string;
  visit_type: string;
  admission_date: string;
  room_bed: string;
  attending_physician: string;
  insurance: string;
  allergies: string;
  chief_complaint: string;
  diagnosis: string;
}

const PatientDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PatientDetailsRouteProp>();
  const { patientId, encounterId } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [activeTab, setActiveTab] = useState('demographics');

  useEffect(() => {
    fetchPatientDetails();
  }, [patientId, encounterId]);

  const fetchPatientDetails = async () => {
    setLoading(true);
    try {
      const params = {
        patient_id: patientId,
        encounter_id: encounterId,
      };
      
      const response = await apiService.postEncrypted('ApiTiaTeleMD/getPatientDetails', params);
      
      if (response?.data) {
        const data = response.data;
        setPatientInfo({
          patient_id: data.patient_id || patientId,
          patient_name: data.patient_name || data.pat_name || 'Unknown Patient',
          gender: data.gender || data.sex || '',
          age: data.age || '',
          dob: data.dob || data.date_of_birth || '',
          mrn: data.mrn || data.medical_record_number || '',
          encounter_id: data.encounter_id || encounterId,
          visit_type: data.visit_type || '',
          admission_date: data.admission_date || data.start_datetime || '',
          room_bed: data.room_bed || `${data.room_number || ''} / ${data.bed_number || ''}`,
          attending_physician: data.attending_physician || data.doctor_name || '',
          insurance: data.insurance || data.insurance_name || '',
          allergies: data.allergies || 'None Known',
          chief_complaint: data.chief_complaint || '',
          diagnosis: data.diagnosis || '',
        });
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToModule = (screenName: keyof RootStackParamList) => {
    navigation.navigate(screenName, {
      patientId,
      encounterId,
    } as any);
  };

  const menuItems = [
    { id: 'clinical', title: 'Clinical Assessment', screen: 'ClinicalAssessment' as keyof RootStackParamList, icon: '📋' },
    { id: 'history', title: 'Assessment History', screen: 'AssessmentHistory' as keyof RootStackParamList, icon: '📜' },
    { id: 'forms', title: 'Form Categories', screen: 'FormCategories' as keyof RootStackParamList, icon: '📝' },
    { id: 'stroke', title: 'Stroke Scale', screen: 'StrokeScale' as keyof RootStackParamList, icon: '🧠' },
    { id: 'icd', title: 'ICD / CPT', screen: 'ICDCPT' as keyof RootStackParamList, icon: '🏥' },
    { id: 'notes', title: 'Patient Notes', screen: 'PatientNotes' as keyof RootStackParamList, icon: '📝' },
    { id: 'voice', title: 'Voice Record', screen: 'VoiceRecord' as keyof RootStackParamList, icon: '🎙️' },
    { id: 'medications', title: 'Medications', screen: 'MedicationsLabOrders' as keyof RootStackParamList, icon: '💊' },
    { id: 'prescription', title: 'Add Prescription', screen: 'AddPrescription' as keyof RootStackParamList, icon: '📄' },
    { id: 'upload', title: 'Upload Prescription', screen: 'UploadPrescription' as keyof RootStackParamList, icon: '📤' },
    { id: 'search', title: 'Search Medicines', screen: 'SearchMedicines' as keyof RootStackParamList, icon: '🔍' },
    { id: 'investigations', title: 'Investigations', screen: 'InvestigationsList' as keyof RootStackParamList, icon: '🔬' },
    { id: 'vitals', title: 'Vitals', screen: 'VitalsHistory' as keyof RootStackParamList, icon: '❤️' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading patient details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Patient Info Card */}
        <View style={styles.patientCard}>
          <View style={styles.patientHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {patientInfo?.patient_name?.charAt(0)?.toUpperCase() || 'P'}
              </Text>
            </View>
            <View style={styles.patientMainInfo}>
              <Text style={styles.patientName}>{patientInfo?.patient_name}</Text>
              <Text style={styles.patientSubInfo}>
                {patientInfo?.gender} | {patientInfo?.age} years | MRN: {patientInfo?.mrn}
              </Text>
            </View>
          </View>
          
          <View style={styles.patientDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>DOB:</Text>
              <Text style={styles.detailValue}>{patientInfo?.dob || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Visit Type:</Text>
              <Text style={styles.detailValue}>{patientInfo?.visit_type || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Room/Bed:</Text>
              <Text style={styles.detailValue}>{patientInfo?.room_bed || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Physician:</Text>
              <Text style={styles.detailValue}>{patientInfo?.attending_physician || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Allergies:</Text>
              <Text style={[styles.detailValue, styles.allergiesText]}>{patientInfo?.allergies || 'None Known'}</Text>
            </View>
          </View>
        </View>

        {/* Module Menu Grid */}
        <Text style={styles.sectionTitle}>Clinical Modules</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => navigateToModule(item.screen)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  patientMainInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  patientSubInfo: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  patientDetails: {
    marginTop: 5,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  allergiesText: {
    color: '#e74c3c',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
  },
});

export default PatientDetailsScreen;
