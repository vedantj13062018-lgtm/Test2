/**
 * Video Call Screen (Placeholder)
 * Jitsi integration will be added later
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch } from '../../store/hooks';
import { endCall } from '../../store/slices/callSlice';
import { RootStackParamList } from '../../types';
import { COLORS } from '../../constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = {
  params: {
    roomId?: string;
    joiningRoomId?: string;
    callType?: string;
  };
};

const VideoCallScreen: React.FC = () => {
  const route = useRoute<RouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();

  const { roomId, joiningRoomId, callType } = route.params;

  const handleEndCall = () => {
    dispatch(endCall());
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Video Call</Text>
        <Text style={styles.subtitle}>
          {roomId || joiningRoomId ? `Room: ${roomId || joiningRoomId}` : 'No room ID provided'}
        </Text>
        <Text style={styles.subtitle}>
          {callType ? `Type: ${callType}` : 'Type: Not specified'}
        </Text>
        <Text style={styles.info}>
          Jitsi Meet integration will be added here later.
        </Text>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.endButton} onPress={handleEndCall}>
          <Text style={styles.endButtonText}>End Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.white,
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  endButton: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  endButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VideoCallScreen;
