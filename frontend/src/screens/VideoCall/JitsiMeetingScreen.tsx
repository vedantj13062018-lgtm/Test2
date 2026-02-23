import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Modal,
  PanResponder,
  GestureResponderEvent,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JitsiMeeting } from '@jitsi/react-native-sdk';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getStringFromStorage } from '../../utils/storage';
import { USER_NAME } from '../../constants';
import socketService from '../../services/socketService';

interface RouteParams {
  room: string;
  userInfo?: {
    displayName?: string;
    email?: string;
    avatar?: string;
  };
  serverURL?: string;
  audioOnly?: boolean;
  videoMuted?: boolean;
}

const JitsiMeetingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as RouteParams) || {};
  const { room, serverURL, audioOnly, videoMuted } = params;
  let { userInfo } = params;
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string>('');
  const [showCartControl, setShowCartControl] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [cartControlActive, setCartControlActive] = useState(false);
  const [callTime, setCallTime] = useState(0);

  const jitsiMeetingRef = useRef(null);
  const panResponderRef = useRef<any>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getStringFromStorage(USER_NAME).then((name) => setDisplayName(name || ''));
  }, []);

  // Start call timer
  useEffect(() => {
    if (!loading) {
      callTimerRef.current = setInterval(() => {
        setCallTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [loading]);

  // Format call time as MM:SS
  const formatCallTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize gesture controls for cart camera
  useEffect(() => {
    if (cartControlActive) {
      let initialDistance = 0;
      let lastTapTime = 0;
      const DOUBLE_TAP_TIME_DELTA = 300;

      panResponderRef.current = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: (evt) => {
          // Handle single tap for zoom out
          const now = Date.now();
          if (now - lastTapTime < DOUBLE_TAP_TIME_DELTA) {
            // Double tap - reset camera
            handleCameraReset();
            lastTapTime = 0;
          } else {
            lastTapTime = now;
          }
        },

        onPanResponderMove: (evt, gestureState) => {
          // Handle swipe gestures
          const { dx, dy } = gestureState;
          const threshold = 50;

          if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal swipe
            if (Math.abs(dx) > threshold) {
              if (dx > 0) {
                handleSwipe('LEFT');
              } else {
                handleSwipe('RIGHT');
              }
            }
          } else {
            // Vertical swipe
            if (Math.abs(dy) > threshold) {
              if (dy > 0) {
                handleSwipe('UP');
              } else {
                handleSwipe('DOWN');
              }
            }
          }
        },

        onPanResponderRelease: () => {
          // Reset gesture state
        },
      });
    }
  }, [cartControlActive]);

  // Handle swipe gestures for cart camera control
  const handleSwipe = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (!cartControlActive) return;

    // Emit socket events for cart camera control
    // These match Android SocketConnection methods
    switch (direction) {
      case 'UP':
        socketService.sendTiltUpRequest();
        break;
      case 'DOWN':
        socketService.sendTiltDownRequest();
        break;
      case 'LEFT':
        socketService.sendTiltLeftRequest();
        break;
      case 'RIGHT':
        socketService.sendTiltRightRequest();
        break;
    }
  }, [cartControlActive]);

  // Handle zoom gestures
  const handleZoom = useCallback((type: 'IN' | 'OUT') => {
    if (!cartControlActive) return;

    const zoomCount = 2; // Default zoom step
    if (type === 'IN') {
      socketService.sendZoomInRequest(zoomCount);
    } else {
      socketService.sendZoomOutRequest(zoomCount);
    }
  }, [cartControlActive]);

  // Handle camera reset
  const handleCameraReset = useCallback(() => {
    if (!cartControlActive) return;
    socketService.sendResetCameraRequest();
    socketService.sendZoomResetRequest();
  }, [cartControlActive]);

  // Handle cart control button press
  const handleCartControl = useCallback(() => {
    if (!cartControlActive) {
      // Request cart access - you may need to pass cartId from props/state
      // For now, we'll emit a generic request
      socketService.emit('getCartAccess', {});
      setCartControlActive(true);
      setShowCartControl(true);
    } else {
      // Release cart access
      socketService.releaseCartAccess();
      setCartControlActive(false);
      setShowCartControl(false);
    }
  }, [cartControlActive]);

  // Handle add participant button press
  const handleAddParticipant = useCallback(() => {
    setShowAddParticipant(true);
    // Fetch online users for adding to call
    socketService.emit('fetchJoinedUsers', {});
  }, []);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const onConferenceLeft = (nativeEvent: any) => {
    console.log('Conference Left', nativeEvent);
    navigation.goBack();
  };

  const onReadyToClose = (nativeEvent: any) => {
    console.log('Ready to close', nativeEvent);
    navigation.goBack();
  };

  const onConferenceJoined = (nativeEvent: any) => {
    console.log('Conference Joined', nativeEvent);
    setLoading(false);
  };

  const onConferenceWillJoin = (nativeEvent: any) => {
    console.log('Conference Will Join', nativeEvent);
  };

  // Map route params to IUserInfo; use stored display name if not in params (matches Android/Swift)
  const jitsiUserInfo = {
    displayName: userInfo?.displayName || displayName || 'Doctor',
    email: userInfo?.email || '',
    avatarURL: userInfo?.avatar || '',
  };

  if (!room || !room.trim()) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>No room ID. Cannot join meeting.</Text>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <JitsiMeeting
        eventListeners={{
          onConferenceLeft,
          onReadyToClose,
          onConferenceJoined,
          onConferenceWillJoin,
        }}
        ref={jitsiMeetingRef}
        style={styles.meeting}
        room={room}
        serverURL={serverURL}
        userInfo={jitsiUserInfo}
        config={{
          startAudioOnly: audioOnly,
          startWithVideoMuted: videoMuted,
          subject: 'Video Call',
        }}
        flags={{
          'add-people.enabled': false,
          'ios.recording.enabled': false,
          'live-streaming.enabled': false,
          'meeting-password.enabled': false,
          'reactions.enabled': false,
          'video-share.enabled': false,
          'welcomepage.enabled': false,
          'invite.enabled': false,
          'kick-out.enabled': false,
          'security-options.enabled': false,
          'settings.enabled': false,
          'prejoinpage.enabled': false,
          'call-integration.enabled': false,
        }}
      />

      {/* Top overlay with control buttons - Right side */}
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topOverlay}>
          <View style={styles.topBar}>
            {/* Call Timer - Left side */}
            <Text style={styles.callTimer}>{formatCallTime(callTime)}</Text>

            {/* Right side buttons container */}
            <View style={styles.rightButtonsContainer}>
              {/* Cart Control Button */}
              <TouchableOpacity
                style={[styles.iconButton, cartControlActive && styles.iconButtonActive]}
                onPress={handleCartControl}
                activeOpacity={0.7}
              >
                <Icon name="crop" size={24} color={cartControlActive ? '#4CAF50' : '#FFFFFF'} />
              </TouchableOpacity>

              {/* Add Participant Button */}
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={handleAddParticipant}
                activeOpacity={0.7}
              >
                <Icon name="person-add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Cart Control Overlay - Shows when cart control is active */}
      {cartControlActive && panResponderRef.current && (
        <View
          style={styles.cartControlOverlay}
          {...panResponderRef.current.panHandlers}
        >
          <View style={styles.cartControlInfo}>
            <Text style={styles.cartControlText}>
              Cart Camera Control Active
            </Text>
            <Text style={styles.cartControlHint}>
              Swipe to pan/tilt • Pinch to zoom • Double tap to reset
            </Text>
          </View>
        </View>
      )}

      {/* Add Participant Modal */}
      <Modal
        visible={showAddParticipant}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddParticipant(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Participants</Text>
              <TouchableOpacity onPress={() => setShowAddParticipant(false)}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalPlaceholder}>
                Participant list will be loaded here
              </Text>
              {/* TODO: Add participant list component */}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  meeting: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    marginBottom: 16,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  topOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingBottom: 8,
    minHeight: 50,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: '100%',
    paddingTop: 5, // Add some top padding for safe area
  },
  rightButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // For Android shadow
  },
  iconButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.4)',
    borderColor: '#4CAF50',
  },
  callTimer: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cartControlOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  cartControlInfo: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cartControlText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cartControlHint: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  modalBody: {
    padding: 20,
  },
  modalPlaceholder: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default JitsiMeetingScreen;
