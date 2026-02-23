/**
 * My Patients Content Component
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import PatientCard from './PatientCard';
import { DashboardPatient } from '../../types';

interface MyPatientsContentProps {
  patients: DashboardPatient[];
  onPatientPress?: (patient: DashboardPatient) => void;
  onMessagePress?: (patient: DashboardPatient) => void;
  onCalendarPress?: (patient: DashboardPatient) => void;
  onHistoryPress?: (patient: DashboardPatient) => void;
}

const MyPatientsContent: React.FC<MyPatientsContentProps> = ({
  patients,
  onPatientPress,
  onMessagePress,
  onCalendarPress,
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
          <PatientCard
            key={patient.patient_id || patient.patientId || index}
            patient={patient}
            onPress={() => onPatientPress?.(patient)}
            onMessagePress={() => onMessagePress?.(patient)}
            onCalendarPress={() => onCalendarPress?.(patient)}
            onHistoryPress={() => onHistoryPress?.(patient)}
            variant="default"
          />
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

export default MyPatientsContent;
