/**
 * Shared Patient Card Component
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { DashboardPatient } from '../../types';

interface PatientCardProps {
  patient: DashboardPatient;
  onPress?: () => void;
  onMessagePress?: () => void;
  onCalendarPress?: () => void;
  onHistoryPress?: () => void;
  onExpandPress?: () => void;
  showExpandIcon?: boolean;
  variant?: 'default' | 'rounding' | 'appointment';
}

const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onPress,
  onMessagePress,
  onCalendarPress,
  onHistoryPress,
  onExpandPress,
  showExpandIcon = true,
  variant = 'default',
}) => {
  const getPatientName = () => {
    if (patient.patient_name) return patient.patient_name;
    if (patient.patientName) return patient.patientName;
    const firstName = patient.firstName || patient.first_name || '';
    const middleName = patient.middleName || patient.middle_name || '';
    const lastName = patient.lastName || patient.last_name || '';
    return [firstName, middleName, lastName].filter(Boolean).join(' ').trim() || 'N/A';
  };

  const getDOB = () => {
    return patient.dob || patient.patient_dob || '';
  };

  const getMRN = () => {
    return patient.mrn || '';
  };

  const getAttendingPhysician = () => {
    return patient.attending_physician || patient.attendingphysician || '';
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Left: Patient Icon */}
      <View style={styles.patientIconContainer}>
        <View style={styles.patientIcon}>
          <Text style={styles.patientIconText}>👤</Text>
        </View>
      </View>

      {/* Center: Patient Info */}
      <View style={styles.patientInfoContainer}>
        <Text style={styles.patientName}>{getPatientName()}</Text>
        {getDOB() && (
          <Text style={styles.patientDetail}>DOB : {getDOB()}</Text>
        )}
        {getMRN() && (
          <Text style={styles.patientDetail}>MRN : {getMRN()}</Text>
        )}
        {patient.date && (
          <Text style={styles.patientDetail}>Date : {patient.date}</Text>
        )}
        {patient.patient_type && (
          <Text style={styles.patientDetail}>Patient Type : {patient.patient_type}</Text>
        )}
        {getAttendingPhysician() && (
          <Text style={styles.patientDetail}>Attending Physician : {getAttendingPhysician()}</Text>
        )}
      </View>

      {/* Right: Action Icons */}
      <View style={styles.actionIconsContainer}>
        {onMessagePress && (
          <TouchableOpacity style={styles.actionIcon} onPress={onMessagePress}>
            <Image
              source={require('../../../assets/images/mailbox.png')}
              style={styles.actionIconImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
        {onCalendarPress && (
          <TouchableOpacity style={styles.actionIcon} onPress={onCalendarPress}>
            <View style={styles.calendarCheckContainer}>
              <Image
                source={require('../../../assets/images/background_appointment.png')}
                style={styles.calendarIcon}
                resizeMode="contain"
              />
              <View style={styles.checkmarkOverlay}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        {onHistoryPress && (
          <TouchableOpacity style={styles.actionIcon} onPress={onHistoryPress}>
            <View style={styles.calendarRefreshContainer}>
              <Image
                source={require('../../../assets/images/background_appointment.png')}
                style={styles.calendarIcon}
                resizeMode="contain"
              />
              <View style={styles.refreshOverlay}>
                <Text style={styles.refreshText}>↻</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        {showExpandIcon && onExpandPress && (
          <TouchableOpacity style={styles.actionIcon} onPress={onExpandPress}>
            <Image
              source={require('../../../assets/images/rl_down.png')}
              style={styles.actionIconImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 5,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  patientIconContainer: {
    marginRight: 15,
  },
  patientIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0070a9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientIconText: {
    fontSize: 24,
    color: '#ffffff',
  },
  patientInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Montserrat',
    marginBottom: 4,
  },
  patientDetail: {
    fontSize: 14,
    color: '#96969a',
    fontFamily: 'Montserrat',
    marginBottom: 2,
  },
  actionIconsContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  actionIcon: {
    marginBottom: 8,
    padding: 4,
  },
  actionIconImage: {
    width: 20,
    height: 20,
    tintColor: '#0070a9',
  },
  calendarCheckContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarRefreshContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIcon: {
    width: 20,
    height: 20,
    tintColor: '#0070a9',
  },
  checkmarkOverlay: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00ff00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  checkmarkText: {
    fontSize: 8,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  refreshOverlay: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0070a9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  refreshText: {
    fontSize: 8,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default PatientCard;
