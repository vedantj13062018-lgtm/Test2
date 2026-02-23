/**
 * Doctor Item Component
 * Replicated from StrokeTeamOne list_doctor_item.xml and DoctorsListAdapter
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { OnlineUser } from '../types';

interface DoctorItemProps {
  doctor: OnlineUser;
  onCallPress: () => void;
  onChatPress: () => void;
}

const DoctorItem: React.FC<DoctorItemProps> = ({
  doctor,
  onCallPress,
  onChatPress,
}) => {
  const getCallIcon = () => {
    switch (doctor.onlineStatus) {
      case 'online':
        return '🟢'; // Green circle for online
      case 'idle':
        return '🟡'; // Yellow circle for idle
      case 'offline':
      default:
        return '⚫'; // Black circle for offline
    }
  };

  const getCallIconColor = () => {
    switch (doctor.onlineStatus) {
      case 'online':
        return '#4CAF50'; // Green
      case 'idle':
        return '#FFC107'; // Yellow/Amber
      case 'offline':
      default:
        return '#757575'; // Grey
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* Profile Image */}
        <View style={styles.imageContainer}>
          <View style={styles.profileImage}>
            <Text style={styles.profileIcon}>👤</Text>
          </View>
        </View>

        {/* Doctor Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.doctorName}>{doctor.userName}</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Speciality </Text>
            <Text style={styles.detailValue}>{doctor.speciality}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location </Text>
            <Text style={styles.detailValue}>{doctor.city || 'N/A'}</Text>
          </View>

          {/* On Call Badge */}
          {doctor.oncall_status === '1' && (
            <View style={styles.onCallBadge}>
              <Text style={styles.onCallText}>On Call</Text>
            </View>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: getCallIconColor() }]}
            onPress={onCallPress}
            activeOpacity={0.7}
            accessibilityLabel="Video call"
          >
            <Text style={styles.actionIcon}>📹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onChatPress}
            activeOpacity={0.7}
            accessibilityLabel="Chat"
          >
            <Text style={styles.actionIcon}>💬</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Border */}
      <View style={styles.bottomBorder} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginTop: 15,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    paddingTop: 10,
  },
  cardContent: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingRight: 5,
  },
  imageContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007eb6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 36,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'flex-start',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  detailRow: {
    flexDirection: 'row',
    marginTop: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  onCallBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#4CAF50',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  onCallText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionsContainer: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionButton: {
    width: 48,
    minHeight: 56,
    borderRadius: 24,
    backgroundColor: '#007eb6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionBtnContent: {
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 22,
  },
  bottomBorder: {
    height: 5,
    backgroundColor: '#007eb6',
    marginTop: 5,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
});

export default DoctorItem;
