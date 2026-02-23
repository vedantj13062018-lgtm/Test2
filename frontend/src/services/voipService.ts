import RNVoipPushNotification from 'react-native-voip-push-notification';
import RNCallKeep from 'react-native-callkeep';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

/** Generate a unique call ID (CallKeep expects a string; react-native-get-random-values is a polyfill, not a UUID fn). */
function generateCallUUID(): string {
    return 'call-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigateWithRetry } from '../navigation/navigationRef';
import { getStringFromStorage, saveStringToStorage } from '../utils/storage';
import { SESSION_ID } from '../constants';
import { store } from '../store';
import { setRecentChats } from '../store/slices/chatSlice';

const PENDING_CALL_PREFIX = 'callkeep_room_';
const INCOMING_ALERT_DEDUPE_MS = 15000; // Same call (FCM + socket) – show alert only once per broadcast_id

class VoipService {
    private isCallKeepSetup: boolean = false;
    private activeCalls: Map<string, string> = new Map(); // uuid -> roomId
    private lastIncomingAlertByBroadcast: Map<string, number> = new Map(); // broadcast_id -> timestamp
    /** Guards against FCM + socket both showing alert for same call (race-safe). */
    private handlingIncomingBroadcast: Set<string> = new Set();

    constructor() {
        this.setupCallKeep();
        this.setupVoip();
    }

    private setupCallKeep() {
        const options = {
            ios: {
                appName: 'TiaTele MD',
                maximumCallGroups: '1',
                maximumCallsPerCallGroup: '1',
            },
            android: {
                alertTitle: 'Permissions required',
                alertDescription: 'This application needs to access your phone accounts',
                cancelButton: 'Cancel',
                okButton: 'ok',
                imageName: 'phone_account_icon',
                additionalPermissions: [],
                // Required to get audio in background when using with ConnectionService
                foregroundService: {
                    channelId: 'com.voip',
                    channelName: 'Foreground service for my app',
                    notificationTitle: 'My app is running on background',
                    notificationIcon: 'Path to the resource icon of the notification',
                },
            },
        };

        RNCallKeep.setup(options).then((accepted) => {
            this.isCallKeepSetup = !!accepted;
        });

        RNCallKeep.addEventListener('answerCall', this.onAnswerCall);
        RNCallKeep.addEventListener('endCall', this.onEndCall);
    }

    private setupVoip() {
        if (Platform.OS === 'ios') {
            RNVoipPushNotification.addEventListener('register', (token) => {
                console.log('VoIP Token registered:', token);
            });

            RNVoipPushNotification.addEventListener('notification', (notification) => {
                console.log('VoIP Notification received:', notification);
                const payload = notification as any;
                this.handleIncomingCall(payload);
            });

            RNVoipPushNotification.registerVoipToken();
        } else if (Platform.OS === 'android') {
            // Load messaging package first so it registers with Firebase app (required for getMessaging(app))
            try {
                require('@react-native-firebase/messaging');
                const { getApp } = require('@react-native-firebase/app');
                const {
                    getMessaging,
                    requestPermission,
                    getToken,
                    onTokenRefresh,
                    onMessage,
                    getInitialNotification,
                } = require('@react-native-firebase/messaging');

                const app = getApp();
                const messaging = getMessaging(app);

                // Android 13+: request POST_NOTIFICATIONS so FCM/call notifications show
                PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS' as any).catch(() => {});

                requestPermission(messaging).then((authStatus: any) => {
                    console.log('[VoipService] FCM Authorization Status:', authStatus);
                }).catch((e: any) => console.warn('[VoipService] FCM requestPermission error:', e));

                // CRITICAL: Save FCM token so login can send it to backend (matches StrokeTeamOne Session.setFCMToken)
                getToken(messaging).then(async (token: string) => {
                    console.log('[VoipService] FCM Token received, saving for login/backend');
                    try {
                        await saveStringToStorage('device_token', token);
                    } catch (e) {
                        console.warn('[VoipService] Failed to save device_token:', e);
                    }
                }).catch((e: any) => console.warn('[VoipService] FCM getToken error:', e));

                onTokenRefresh(messaging, async (token: string) => {
                    console.log('[VoipService] FCM Token refreshed, saving');
                    try {
                        await saveStringToStorage('device_token', token);
                    } catch (e) {
                        console.warn('[VoipService] Failed to save refreshed device_token:', e);
                    }
                });

                onMessage(messaging, async (remoteMessage: any) => {
                    console.log('[VoipService] FCM Foreground Message received:', JSON.stringify(remoteMessage?.data || remoteMessage));
                    if (remoteMessage?.data) {
                        await this.handleIncomingCall(remoteMessage.data);
                    } else {
                        console.warn('[VoipService] FCM message has no .data – ensure backend sends data-only for calls');
                    }
                });

                getInitialNotification(messaging).then((remoteMessage: any) => {
                    if (remoteMessage?.data) {
                        console.log('[VoipService] App opened from notification, handling data:', JSON.stringify(remoteMessage.data));
                        this.handleIncomingCall(remoteMessage.data);
                    }
                }).catch(() => {});
            } catch (e) {
                const msg = (e as any)?.message || String(e);
                if (msg.includes('could not be found') || msg.includes('messaging')) {
                    __DEV__ && console.log('[VoipService] FCM skipped (messaging not available)');
                } else {
                    console.warn('[VoipService] FCM setup failed:', e);
                }
            }
        }
    }

    /**
     * Handle NewMessage FCM (Matches StrokeTeamOne: refresh recent chats so list/badge updates).
     */
    private async handleNewMessage(_payload: any) {
        try {
            const socketService = require('./socketService').default;
            const list = await socketService.fetchRecentChats();
            store.dispatch(setRecentChats(list));
            console.log('[VoipService] NewMessage: refreshed recent chats');
        } catch (e) {
            console.warn('[VoipService] handleNewMessage error:', e);
        }
    }

    /**
     * Handle incoming call payload (FCM data or socket).
     * Accepts CALLFROMWEB, DirectCall, GroupCall; also any payload with broadcast_id if no alert_type.
     * Persists call UUID -> roomId for headless (app killed) so Accept still works.
     */
    async handleIncomingCall(payload: any) {
        console.log('[VoipService] handleIncomingCall called with payload:', JSON.stringify(payload));

        if (!payload || typeof payload !== 'object') {
            console.warn('[VoipService] Invalid payload (null or not object), ignoring');
            return;
        }

        // Optional session check – if we have session, good; if not, still show call so we never drop (e.g. headless)
        try {
            const sessionId = await getStringFromStorage(SESSION_ID);
            if (!sessionId || !String(sessionId).trim()) {
                console.log('[VoipService] No session in storage – still showing call (e.g. background/headless)');
            }
        } catch (e) {
            console.warn('[VoipService] Session check failed:', e);
        }

        const alertType = (payload.alert_type || payload.alertType || '').trim();
        if (alertType === 'NewMessage') {
            this.handleNewMessage(payload);
            return;
        }
        const otherNonCallTypes = ['ChatAccepted', 'ChatEnd', 'TaskListAlert', 'AppointmentConfirmation', 'waiting_room', 'InboxMessage', 'SEND_PATIENT_CLINICAL_UPDATE_TO_DOCTOR', 'clinical_updates_for_doctor'];
        if (alertType && otherNonCallTypes.includes(alertType)) {
            console.log('[VoipService] Ignoring non-call alert_type:', alertType);
            return;
        }

        let broadcastId = '';
        if (payload.broadcast_id) {
            broadcastId = String(payload.broadcast_id).trim();
        } else if (payload.aps?.alert?.broadcast_id) {
            broadcastId = String(payload.aps.alert.broadcast_id).trim();
        }
        if (!broadcastId) {
            console.warn('[VoipService] No broadcast_id in payload, ignoring. Keys:', Object.keys(payload));
            return;
        }

        // Dedupe: same call often arrives via FCM and socket – show alert only once (race-safe guard)
        if (this.handlingIncomingBroadcast.has(broadcastId)) {
            console.log('[VoipService] Skipping duplicate incoming call alert for broadcast_id:', broadcastId);
            return;
        }
        const lastShown = this.lastIncomingAlertByBroadcast.get(broadcastId);
        if (lastShown != null && Date.now() - lastShown < INCOMING_ALERT_DEDUPE_MS) {
            console.log('[VoipService] Skipping duplicate incoming call alert (recent) for broadcast_id:', broadcastId);
            return;
        }
        this.handlingIncomingBroadcast.add(broadcastId);
        this.lastIncomingAlertByBroadcast.set(broadcastId, Date.now());
        setTimeout(() => this.handlingIncomingBroadcast.delete(broadcastId), INCOMING_ALERT_DEDUPE_MS);

        let callerName = 'Incoming Call';
        if (payload.caller_name) callerName = String(payload.caller_name).trim() || callerName;
        else if (payload.sender_name) callerName = String(payload.sender_name).trim() || callerName;
        else if (payload.sender_display_name) callerName = String(payload.sender_display_name).trim() || callerName;

        const callUUID = generateCallUUID();
        this.activeCalls.set(callUUID, broadcastId);

        // Persist for headless: when app was killed, onAnswerCall runs in fresh process and activeCalls is empty
        try {
            await AsyncStorage.setItem(PENDING_CALL_PREFIX + callUUID, broadcastId);
        } catch (e) {
            console.warn('[VoipService] Failed to persist call for headless:', e);
        }

        console.log('[VoipService] Incoming call – showing in-app UI (same as when you call out):', { broadcastId, callerName });

        // No system call UI – use in-app Alert then JitsiMeeting (same UI as when you call from RN to Swift).
        Alert.alert(
            'Incoming Call',
            `${callerName} is calling. Join?`,
            [
                { text: 'Decline', style: 'cancel' },
                {
                    text: 'Join',
                    onPress: () => this.joinCallAndNavigateToJitsi(broadcastId),
                },
            ],
            { cancelable: true }
        );
    }

    /**
     * Accept call on server (acceptGroupCall + updateDeviceDetails) then navigate to Jitsi.
     * Matches StrokeTeamOne: CallActivity/MeetingActivity call acceptGroupCall() then launch Jitsi.
     */
    private async joinCallAndNavigateToJitsi(broadcastId: string) {
        try {
            const socketService = require('./socketService').default;
            await socketService.acceptGroupCall(broadcastId);
        } catch (e) {
            console.warn('[VoipService] acceptGroupCall failed (continuing to Jitsi):', e);
        }
        const serverUrl = await getStringFromStorage('apiGroupCallURL');
        console.log('[VoipService] Navigating to JitsiMeeting room:', broadcastId);
        navigateWithRetry('JitsiMeeting', {
            room: broadcastId,
            serverURL: serverUrl || undefined,
            audioOnly: false,
        });
    }

    private onAnswerCall = async ({ callUUID }: { callUUID: string }) => {
        console.log('[VoipService] Call Answered:', callUUID);
        let roomId = this.activeCalls.get(callUUID);

        // Headless: app was killed, so activeCalls is empty – read from AsyncStorage
        if (!roomId) {
            try {
                const stored = await AsyncStorage.getItem(PENDING_CALL_PREFIX + callUUID);
                if (stored) {
                    roomId = stored;
                    await AsyncStorage.removeItem(PENDING_CALL_PREFIX + callUUID);
                }
            } catch (_) {}
        }

        if (roomId) {
            await this.joinCallAndNavigateToJitsi(roomId);
        } else {
            console.warn('[VoipService] No roomId for callUUID:', callUUID);
        }
    };

    private onEndCall = ({ callUUID }: { callUUID: string }) => {
        console.log('Call Ended:', callUUID);
        this.activeCalls.delete(callUUID);
        RNCallKeep.endCall(callUUID);
    };
}

export default new VoipService();
