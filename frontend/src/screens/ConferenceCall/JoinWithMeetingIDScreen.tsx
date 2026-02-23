/**
 * Join with Meeting ID Screen
 * Matches StrokeTeamOne JoinWithMeetingIDActivity
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import socketService from '../../services/socketService';
import { getStringFromStorage } from '../../utils/storage';

const COLORS = {
  colorDrawer: '#00006e',
  skyblue: '#00bcdc',
  patientHistoryBg: '#00a0c3',
  white: '#FFFFFF',
  black: '#000000',
  grey: '#9E9E9E',
  greyLight: '#E0E0E0',
};

const JoinWithMeetingIDScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [meetingId, setMeetingId] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    const id = meetingId.trim();
    if (!id) {
      Alert.alert('', 'Please enter a Meeting ID');
      return;
    }

    setJoining(true);
    try {
      if (!socketService.getConnectionStatus()) {
        await socketService.initSocket();
      }
      await socketService.joinExistingMeeting(id);
      const jitsiUrl = await getStringFromStorage('apiGroupCallURL');
      if (!jitsiUrl) {
        Alert.alert('Error', 'Unable to get call URL');
        return;
      }
      const room = jitsiUrl.replace(/\/$/, '') + '/' + id;
      navigation.replace('JitsiMeeting', {
        room,
        serverURL: jitsiUrl,
        audioOnly: false,
        videoMuted: false,
      });
    } catch (e: any) {
      console.error('Join meeting error:', e);
      Alert.alert('Error', e?.message || 'Failed to join meeting');
    } finally {
      setJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerTitle}>Join Call with Meeting ID</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inputSection}>
          <Text style={styles.label}>Meeting ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Meeting ID"
            placeholderTextColor={COLORS.grey}
            value={meetingId}
            onChangeText={setMeetingId}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={[styles.joinBtn, joining && styles.joinBtnDisabled]}
          onPress={handleJoin}
          disabled={joining}
        >
          <Text style={styles.joinBtnText}>
            {joining ? 'Joining...' : 'Join'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: COLORS.colorDrawer,
  },
  headerLeft: {
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.colorDrawer,
  },
  headerRight: {
    flex: 1,
    backgroundColor: COLORS.skyblue,
    justifyContent: 'center',
    paddingLeft: 12,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.greyLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.black,
  },
  joinBtn: {
    backgroundColor: COLORS.patientHistoryBg,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinBtnDisabled: {
    opacity: 0.7,
  },
  joinBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default JoinWithMeetingIDScreen;
