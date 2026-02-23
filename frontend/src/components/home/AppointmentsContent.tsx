/**
 * Appointments Content Component
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch } from 'react-native';
import { DashboardPatient } from '../../types';

interface AppointmentsContentProps {
  appointments: DashboardPatient[];
  currentDate: string;
  onDatePrev?: () => void;
  onDateNext?: () => void;
  onShowOnHoldToggle?: (value: boolean) => void;
  showOnHold?: boolean;
  onOrganizationToggle?: (value: boolean) => void;
  organizationName?: string;
  onPatientPress?: (appointment: DashboardPatient) => void;
  onViewDetailsPress?: (appointment: DashboardPatient) => void;
  onMessagePress?: (appointment: DashboardPatient) => void;
  onChatPress?: (appointment: DashboardPatient) => void;
  onInAppCallPress?: (appointment: DashboardPatient) => void;
  onCellCallPress?: (appointment: DashboardPatient) => void;
  onViewEHRPress?: (appointment: DashboardPatient) => void;
  onEmailVideoLinkPress?: (appointment: DashboardPatient) => void;
  onCopyVideoLinkPress?: (appointment: DashboardPatient) => void;
  onReschedulePress?: (appointment: DashboardPatient) => void;
  onCancelPress?: (appointment: DashboardPatient) => void;
}

const AppointmentsContent: React.FC<AppointmentsContentProps> = ({
  appointments,
  currentDate,
  onDatePrev,
  onDateNext,
  onShowOnHoldToggle,
  showOnHold = false,
  onOrganizationToggle,
  organizationName = 'TiaTele_Organisation',
  onPatientPress,
  onViewDetailsPress,
  onMessagePress,
  onChatPress,
  onInAppCallPress,
  onCellCallPress,
  onViewEHRPress,
  onEmailVideoLinkPress,
  onCopyVideoLinkPress,
  onReschedulePress,
  onCancelPress,
}) => {
  const [showAll, setShowAll] = useState(true);

  const getPatientName = (appointment: DashboardPatient) => {
    if (appointment.patient_name) return appointment.patient_name;
    if (appointment.patientName) return appointment.patientName;
    const firstName = appointment.firstName || appointment.first_name || '';
    const middleName = appointment.middleName || appointment.middle_name || '';
    const lastName = appointment.lastName || appointment.last_name || '';
    return [firstName, middleName, lastName].filter(Boolean).join(' ').trim() || 'N/A';
  };

  const getDOB = (appointment: DashboardPatient) => {
    return appointment.dob || appointment.patient_dob || '';
  };

  const getMRN = (appointment: DashboardPatient) => {
    return appointment.mrn || '';
  };

  const getBookingType = (appointment: DashboardPatient) => {
    return appointment.booking_type || appointment.bookingType || 'Tele Consult';
  };

  const getTime = (appointment: DashboardPatient) => {
    return appointment.start_time || appointment.startTime || '';
  };

  const getSpeciality = (appointment: DashboardPatient) => {
    return appointment.speciality || appointment.speciality_name || '';
  };

  const getAttendingPhysician = (appointment: DashboardPatient) => {
    return appointment.attending_physician || appointment.attendingphysician || '';
  };

  const getVideoLink = (appointment: DashboardPatient) => {
    return appointment.video_link || appointment.videoLink || '';
  };

  return (
    <View style={styles.container}>
      {/* Date Navigation */}
      <View style={styles.dateNavigationContainer}>
        <TouchableOpacity onPress={onDatePrev} style={styles.dateNavButton}>
          <Text style={styles.dateNavText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>{currentDate}</Text>
        <TouchableOpacity onPress={onDateNext} style={styles.dateNavButton}>
          <Text style={styles.dateNavText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Show On Hold Toggle */}
      {onShowOnHoldToggle && (
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Show on hold appointments</Text>
          <Switch
            value={showOnHold}
            onValueChange={onShowOnHoldToggle}
            trackColor={{ false: '#e0e0e0', true: '#00a0c3' }}
            thumbColor={showOnHold ? '#0070a9' : '#f4f3f4'}
          />
        </View>
      )}

      {/* Organization Header */}
      <View style={styles.organizationHeader}>
        <Text style={styles.organizationName}>{organizationName}</Text>
        <View style={styles.organizationToggleContainer}>
          <Switch
            value={showAll}
            onValueChange={(value) => {
              setShowAll(value);
              onOrganizationToggle?.(value);
            }}
            trackColor={{ false: '#e0e0e0', true: '#00a0c3' }}
            thumbColor={showAll ? '#0070a9' : '#f4f3f4'}
          />
          <Text style={styles.organizationToggleLabel}>All</Text>
        </View>
      </View>

      {/* Appointments List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No appointments found</Text>
          </View>
        ) : (
          appointments.map((appointment, index) => (
            <View key={appointment.appointment_id || appointment.appointmentId || index} style={styles.appointmentCard}>
              {/* Patient Information Block */}
              <View style={styles.patientInfoBlock}>
                <View style={styles.patientInfoLeft}>
                  <View style={styles.patientIcon}>
                    <Text style={styles.patientIconText}>👤</Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{getPatientName(appointment)}</Text>
                    <Text style={styles.patientDetail}>DOB : {getDOB(appointment)}</Text>
                    <Text style={styles.patientDetail}>MRN : {getMRN(appointment)}</Text>
                  </View>
                </View>
                <View style={styles.patientInfoRight}>
                  {onViewDetailsPress && (
                    <TouchableOpacity
                      style={styles.viewDetailsButton}
                      onPress={() => onViewDetailsPress(appointment)}
                    >
                      <Text style={styles.viewDetailsButtonText}>View Details</Text>
                    </TouchableOpacity>
                  )}
                  <View style={styles.patientActionIcons}>
                    {onMessagePress && (
                      <TouchableOpacity
                        onPress={() => onMessagePress(appointment)}
                        style={styles.patientActionIcon}
                      >
                        <Image
                          source={require('../../../assets/images/mailbox.png')}
                          style={styles.patientActionIconImage}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    )}
                    {onChatPress && (
                      <TouchableOpacity
                        onPress={() => onChatPress(appointment)}
                        style={styles.patientActionIcon}
                      >
                        <Text style={styles.patientActionIconText}>💬</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {/* Appointment Booking Details Block */}
              <View style={styles.bookingDetailsBlock}>
                <View style={styles.bookingDetailsLeft}>
                  <Text style={styles.bookingDetail}>Booking Type: {getBookingType(appointment)}</Text>
                  <Text style={styles.bookingDetail}>Time : {getTime(appointment)}</Text>
                  <Text style={styles.bookingDetail}>Speciality: {getSpeciality(appointment)}</Text>
                  <Text style={styles.bookingDetail}>Attending Physician: {getAttendingPhysician(appointment)}</Text>
                </View>
                <View style={styles.bookingDetailsRight}>
                  {onInAppCallPress && (
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => onInAppCallPress(appointment)}
                    >
                      <Text style={styles.callButtonIconText}>📞</Text>
                      <Text style={styles.callButtonText}>In-App Call</Text>
                    </TouchableOpacity>
                  )}
                  {onCellCallPress && (
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => onCellCallPress(appointment)}
                    >
                      <Text style={styles.callButtonIconText}>📞</Text>
                      <Text style={styles.callButtonText}>Cell Call</Text>
                    </TouchableOpacity>
                  )}
                  {onViewEHRPress && (
                    <TouchableOpacity
                      style={styles.ehrButton}
                      onPress={() => onViewEHRPress(appointment)}
                    >
                      <Text style={styles.ehrButtonText}>View EHR</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Video Link Options */}
              {getVideoLink() && (
                <View style={styles.videoLinkBlock}>
                  <View style={styles.videoLinkLeft}>
                    <Text style={styles.organizationIconText}>🏢</Text>
                    <Text style={styles.organizationNameText}>{organizationName}</Text>
                  </View>
                  <View style={styles.videoLinkButtons}>
                    {onEmailVideoLinkPress && (
                      <TouchableOpacity
                        style={styles.videoLinkButton}
                        onPress={() => onEmailVideoLinkPress(appointment)}
                      >
                        <Text style={styles.videoLinkButtonIconText}>✉</Text>
                        <Text style={styles.videoLinkButtonText}>Email video link</Text>
                      </TouchableOpacity>
                    )}
                    {onCopyVideoLinkPress && (
                      <TouchableOpacity
                        style={styles.videoLinkButton}
                        onPress={() => onCopyVideoLinkPress(appointment)}
                      >
                        <Text style={styles.videoLinkButtonIconText}>📋</Text>
                        <Text style={styles.videoLinkButtonText}>Copy video link</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity style={styles.expandButton}>
                      <Image
                        source={require('../../../assets/images/rl_down.png')}
                        style={styles.expandIcon}
                        resizeMode="contain"
                      />
                  </TouchableOpacity>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtonsBlock}>
                {onReschedulePress && (
                  <TouchableOpacity
                    style={styles.rescheduleButton}
                    onPress={() => onReschedulePress(appointment)}
                  >
                    <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                  </TouchableOpacity>
                )}
                {onCancelPress && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => onCancelPress(appointment)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  dateNavButton: {
    padding: 5,
  },
  dateNavText: {
    fontSize: 20,
    color: '#0070a9',
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Montserrat',
    marginHorizontal: 15,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Montserrat',
  },
  organizationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
  },
  organizationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Montserrat',
  },
  organizationToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizationToggleLabel: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Montserrat',
    marginLeft: 10,
  },
  listContainer: {
    flex: 1,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 5,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  patientInfoBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  patientInfoLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  patientIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00a0c3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  patientIconText: {
    fontSize: 24,
    color: '#ffffff',
  },
  patientInfo: {
    flex: 1,
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
  patientInfoRight: {
    alignItems: 'flex-end',
  },
  viewDetailsButton: {
    backgroundColor: '#00a0c3',
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  viewDetailsButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  },
  patientActionIcons: {
    flexDirection: 'row',
  },
  patientActionIcon: {
    marginLeft: 10,
    padding: 5,
  },
  patientActionIconImage: {
    width: 20,
    height: 20,
    tintColor: '#0070a9',
  },
  patientActionIconText: {
    fontSize: 18,
    color: '#0070a9',
  },
  bookingDetailsBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  bookingDetailsLeft: {
    flex: 1,
  },
  bookingDetail: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Montserrat',
    marginBottom: 5,
  },
  bookingDetailsRight: {
    alignItems: 'flex-end',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ff00',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  callButtonIconText: {
    fontSize: 16,
    color: '#ffffff',
    marginRight: 5,
  },
  callButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  },
  ehrButton: {
    backgroundColor: '#00a0c3',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  ehrButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  },
  videoLinkBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  videoLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  organizationIconText: {
    fontSize: 18,
    marginRight: 10,
    color: '#0070a9',
  },
  organizationNameText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Montserrat',
  },
  videoLinkButtons: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
  },
  videoLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00a0c3',
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  videoLinkButtonIconText: {
    fontSize: 16,
    color: '#ffffff',
    marginRight: 5,
  },
  videoLinkButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  expandButton: {
    padding: 5,
    marginLeft: 10,
  },
  expandIcon: {
    width: 16,
    height: 16,
    tintColor: '#0070a9',
  },
  actionButtonsBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  rescheduleButton: {
    flex: 1,
    backgroundColor: '#00a0c3',
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  rescheduleButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#0070a9',
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
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

export default AppointmentsContent;
