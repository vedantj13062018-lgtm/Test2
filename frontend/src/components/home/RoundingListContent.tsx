/**
 * Rounding List Content Component
 * Exact match to screenshot design
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { DashboardPatient } from '../../types';

interface RoundingListContentProps {
  patients: DashboardPatient[];
  currentDate: string;
  seenCount?: string;
  totalCount?: string;
  onDatePrev?: () => void;
  onDateNext?: () => void;
  onMyPatientsPress?: () => void;
  onFilterPress?: () => void;
  onPatientPress?: (patient: DashboardPatient) => void;
  onViewPress?: (patient: DashboardPatient) => void;
  onEditPress?: (patient: DashboardPatient) => void;
  onVoicePress?: (patient: DashboardPatient) => void;
  onExpandPress?: (patient: DashboardPatient) => void;
  onAddPress?: (patient: DashboardPatient) => void;
  onDocumentPress?: (patient: DashboardPatient) => void;
  onMessagePress?: (patient: DashboardPatient) => void;
  onDeletePress?: (patient: DashboardPatient) => void;
}

const RoundingListContent: React.FC<RoundingListContentProps> = ({
  patients,
  currentDate,
  seenCount,
  totalCount,
  onDatePrev,
  onDateNext,
  onMyPatientsPress,
  onFilterPress,
  onPatientPress,
  onViewPress,
  onEditPress,
  onVoicePress,
  onExpandPress,
  onAddPress,
  onDocumentPress,
  onMessagePress,
  onDeletePress,
}) => {
  const formatPatientName = (patient: DashboardPatient) => {
    // Try to get from patient_name first (might already be formatted like "A,Rishi(M),6Y")
    if (patient.patient_name) {
      // Check if it's already in the format we want (contains parentheses and comma)
      if (patient.patient_name.includes('(') && patient.patient_name.includes(')')) {
        return patient.patient_name;
      }
    }
    
    // If patient_name exists but not formatted, use it as base
    let baseName = patient.patient_name || patient.patientName || '';
    
    // Extract name parts
    const lastName = patient.lastName || patient.last_name || '';
    const firstName = patient.firstName || patient.first_name || '';
    
    // Get gender - convert to M/F format
    let gender = 'M';
    if (patient.gender || patient.genderhome) {
      const genderVal = patient.gender || patient.genderhome || '';
      if (genderVal.toLowerCase() === 'female' || genderVal === '2' || genderVal.toLowerCase() === 'f') {
        gender = 'F';
      } else if (genderVal.toLowerCase() === 'male' || genderVal === '1' || genderVal.toLowerCase() === 'm') {
        gender = 'M';
      } else {
        gender = genderVal.charAt(0).toUpperCase();
      }
    }
    
    const age = (patient as any).rlage || patient.age || '';
    
    // Format: "A,Rishi(M),6Y" - FirstLetterOfLastName,FirstName(Gender),AgeY
    // If we have lastName and firstName, use that format
    if (lastName && firstName) {
      const lastNameInitial = lastName.charAt(0).toUpperCase();
      return `${lastNameInitial},${firstName}(${gender})${age ? ',' + age + 'Y' : ''}`;
    }
    
    // If we have baseName, try to format it
    if (baseName) {
      // Remove any existing formatting and rebuild
      const cleanName = baseName.replace(/\([^)]*\)/g, '').replace(/,?\d+Y?/g, '').trim();
      const nameParts = cleanName.split(/[,\s]+/);
      if (nameParts.length >= 2) {
        const lastNameInitial = nameParts[0].charAt(0).toUpperCase();
        const firstName = nameParts[1];
        return `${lastNameInitial},${firstName}(${gender})${age ? ',' + age + 'Y' : ''}`;
      }
      // If single name, use first letter as last initial
      if (nameParts.length === 1) {
        const lastNameInitial = nameParts[0].charAt(0).toUpperCase();
        const firstName = nameParts[0].substring(1) || nameParts[0];
        return `${lastNameInitial},${firstName}(${gender})${age ? ',' + age + 'Y' : ''}`;
      }
    }
    
    // Fallback: use whatever name we have
    return baseName || 'N/A';
  };

  const getMRN = (patient: DashboardPatient) => {
    return patient.mrn || '';
  };

  const getBed = (patient: DashboardPatient) => {
    return patient.bed_name || patient.bed || '';
  };

  const getDOA = (patient: DashboardPatient) => {
    return patient.doa || patient.admit_date || '';
  };

  const getAssignTo = (patient: DashboardPatient) => {
    const firstName = patient.assigntodocfirstname || '';
    const lastName = patient.assigntodoclastname || '';
    return [firstName, lastName].filter(Boolean).join(' ').trim() || '';
  };

  const getPCP = (patient: DashboardPatient) => {
    return patient.primary_care_physician || patient.primary_care_physician_name || patient.pcp || '';
  };

  const getAttending = (patient: DashboardPatient) => {
    return patient.attending_physician || patient.attendingphysician || '';
  };

  return (
    <View style={styles.container}>
      {/* Date Navigation and Controls */}
      <View style={styles.dateControlsContainer}>
        {/* Date Navigator - Centered on top */}
        <View style={styles.dateNavigationContainer}>
          <TouchableOpacity onPress={onDatePrev} style={styles.dateNavButton}>
            <Text style={styles.dateNavText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.dateText}>{currentDate}</Text>
          <TouchableOpacity onPress={onDateNext} style={styles.dateNavButton}>
            <Text style={styles.dateNavText}>→</Text>
          </TouchableOpacity>
        </View>
        
        {/* Seen count and Filter/My Patients - Below date */}
        <View style={styles.bottomControlsRow}>
          <View style={styles.seenCountContainer}>
            <Text style={styles.seenCountText}>Seen : {seenCount || '0'}/{totalCount || '0'}</Text>
          </View>
          <View style={styles.rightControlsContainer}>
            <TouchableOpacity onPress={onFilterPress} style={styles.filterButton}>
              <Text style={styles.filterIconText}>☰</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onMyPatientsPress} style={styles.myPatientsButton}>
              <Text style={styles.myPatientsButtonText}>My Patients</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Patient List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {patients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No patients found</Text>
          </View>
        ) : (
          patients.map((patient, index) => (
            <View key={patient.patient_id || patient.patientId || index} style={styles.patientCard}>
              {/* Patient Info Header - Teal Background */}
              <View style={styles.patientHeader}>
                <View style={styles.patientHeaderLeft}>
                  <View style={styles.patientIcon}>
                    <Text style={styles.patientIconText}>👤</Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{formatPatientName(patient)}</Text>
                    <Text style={styles.patientDetail}>MRN: {getMRN(patient)}</Text>
                    <Text style={styles.patientDetail}>Bed: {getBed(patient)}</Text>
                    <Text style={styles.patientDetail}>DOA:{getDOA(patient)}</Text>
                  </View>
                </View>
                <View style={styles.patientHeaderRight}>
                  {onVoicePress && (
                    <TouchableOpacity onPress={() => onVoicePress(patient)} style={styles.headerIcon}>
                      <View style={styles.voiceIconContainer}>
                        <Text style={styles.voiceIconText}>🎤</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  <View style={styles.headerIconsRow}>
                    {onViewPress && (
                      <TouchableOpacity onPress={() => onViewPress(patient)} style={styles.headerIconSmall}>
                        <Text style={styles.headerIconText}>👁</Text>
                      </TouchableOpacity>
                    )}
                    {onEditPress && (
                      <TouchableOpacity onPress={() => onEditPress(patient)} style={styles.headerIconSmall}>
                        <Text style={styles.headerIconText}>✏</Text>
                      </TouchableOpacity>
                    )}
                    {onExpandPress && (
                      <TouchableOpacity onPress={() => onExpandPress(patient)} style={styles.headerIconSmall}>
                        <Image
                          source={require('../../../assets/images/rl_up.png')}
                          style={styles.headerIconImage}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {/* Assignment and Provider Details - White Background with Dividers */}
              <View style={styles.providerDetailsContainer}>
                <View style={styles.providerDetailItem}>
                  <Text style={styles.providerLabel}>Assign To</Text>
                  <Text style={styles.providerValue}>{getAssignTo(patient)}</Text>
                </View>
                <View style={styles.providerDivider} />
                <View style={styles.providerDetailItem}>
                  <Text style={styles.providerLabel}>PCP</Text>
                  <Text style={styles.providerValue}>{getPCP(patient)}</Text>
                </View>
                <View style={styles.providerDivider} />
                <View style={styles.providerDetailItem}>
                  <Text style={styles.providerLabel}>Attending</Text>
                  <Text style={styles.providerValue}>{getAttending(patient)}</Text>
                </View>
              </View>

              {/* Action Buttons - Grey Background Row */}
              <View style={styles.actionButtonsContainer}>
                {onAddPress && (
                  <TouchableOpacity onPress={() => onAddPress(patient)} style={styles.actionButton}>
                    <View style={styles.actionButtonCircle}>
                      <Text style={styles.actionButtonPlus}>+</Text>
                    </View>
                  </TouchableOpacity>
                )}
                {onDocumentPress && (
                  <TouchableOpacity onPress={() => onDocumentPress(patient)} style={styles.actionButton}>
                    <Text style={styles.actionButtonIconText}>📄</Text>
                  </TouchableOpacity>
                )}
                {onMessagePress && (
                  <TouchableOpacity onPress={() => onMessagePress(patient)} style={styles.actionButton}>
                    <Image
                      source={require('../../../assets/images/mailbox.png')}
                      style={styles.actionButtonIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
                {onDeletePress && (
                  <TouchableOpacity onPress={() => onDeletePress(patient)} style={styles.actionButton}>
                    <Text style={styles.actionButtonIconText}>🗑</Text>
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
    backgroundColor: '#f5f5f5',
  },
  dateControlsContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  dateNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dateNavButton: {
    padding: 8,
  },
  dateNavText: {
    fontSize: 18,
    color: '#0070a9',
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Montserrat',
    marginHorizontal: 20,
  },
  bottomControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  seenCountContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  seenCountText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Montserrat',
  },
  rightControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  filterButton: {
    padding: 5,
    marginRight: 10,
  },
  filterIconText: {
    fontSize: 20,
    color: '#0070a9',
    fontWeight: 'bold',
  },
  myPatientsButton: {
    backgroundColor: '#00a0c3',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  myPatientsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  },
  listContainer: {
    flex: 1,
  },
  patientCard: {
    backgroundColor: '#ffffff',
    borderRadius: 5,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#00a0c3',
    padding: 12,
  },
  patientHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  patientIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientIconText: {
    fontSize: 24,
    color: '#0070a9',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Montserrat',
    marginBottom: 3,
  },
  patientDetail: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    marginBottom: 1,
  },
  patientHeaderRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginLeft: 10,
  },
  headerIcon: {
    marginBottom: 8,
    padding: 2,
    alignItems: 'center',
  },
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerIconSmall: {
    marginLeft: 8,
    padding: 2,
    alignItems: 'center',
  },
  headerIconImage: {
    width: 20,
    height: 20,
    tintColor: '#ffffff',
  },
  voiceIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  voiceIconText: {
    fontSize: 12,
    color: '#ffffff',
  },
  headerIconText: {
    fontSize: 20,
    color: '#ffffff',
  },
  headerIconImage: {
    width: 20,
    height: 20,
    tintColor: '#ffffff',
  },
  providerDetailsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 15,
    minHeight: 60,
  },
  providerDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  providerLabel: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'Montserrat',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  providerValue: {
    fontSize: 13,
    color: '#000000',
    fontFamily: 'Montserrat',
    fontWeight: 'bold',
  },
  providerDivider: {
    width: 1,
    backgroundColor: '#d0d0d0',
    marginHorizontal: 10,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    minHeight: 50,
  },
  actionButton: {
    marginHorizontal: 30,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0070a9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonPlus: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: 'bold',
    lineHeight: 22,
  },
  actionButtonIcon: {
    width: 22,
    height: 22,
    tintColor: '#0070a9',
  },
  actionButtonIconText: {
    fontSize: 22,
    color: '#0070a9',
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

export default RoundingListContent;
