/**
 * ICUPatientDetailsScreen
 * Matches Java ICUPatientDetailsActivity - Detailed patient dashboard with vitals
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const ICUPatientDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    patientId,
    patName,
    txtdob,
    txtage,
    txtgender,
    txtbed,
    txtpd,
    txtstation,
    txtadmitdate,
    txtfin,
    txtmrn,
    txtipadmitdate,
    txtlocation,
    bedId,
    bedName,
    videoUrl,
  } = route.params || {};

  const [loading, setLoading] = useState(false);

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleRemarksPress = () => {
    navigation.navigate('ICURemarks', { patientId });
  };

  const handleCareTeamPress = () => {
    navigation.navigate('ICUCareTeam', { patientId });
  };

  const handleAlertPress = () => {
    navigation.navigate('ICUAlert', { patientId });
  };

  const handleVideoPress = () => {
    navigation.navigate('ICUCameraControl', {
      patientId,
      videoUrl,
      bedId,
      bedName,
    });
  };

  const handleWaveformPress = () => {
    navigation.navigate('WaveformDisplay', {
      patientId,
      bedId,
      bedName,
    });
  };

  const handleEHRPress = () => {
    navigation.navigate('PatientDetail', { patientId, patientName: patName });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {patName}
        </Text>
        <TouchableOpacity onPress={handleCareTeamPress} style={styles.careTeamButton}>
          <Text style={styles.careTeamText}>Care Team</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Patient Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Patient Information</Text>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>{formatDate(txtdob)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{txtage ? `${txtage} Yrs` : '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{txtgender || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>MRN</Text>
              <Text style={styles.infoValue}>{txtmrn || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>FIN</Text>
              <Text style={styles.infoValue}>{txtfin || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Location</Text>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bed</Text>
              <Text style={styles.infoValue}>{txtbed || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Station</Text>
              <Text style={styles.infoValue}>{txtstation || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{txtlocation || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Admission Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Admission Details</Text>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ICU Admit Date</Text>
              <Text style={styles.infoValue}>{formatDate(txtadmitdate)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>IP Admit Date</Text>
              <Text style={styles.infoValue}>{formatDate(txtipadmitdate)}</Text>
            </View>
            {txtpd && (
              <View style={styles.diagnosisContainer}>
                <Text style={styles.infoLabel}>Principal Diagnosis</Text>
                <Text style={styles.diagnosisText}>{txtpd}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Remarks Card */}
        <TouchableOpacity style={styles.actionCard} onPress={handleRemarksPress}>
          <View style={styles.actionCardContent}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📝</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Remarks</Text>
              <Text style={styles.actionSubtitle}>View and add ICU remarks</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton} onPress={handleAlertPress}>
          <Text style={styles.navIcon}>🚨</Text>
          <Text style={styles.navText}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={handleEHRPress}>
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navText}>EHR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={handleVideoPress}>
          <Text style={styles.navIcon}>📹</Text>
          <Text style={styles.navText}>Video</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={handleWaveformPress}>
          <Text style={styles.navIcon}>📈</Text>
          <Text style={styles.navText}>Waveform</Text>
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  careTeamButton: {
    padding: 5,
  },
  careTeamText: {
    color: '#fff',
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  cardHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0070a9',
  },
  cardBody: {
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  diagnosisContainer: {
    paddingTop: 12,
  },
  diagnosisText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    lineHeight: 20,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconText: {
    fontSize: 20,
  },
  actionInfo: {
    flex: 1,
    marginLeft: 15,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 24,
    color: '#666',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 10,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navText: {
    fontSize: 11,
    color: '#666',
  },
});

export default ICUPatientDetailsScreen;
