/**
 * Patient List Content Component
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import PatientCard from './PatientCard';
import { DashboardPatient } from '../../types';

interface PatientListContentProps {
  patients: DashboardPatient[];
  onPatientPress?: (patient: DashboardPatient) => void;
  onMessagePress?: (patient: DashboardPatient) => void;
  onAddToRoundingPress?: (patient: DashboardPatient) => void;
  onHistoryPress?: (patient: DashboardPatient) => void;
}

const PatientListContent: React.FC<PatientListContentProps> = ({
  patients,
  onPatientPress,
  onMessagePress,
  onAddToRoundingPress,
  onHistoryPress,
}) => {
  if (patients.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No patients found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.listContainer}>
        {patients.map((patient, index) => (
          <View key={patient.patient_id || patient.patientId || index} style={styles.cardWrapper}>
            <PatientCard
              patient={patient}
              onPress={() => onPatientPress?.(patient)}
              onMessagePress={() => onMessagePress?.(patient)}
              onHistoryPress={() => onHistoryPress?.(patient)}
              variant="default"
            />
            {onAddToRoundingPress && (
              <TouchableOpacity
                style={styles.addToRoundingButton}
                onPress={() => onAddToRoundingPress(patient)}
              >
                <Text style={styles.addToRoundingButtonText}>Add To Rounding List</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingTop: 10,
  },
  cardWrapper: {
    marginBottom: 10,
  },
  addToRoundingButton: {
    backgroundColor: '#00a0c3',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10,
    alignItems: 'center',
  },
  addToRoundingButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#96969a',
    fontFamily: 'Montserrat',
  },
});

export default PatientListContent;
