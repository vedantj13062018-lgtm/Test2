/**
 * Socket.IO Service
 * Matches Swift TiaChatManager implementation
 */

import { io, Socket } from 'socket.io-client';
import { Platform, NativeModules } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { getStringFromStorage, removeFromStorage } from '../utils/storage';
import {
  BASE_SOCKET_URL,
  USER_ID,
  USER_NAME,
  USER_TYPE,
  SESSION_ID,
  ORGANIZATION_ID,
  ORGANIZATION_NAME,
  ORGANIZATION_COUNT,
  PRACTICE_LOC_ID,
  PRACTICE_LOC_NAME,
  IS_LOGGED_IN,
  SPECIALITY_ID,
} from '../constants';
import { decryptJSON, decryptData, decryptDataWithZeroIV, encryptData, encryptDataWithZeroIV } from '../utils/encryption';
import { store } from '../store';
import { addMessage, setRecentChats, setChatRequests } from '../store/slices/chatSlice';
import { logout as logoutAction } from '../store/slices/authSlice';
import { navigationRef } from '../navigation/navigationRef';
import type { Chat, ChatRequest, ChatMessage, GroupContactNew, CallLog } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private isJoining: boolean = false;
  private baseSocketUrl: string = '';
  private socketCallback: ((data: any) => void) | null = null;

  /**
   * Initialize socket connection
   */
  initSocket(): Promise<void> {
    return new Promise((resolve) => {
      // If already connected, resolve immediately
      if (this.socket && this.isConnected) {
        resolve();
        return;
      }

      getStringFromStorage(BASE_SOCKET_URL).then((baseUrl) => {
        if (!baseUrl) {
          console.error('Base socket URL not found');
          // If no URL, we can't connect, so we just resolve to avoid hanging
          resolve();
          return;
        }

        this.baseSocketUrl = baseUrl;

        // Disconnect existing socket if any
        if (this.socket) {
          this.socket.disconnect();
        }

        // Create new socket connection
        this.socket = io(baseUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          forceNew: true, // Force new connection to avoid session reuse issues
        });

        this.setupEventHandlers();

        // Wait for connection
        this.socket.once('connect', () => {
          console.log('Socket initialized and connected');
          resolve();
        });

        // Also resolve on error to prevent hanging
        this.socket.once('connect_error', (error) => {
          console.error('Socket initial connection error:', error);
          resolve();
        });

        // Explicitly calling connect
        this.connect();

        // Fallback safety timeout in case events don't fire
        setTimeout(() => {
          if (this.socket && !this.isConnected) {
            console.warn('Socket init timeout - proceeding anyway');
            resolve();
          }
        }, 5000);
      });
    });
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Log all events (when Swift calls, look for onNormalCallToGroupCall here – if missing, server isn't sending to this client)
    this.socket.onAny((event, ...args) => {
      const isCallEvent = event === 'onNormalCallToGroupCall' || event.toLowerCase().includes('call') || event.toLowerCase().includes('groupcall');
      if (isCallEvent) {
        console.log(`[SocketService] 📞 CALL-RELATED EVENT: ${event}`, args);
      }
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      this.joinGroupIfSession();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    // Server-initiated logout (e.g. login on another device) – match Android SocketConnection mSocket.on('logout', ...)
    this.socket.on('logout', () => {
      console.log('[SocketService] Server sent logout');
      this.handleServerLogout();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    // Add more event handlers as needed
    this.socket.on('message', (data) => {
      console.log('Received message:', data);
      // Handle message event
    });

    // Listen for ALL events for debugging
    this.socket.onAny((eventName, ...args) => {
      
    });

    this.socket.on('call', (data) => {
      console.log('Received call event:', data);
    });

    this.socket.on('onlineUsers', async (data) => {
      console.log('Received onlineUsers event:', data);
      try {
        const raw = Array.isArray(data) ? data[0] : data;
        // The data seems to be a JSON string inside the array: ["{\"users\":...}"]
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const users = parsed.users || {};

        const myUserId = await getStringFromStorage(USER_ID);
        console.log(`[SocketService] Checking online status for UserID: ${myUserId}`);

        if (myUserId && users[myUserId]) {
          console.log(`[SocketService] ✅ I AM ONLINE! (Socket ID: ${users[myUserId]})`);
        } else {
          console.warn(`[SocketService] ❌ I AM NOT IN ONLINE LIST! (My ID: ${myUserId})`);
        }
      } catch (e) {
        console.error('Error parsing onlineUsers:', e);
      }
    });

    this.socket.on('onlineUsersApp', async (data) => {
      try {
        const raw = Array.isArray(data) ? data[0] : data;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const users = parsed.users || {};

        const myUserId = await getStringFromStorage(USER_ID);

      } catch (e) {
        console.error('Error parsing onlineUsersApp:', e);
      }
    });


    // MARK: - Call Events (Matches Swift)

    // 1. Normal Group Call (Matches StrokeTeamOne: show incoming call UI via CallKeep, not direct navigate)
    this.socket.on('onNormalCallToGroupCall', (data: any) => {
      console.log('[SocketService] Received onNormalCallToGroupCall (RAW):', JSON.stringify(data, null, 2));
      let raw = Array.isArray(data) ? data[0] : data;
      const payload = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return raw; } })() : raw;
      if (!payload || !payload.broadcast_id) {
        console.error('[SocketService] onNormalCallToGroupCall payload missing broadcast_id:', payload);
        return;
      }
      console.log('[SocketService] Incoming call via socket – showing CallKeep:', payload.broadcast_id);
      const voipService = require('./voipService').default;
      voipService.handleIncomingCall({
        broadcast_id: payload.broadcast_id,
        caller_name: payload.caller_name || payload.sender_name || payload.sender_display_name,
        sender_name: payload.sender_name || payload.sender_display_name,
        alert_type: 'GroupCall',
      });
    });

    // 2. Chat Request from Mobile – refresh chat requests list (Matches Swift)
    this.socket.on('onChatRequestFromMobile', (data: any) => {
      console.log('Received onChatRequestFromMobile:', JSON.stringify(data, null, 2));
      this.fetchChatRequests().then((list) => {
        if (list) store.dispatch(setChatRequests(list));
      }).catch(() => {});
    });

    // 3. Accepted Chat (If another doctor accepted it) – refresh list
    this.socket.on('onAcceptChatRequestFromDoctor', (data: any) => {
      console.log('Received onAcceptChatRequestFromDoctor:', JSON.stringify(data, null, 2));
      this.fetchChatRequests().then((list) => {
        if (list) store.dispatch(setChatRequests(list));
      }).catch(() => {});
    });

    // Incoming chat message (Matches StrokeTeamOne socket.on("message")) – server may send JSON string or object
    this.socket.on('message', (data: any) => {
      let raw = Array.isArray(data) ? data[0] : data;
      if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch { return; }
      }
      if (!raw || typeof raw !== 'object') return;
      const from = String(raw.from ?? raw.userid ?? raw.sender_id ?? '').trim();
      const rawMsg = raw.message ?? '';
      const broadcastId = (raw.broadcast_id ?? raw.broadCastId ?? raw.broad_id ?? '').toString().trim();
      // For 1-1 chats with no broadcast_id, key by sender id so ChatScreen (keyed by receiverId) shows it
      const chatId = (broadcastId && broadcastId !== '0') ? broadcastId : (from || 'unknown');
      const msg = this.tryDecryptMessageBody(rawMsg);
      const message: ChatMessage = {
        messageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        chatId,
        senderId: String(from ?? ''),
        senderName: raw.from_name ?? raw.sender_name ?? raw.userName ?? raw.name ?? 'Unknown',
        message: msg,
        timestamp: raw.createdOn ?? raw.timestamp ?? new Date().toISOString(),
        messageType: (raw.type === 'image' || raw.type === 'file') ? (raw.type as 'image' | 'document') : 'text',
        broadCastId: broadcastId,
        type: raw.type,
      };
      store.dispatch(addMessage({ chatId, message }));
      // Show native chat notification (StrokeTeamOne-style) – skip if sender is self
      getStringFromStorage(USER_ID).then((currentUserId) => {
        if (from && currentUserId && from !== currentUserId) {
          try {
            NativeModules.ChatNotification?.showChatNotification(message.senderName);
          } catch (_) {}
        }
      }).catch(() => {});
      // Refresh recent chats so unread/last message updates
      this.fetchRecentChats().then((list) => {
        if (list) store.dispatch(setRecentChats(list));
      }).catch(() => {});
    });

    // 4. Cart Access Request
    this.socket.on('requestCartAccess', (data: any) => {
      console.log('Received requestCartAccess:', JSON.stringify(data, null, 2));
      const payload = Array.isArray(data) ? data[0] : data;
      // If this contains meaningful call data, handle it.
      if (payload) {
        console.log('Potential Incoming Call via requestCartAccess:', payload);
      }
    });

    // 5. Call Status Update
    this.socket.on('onCallStatusUpdate', (data: any) => {
      console.log('Received onCallStatusUpdate:', data);
    });

    // 6. Generic "call" event (Just in case)
    this.socket.on('call', (data) => {
      console.log('Received generic "call" event:', data);
    });

    // 7. Catch-all for "request" or "invite" events to debug hidden events
    this.socket.onAny((eventName, ...args) => {
      if (eventName.toLowerCase().includes('call') ||
        eventName.toLowerCase().includes('request') ||
        eventName.toLowerCase().includes('invite')) {
        console.log(`[SocketService] 🕵️ INTERESTING EVENT: ${eventName}`, args);
      }
    });
  }

  private incomingCallCallback: ((roomId: string) => void) | null = null;

  /**
   * Set callback for incoming calls
   */
  onIncomingCall(callback: (roomId: string) => void): void {
    this.incomingCallCallback = callback;
  }

  /**
   * Connect to socket
   */
  private async connect(): Promise<void> {
    if (!this.socket || this.isJoining) return;

    if (this.socket.connected) {
      this.joinGroupIfSession();
    } else {
      this.socket.connect();
    }
  }

  /**
   * Only join group when we have a session (after login). Skips silently when not logged in.
   */
  private async joinGroupIfSession(): Promise<void> {
    const userId = await getStringFromStorage(USER_ID);
    const sessionId = await getStringFromStorage(SESSION_ID);
    if (!userId || !sessionId) {
      if (__DEV__) {
        console.log('[SocketService] No session yet (userId/sessionId missing). Join group will run after login.');
      }
      return;
    }
    this.joinGroup();
  }

  /**
   * Join user group (requires USER_ID and SESSION_ID in storage; call joinGroupIfSession() to gate by session)
   */
  private async joinGroup(): Promise<void> {
    if (!this.socket || this.isJoining) return;

    try {
      const userId = await getStringFromStorage(USER_ID);
      const userType = await getStringFromStorage(USER_TYPE);
      const adminStr = await getStringFromStorage('admin');
      const sessionId = await getStringFromStorage(SESSION_ID);

      const isAdminInt = (adminStr === 'true' || adminStr === '1') ? 1 : 0;

      console.log('Sending integer isAdmin:', isAdminInt);

      if (!userId || !sessionId) {
        if (__DEV__) {
          console.warn('[SocketService] User ID or Session ID not found. Cannot join group.');
        }
        return;
      }

      this.isJoining = true;

      // Match Swift implementation: userID, userType, isAdmin (Int), sessionID
      console.log('Emitting setUser (JOIN_GROUP) with:', { userId, userType: userType || 'Doctor', isAdmin: isAdminInt, sessionId });

      this.socket.emit('setUser', userId, userType || 'Doctor', isAdminInt, sessionId, (response: any) => {
        console.log('setUser ack response:', response);
        this.isJoining = false;

        // Matches Swift: After joining, we fetch chat requests
        // REMOVED: updateDeviceDetails is ONLY called when accepting a call in Swift, not on join.
        this.fetchChatRequests();
        this.updateOfflineStatus(false); // Mark as Online
      });

      this.isJoining = false;
    } catch (error) {
      console.error('Join group error:', error);
      this.isJoining = false;
    }
  }

  /**
   * Emit event with acknowledgement
   */
  emitWithAck(event: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.isConnected) {
        this.socket.emit(event, data, (...args: any[]) => {
          // Return all arguments as an array to match Swift's emitWithAck behavior
          // This ensures that if the server sends a single string, we get [string], 
          // allowing doctorService to access response[0] consistency.
          resolve(args);
        });
      } else {
        // Try to connect if not connected
        if (this.socket && !this.isConnected) {
          console.log('Socket not connected, attempting to connect before emit...');
          this.socket.connect();
          // Simple one-time retry after short delay
          setTimeout(() => {
            if (this.socket && this.isConnected) {
              this.socket.emit(event, data, (response: any) => {
                resolve(response);
              });
            } else {
              reject(new Error(`Socket not connected, cannot emit: ${event}`));
            }
          }, 1000);
        } else {
          console.error(`Socket not initialized, cannot emit: ${event}`);
          reject(new Error(`Socket not initialized, cannot emit: ${event}`));
        }
      }
    });
  }

  /**
   * Emit event
   */
  emit(event: string, data: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }

  /**
   * Listen to event
   */
  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (data: any) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Handle server-initiated logout (e.g. user logged in on another device).
   * Matches Android SocketConnection mSocket.on('logout', ...): disconnect, clear Session, navigate to Splash/Login.
   * Uses removeFromStorage so Keychain is cleared; otherwise next login would still read old session_id and fail.
   */
  private async handleServerLogout(): Promise<void> {
    this.disconnect();
    const keys = [
      SESSION_ID,
      USER_ID,
      USER_NAME,
      USER_TYPE,
      ORGANIZATION_ID,
      ORGANIZATION_NAME,
      ORGANIZATION_COUNT,
      PRACTICE_LOC_ID,
      PRACTICE_LOC_NAME,
      IS_LOGGED_IN,
      SPECIALITY_ID,
      'doctor_id',
      'user_level',
      'admin',
      'designation',
      'token',
      'IsOrganizationSelected',
      'chat_user_name',
      'nuance_org',
      'nuance_guid',
      'nuance_user',
      'time_zone',
      'is_multifactor_enabled',
      'mfaToken',
      'org_list',
    ];
    for (const key of keys) {
      await removeFromStorage(key);
    }
    store.dispatch(logoutAction());
    if (navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] })
      );
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Call after login once SESSION_ID and USER_ID are saved. Joins socket group so user receives chats/calls.
   */
  joinGroupAfterLogin(): void {
    this.joinGroupIfSession();
  }

  /**
   * Try to decrypt chat message body (matches StrokeTeamOne ChatAdapter – Zero IV like AESCrypt() default).
   */
  private tryDecryptMessageBody(raw: string): string {
    if (!raw || typeof raw !== 'string') return raw || '';
    const trimmed = raw.trim();
    if (!trimmed) return raw;
    // If input doesn't look like base64, assume plain text
    if (!this.looksLikeBase64(trimmed)) return trimmed;
    // StrokeTeamOne ChatAdapter uses aesCrypt.decrypt() with AESCrypt() = Zero IV
    let out = decryptDataWithZeroIV(trimmed);
    if (this.isValidDecrypted(out, trimmed)) return out.replace(/\0/g, '').trim();
    out = decryptData(trimmed);
    if (this.isValidDecrypted(out, trimmed)) return out.replace(/\0/g, '').trim();
    return raw;
  }

  private isValidDecrypted(out: string, original: string): boolean {
    if (!out || typeof out !== 'string') return false;
    const s = out.trim();
    if (s.length === 0 || s.length > 10000) return false;
    if (s === original) return false; // No change = decryption failed
    if (this.looksLikeBase64(s)) return false; // Still base64 = failed
    return true;
  }

  private looksLikeBase64(s: string): boolean {
    if (!s || s.length < 16) return false;
    return /^[A-Za-z0-9+/=]+$/.test(s);
  }

  /**
   * Cart Control Methods (matches Android SocketConnection)
   */
  
  // Request cart access
  requestCartAccess(cartId: string): void {
    this.emit('getCartAccess', { cart_id: cartId });
  }

  // Release cart access
  releaseCartAccess(): void {
    this.emit('releaseCartAccess', {});
  }

  // Cancel cart access request
  cancelRequestCartAccess(): void {
    this.emit('cancelRequestCartAccess', {});
  }

  // Grant cart access
  grantCartAccess(granted: boolean): void {
    this.emit('grantCartAccess', { granted });
  }

  // Get cart camera list
  getCartCameraList(cartId: string, userId: string): void {
    this.emit('getCartCameraListAccess', { cart_id: cartId, user_id: userId });
  }

  // Camera control - Tilt
  sendTiltUpRequest(): void {
    this.emit('tiltUpRequest', {});
  }

  sendTiltDownRequest(): void {
    this.emit('tiltDownRequest', {});
  }

  sendTiltLeftRequest(): void {
    this.emit('tiltLeftRequest', {});
  }

  sendTiltRightRequest(): void {
    this.emit('tiltRightRequest', {});
  }

  // Camera control - Zoom
  sendZoomInRequest(count: number = 2): void {
    this.emit('zoomInRequest', { count });
  }

  sendZoomOutRequest(count: number = 2): void {
    this.emit('zoomOutRequest', { count });
  }

  sendZoomResetRequest(): void {
    this.emit('zoomResetRequest', {});
  }

  // Camera control - Reset
  sendResetCameraRequest(): void {
    this.emit('resetCameraRequest', {});
  }

  // Camera control - Rectangle pan/tilt (for drag selection)
  moveRectTopLeft(panAngle: string, tiltAngle: string, hScale: string, vScale: string): void {
    this.emit('moveRectTopLeft', { panAngle, tiltAngle, hScale, vScale });
  }

  moveRectTopRight(panAngle: string, tiltAngle: string, hScale: string, vScale: string): void {
    this.emit('moveRectTopRight', { panAngle, tiltAngle, hScale, vScale });
  }

  moveRectBottomLeft(panAngle: string, tiltAngle: string, hScale: string, vScale: string): void {
    this.emit('moveRectBottomLeft', { panAngle, tiltAngle, hScale, vScale });
  }

  moveRectBottomRight(panAngle: string, tiltAngle: string, hScale: string, vScale: string): void {
    this.emit('moveRectBottomRight', { panAngle, tiltAngle, hScale, vScale });
  }

  // Add participant to group call
  addNewGroupCallParticipant(participants: string[]): void {
    const jsonArray = JSON.stringify(participants);
    this.emit('addNewGroupCallParticipant', jsonArray);
  }

  // Fetch joined users for adding participants
  fetchJoinedUsers(): void {
    this.emit('fetchJoinedUsers', {});
  }

  // Fetch joined cart users
  fetchJoinedCartUsers(): void {
    this.emit('fetchJoinedCartUsers', {});
  }

  /**
   * Fetch users for conference call (Matches StrokeTeamOne SocketConnection.fetchUsersMobileNew)
   * Returns list of role groups (CART, CLINICAL, DOCTOR) with users
   */
  async fetchUsersMobileNew(clearFlag: boolean, isGroupChat: boolean): Promise<GroupContactNew[]> {
    try {
      if (!this.socket || !this.isConnected) return [];
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);
      if (!userId || !orgId) return [];

      const params = { user_id: userId, organization_id: orgId, is_group_chat: isGroupChat };
      const args = await this.emitWithAck('fetchUsersMobileNew', JSON.stringify(params));
      const raw = args?.[0];
      if (raw == null) return [];

      const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
      const dec = decryptJSON(str);
      // Root can be { usersList: [...] } or the array itself (matches Android GroupContactNew)
      const usersList = Array.isArray(dec?.usersList) ? dec.usersList : (Array.isArray(dec?.users_list) ? dec.users_list : (Array.isArray(dec) ? dec : []));
      return usersList.map((item: any) => ({
        rolename: item.role_name ?? item.rolename ?? '',
        users: Array.isArray(item.users) ? item.users.map((u: any) => ({
          id: String(u.id ?? u.user_id ?? ''),
          userName: u.user_name ?? u.userName ?? '',
          selected: false,
        })) : [],
      }));
    } catch (e) {
      console.error('fetchUsersMobileNew error:', e);
      return [];
    }
  }

  /**
   * Join existing meeting by broadcast/meeting ID (Matches StrokeTeamOne SocketConnection.joinExistingMeeting)
   * On success (code 200), returns the broadcastId to join
   */
  async joinExistingMeeting(broadcastId: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      getStringFromStorage(USER_ID).then((userId) => {
        if (!userId) {
          reject(new Error('User ID not found'));
          return;
        }
        this.socket!.emit('joinExistingMeeting', userId, broadcastId, '', (...args: any[]) => {
          try {
            const raw = args?.[0];
            if (raw == null) {
              reject(new Error('No response from joinExistingMeeting'));
              return;
            }
            const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
            const dec = decryptJSON(str);
            if (dec?.code === '200') {
              resolve(broadcastId);
            } else {
              reject(new Error(dec?.message || 'Failed to join meeting'));
            }
          } catch (e) {
            console.error('joinExistingMeeting error:', e);
            reject(e);
          }
        });
      });
    });
  }

  /**
   * Generate Group Call (Jitsi)
   * Matches Swift TiaChatManager.generateGroupCall
   */
  async generateGroupCall(
    userId: string,
    userName: string,
    participantsId: string[],
    organizationId: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const params = {
        caller_id: userId,
        caller_name: userName,
        participants: participantsId,
        old_broadcast: '0',
        organization_id: organizationId,
      };

      console.log('generateGroupCall params:', params);

      // JSON stringify params (Swift: UtilitySwift.getJsonStringFromDictionary)
      // Note: Swift implementation of getJsonStringFromDictionary does NOT encrypt the params,
      // only the response is encrypted.
      // However, we should double check if the server expects a raw JSON string or object.
      // Swift uses: socket.emitWithAck("newGroupCall", json_params) where json_params is a string.
      const jsonParams = JSON.stringify(params);

      this.socket.emit('newGroupCall', jsonParams, (...args: any[]) => {
        console.log('newGroupCall ack args:', args);

        const response = args.length > 0 ? args[0] : null;

        if (!response) {
          console.error('Invalid/empty response from newGroupCall');
          reject(new Error('Invalid response from newGroupCall'));
          return;
        }

        try {
          // Check if response is already an object (unencrypted)
          if (typeof response === 'object' && response !== null && response.broadcast_id) {
            console.log('Received unencrypted broadcast_id:', response.broadcast_id);
            resolve(response.broadcast_id);
            return;
          }

          // If response is a string, it might be the encrypted string directly
          // Swift code expects data[0] as String. If args array has string at 0, uses that.
          // If response IS the string, use it.
          let encryptedStr = '';
          if (typeof response === 'string') {
            encryptedStr = response;
          } else if (Array.isArray(response) && response.length > 0) {
            encryptedStr = response[0];
          } else {
            // Fallback: cast to string
            encryptedStr = String(response);
          }

          console.log('newGroupCall raw encryptedStr:', encryptedStr);

          // Import decryptJSON dynamically or assume it's available via encryption.ts
          // We'll use the one from utils
          const { decryptJSON } = require('../utils/encryption');
          const decryptedData = decryptJSON(encryptedStr);

          console.log('newGroupCall decrypted:', decryptedData);

          if (decryptedData && decryptedData.broadcast_id) {
            resolve(decryptedData.broadcast_id);
          } else {
            console.error('No broadcast_id in decrypted data');
            reject(new Error('Failed to generate room ID'));
          }
        } catch (error) {
          console.error('Error processing newGroupCall response:', error);
          reject(error);
        }
      });
    });
  }
  /**
   * Fetch recent chats (Matches Swift fetchRecentChatList / Android fetchRecentChats)
   * Emit fetchRecentChatsTiaTele; ack is encrypted, returns { code, data: { recent_chats: [...] } }
   */
  public async fetchRecentChats(): Promise<Chat[]> {
    try {
      if (!this.socket || !this.isConnected) return [];
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);
      if (!userId || !orgId) return [];

      const params = { user_id: userId, organization_id: orgId };
      const args = await this.emitWithAck('fetchRecentChatsTiaTele', JSON.stringify(params));
      const raw = args?.[0];
      if (raw == null) return [];

      const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
      const dec = decryptJSON(str);
      if (!dec || dec.code !== '100' || !dec.data?.recent_chats) return [];

      const recent_chats = Array.isArray(dec.data.recent_chats) ? dec.data.recent_chats : [];
      return recent_chats.map((item: any) => {
        const chatId = String(item.broadcast_id ?? item.broadcastId ?? item.id ?? item.chat_id ?? '');
        const receiverId = item.member_id ?? item.memberId ?? item.user_id ?? item.userId ?? item.other_user_id ?? item.to_user_id ?? chatId;
        return {
        chatId,
        broadcastId: String(item.broadcast_id ?? item.broadcastId ?? item.id ?? item.chat_id ?? ''),
        chatName: item.member_name || item.memberName || item.user_name || item.userName || 'Unknown',
        lastMessage: item.message,
        lastMessageTime: item.created_at ?? item.createdAt,
        unreadCount: item.unread_count != null ? parseInt(String(item.unread_count), 10) : 0,
        isGroup: (item.group_chat ?? item.is_group_chat) === '1' || (item.group_chat ?? item.is_group_chat) === true,
        receiverId: String(receiverId ?? ''),
        last_msg_user_name: item.last_msg_user_name,
        type: item.type,
        fileName: item.file_name ?? item.fileName,
      } as Chat;
      });
    } catch (e) {
      console.error('fetchRecentChats error:', e);
      return [];
    }
  }

  /**
   * Fetch chat requests (Matches Swift/Android). Returns list for Redux.
   */
  public async fetchChatRequests(): Promise<ChatRequest[]> {
    try {
      if (!this.socket || !this.isConnected) return [];
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);
      if (!userId || !orgId) return [];

      const params = { user_id: userId, organization_id: orgId };
      const args = await this.emitWithAck('fetchChatRequests', JSON.stringify(params));
      const raw = args?.[0];
      if (raw == null) return [];

      const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
      const dec = decryptJSON(str);
      if (!dec || dec.code !== '100' || !dec.data?.chat_requests) return [];

      const arr = Array.isArray(dec.data.chat_requests) ? dec.data.chat_requests : [];
      return arr.map((item: any) => ({
        broadcast_id: String(item.broadcast_id ?? item.broadcastId ?? ''),
        user_id: String(item.user_id ?? item.userId ?? ''),
        user_name: item.user_name ?? item.userName ?? '',
        created_at: item.created_at ?? item.createdAt,
        chat_type: item.chat_type ?? item.chatType,
        appointment_id: item.appointment_id ?? item.appointmentId,
      } as ChatRequest));
    } catch (e) {
      console.error('fetchChatRequests error:', e);
      return [];
    }
  }

  /**
   * Fetch chat messages for a thread (Matches Swift fetchChats / Android fetchChatThread)
   * Params: to (receiver id), broadcast_id, offset, is_group_chat. Offset as string to match Android.
   */
  public async fetchChat(to: string, broadcastId: string, offset: number, isGroupChat: boolean): Promise<ChatMessage[]> {
    try {
      const toId = String(to || '').trim();
      if (!toId || toId === '0') {
        console.warn('[SocketService] fetchChat: invalid to (empty or 0), skipping');
        return [];
      }
      if (!this.socket || !this.isConnected) return [];
      const from = await getStringFromStorage(USER_ID);
      if (!from) return [];

      const brId = broadcastId ? parseInt(broadcastId, 10) : 0;
      const params = { from, to: toId, offset: String(offset), broadcast_id: isNaN(brId) ? 0 : brId, is_group_chat: isGroupChat };
      console.log('[SocketService] fetchChat params:', params);
      const args = await this.emitWithAck('fetchChat', JSON.stringify(params));
      const raw = args?.[0];
      if (raw == null) return [];

      const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
      const dec = decryptJSON(str);
      const messagesArray = Array.isArray(dec?.result) ? dec.result : (Array.isArray(dec?.messageArrayList) ? dec.messageArrayList : []);
      if (!dec || messagesArray.length === 0) {
        if (dec) console.log('[SocketService] fetchChat response:', dec.status, 'result count:', messagesArray.length);
        return [];
      }

      const chatId = broadcastId || to || 'unknown';
      return messagesArray.map((item: any) => {
        const rawBody = item.message ?? '';
        const body = this.tryDecryptMessageBody(rawBody);
        return {
        messageId: item.id ?? item.message_id ?? `msg-${item.createdOn ?? Date.now()}`,
        chatId,
        senderId: String(item.userid ?? item.sender_id ?? item.from ?? ''),
        senderName: item.userName ?? item.sender_name ?? item.from_name ?? 'Unknown',
        message: body,
        timestamp: item.createdOn ?? item.timestamp ?? item.created_at ?? new Date().toISOString(),
        messageType: (item.type === 'image' || item.type === 'file') ? (item.type as 'image' | 'document') : 'text',
        broadCastId: broadcastId,
        type: item.type,
        sortTime: item.sortTime ?? item.createdOn,
      } as ChatMessage;
      });
    } catch (e) {
      console.error('fetchChat error:', e);
      return [];
    }
  }

  /**
   * Send chat message (Matches Swift sendChatMessage / Android privateMessageWeb)
   * Android encrypts the message body; we do the same for backend compatibility.
   */
  public async sendChatMessage(
    message: string,
    broadcastId: string,
    receiverId: string,
    isGroupChat: boolean,
    groupName: string = '',
    selectedUsers: number[] = [],
    isPriority: boolean = false
  ): Promise<ChatMessage | null> {
    try {
      const toId = String(receiverId || '').trim();
      if (!toId || toId === '0') {
        console.warn('[SocketService] sendChatMessage: invalid receiverId (empty or 0), cannot send');
        return null;
      }
      if (!this.socket || !this.isConnected) return null;
      const from = await getStringFromStorage(USER_ID);
      if (!from) return null;

      // StrokeTeamOne uses AESCrypt() = Zero IV for privateMessageWeb
      const messageEncrypted = encryptDataWithZeroIV(message.replace(/\n/g, ''));
      const params = {
        to: toId,
        from,
        message: messageEncrypted,
        broad_id: broadcastId || '0',
        is_group_chat: isGroupChat,
        selected_users: selectedUsers,
        is_priority_message: isPriority ? '1' : '0',
        group_name: groupName,
      };
      console.log('[SocketService] privateMessageWeb params (message encrypted):', { ...params, message: '[encrypted]' });
      const args = await this.emitWithAck('privateMessageWeb', JSON.stringify(params));
      const raw = args?.[0];
      if (raw == null) return null;

      const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
      const dec = decryptJSON(str);
      if (!dec) {
        console.warn('[SocketService] sendChatMessage ack decrypt failed or empty');
        return null;
      }

      const chatId = broadcastId || receiverId || 'unknown';
      // Use the plain text we sent for display; server may return encrypted or different format
      const msg: ChatMessage = {
        messageId: dec.id ?? dec.message_id ?? `msg-${Date.now()}`,
        chatId,
        senderId: from,
        senderName: dec.userName ?? dec.sender_name ?? (await getStringFromStorage('user_name')) ?? 'You',
        message,
        timestamp: dec.createdOn ?? dec.timestamp ?? new Date().toISOString(),
        messageType: (dec.type === 'image' || dec.type === 'file') ? (dec.type as 'image' | 'document') : 'text',
        broadCastId: broadcastId,
        type: dec.type,
      };
      return msg;
    } catch (e) {
      console.error('sendChatMessage error:', e);
      return null;
    }
  }

  /**
   * Accept chat request (Matches Swift acceptChatRequest)
   */
  public async acceptChatRequest(broadcastId: string, appointmentId: string = '0'): Promise<void> {
    try {
      if (!this.socket || !this.isConnected) return;
      const userId = await getStringFromStorage(USER_ID);
      if (!userId) return;

      const params = { user_id: userId, broadcast_id: broadcastId, appointment_id: appointmentId };
      this.socket.emit('acceptNewChatRequest', JSON.stringify(params));
      const list = await this.fetchChatRequests();
      store.dispatch(setChatRequests(list));
    } catch (e) {
      console.error('acceptChatRequest error:', e);
    }
  }

  /**
   * Reject chat request (Matches Swift rejectChatRequest)
   */
  public async rejectChatRequest(broadcastId: string, appointmentId: string = '0'): Promise<void> {
    try {
      if (!this.socket || !this.isConnected) return;
      const userId = await getStringFromStorage(USER_ID);
      if (!userId) return;

      const params = { user_id: userId, broadcast_id: broadcastId, appointment_id: appointmentId };
      this.socket.emit('rejectNewChatRequest', JSON.stringify(params));
      const list = await this.fetchChatRequests();
      store.dispatch(setChatRequests(list));
    } catch (e) {
      console.error('rejectChatRequest error:', e);
    }
  }

  /**
   * Accept group call (Matches StrokeTeamOne SocketConnection.acceptGroupCall).
   * Must be called when user joins so server adds them to the call; then updateDeviceDetails.
   */
  public async acceptGroupCall(broadcastId: string): Promise<void> {
    try {
      if (!this.socket) {
        console.warn('[SocketService] acceptGroupCall: socket null');
        return;
      }
      const userId = await getStringFromStorage(USER_ID);
      if (!userId) {
        console.warn('[SocketService] acceptGroupCall: no userId');
        return;
      }
      console.log('[SocketService] acceptGroupCall:', userId, broadcastId);
      this.socket.emit('acceptGroupCall', userId, broadcastId);
      await this.updateDeviceDetails(broadcastId);
    } catch (e) {
      console.error('[SocketService] acceptGroupCall error:', e);
    }
  }

  /**
   * Update device details (Matches Swift implementation)
   */
  public async updateDeviceDetails(broadcastID: string) {
    try {
      if (!this.socket) return;
      const userId = await getStringFromStorage(USER_ID);


      // Match Swift: "iOS". Match StrokeTeamOne (AppConstants.RESOURCE_TYPE.toUpperCase()): "ANDROID".
      const deviceType = Platform.OS === 'ios' ? 'iOS' : 'ANDROID';
      // In a real RN app we'd use react-native-device-info
      const deviceVersion = "1.0";
      const deviceModel = "React Native";
      const deviceId = "RN_DEVICE_ID";

      const params = {
        broadcast_id: broadcastID,
        user_id: userId,
        device_type: deviceType,
        device_version: deviceVersion,
        device_model: deviceModel,
        device_id: deviceId
      };

      console.log('Emitting updateReceiverDeviceDetails:', params);
      this.socket.emit('updateReceiverDeviceDetails', JSON.stringify(params));
    } catch (error) {
      console.error('Error updating device details:', error);
    }
  }
  /**
   * Update offline status (Matches Swift implementation)
   */
  public async updateOfflineStatus(isOffline: boolean) {
    try {
      if (!this.socket) return;
      const userId = await getStringFromStorage(USER_ID);

      const status = isOffline ? "1" : "0";

      const params = {
        user_id: userId,
        status: status
      };

      console.log('Emitting updateOfflineStatus:', params);
      this.socket.emit('updateOfflineStatus', JSON.stringify(params));
    } catch (error) {
      console.error('Error updating offline status:', error);
    }
  }

  /**
   * Fetch call log history (Matches StrokeTeamOne SocketConnection.fetchAllCallLogHistory)
   * Emit fetchCallHistory; ack is encrypted, returns { code, data: CallLog[] }
   */
  public async fetchCallHistory(
    offset: string,
    callType: '' | 'missed',
    currentDate: string,
    flagClear: boolean = true
  ): Promise<CallLog[]> {
    try {
      if (!this.socket || !this.isConnected) {
        console.log('[fetchCallHistory] Socket not connected, attempting init...');
        await this.initSocket();
        if (!this.socket || !this.isConnected) {
          console.warn('[fetchCallHistory] Socket still not connected');
          return [];
        }
      }
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);
      if (!userId || !orgId) {
        console.warn('[fetchCallHistory] Missing userId or orgId');
        return [];
      }

      const params = {
        user_id: userId,
        call_type: callType,
        start: offset,
        current_date: currentDate,
        organization_id: orgId,
      };
      console.log('[fetchCallHistory] Emitting with params:', params);
      const args = await this.emitWithAck('fetchCallHistory', JSON.stringify(params));
      const raw = args?.[0];
      if (raw == null) {
        console.warn('[fetchCallHistory] No response from server');
        return [];
      }

      console.log('[fetchCallHistory] Raw response type:', typeof raw);
      console.log('[fetchCallHistory] Raw response (first 500 chars):', typeof raw === 'string' ? raw.substring(0, 500) : JSON.stringify(raw).substring(0, 500));

      const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
      let dec = decryptJSON(str);
      console.log('[fetchCallHistory] Decrypted data:', dec ? JSON.stringify(dec).substring(0, 1000) : null);
      if (dec) {
        console.log('[fetchCallHistory] dec.code:', dec.code, 'dec.status:', dec.status, 'dec.data type:', typeof dec.data, 'dec.data isArray:', Array.isArray(dec.data));
        if (dec.data && Array.isArray(dec.data)) {
          console.log('[fetchCallHistory] Call logs count:', dec.data.length, 'First item:', dec.data[0] ? JSON.stringify(dec.data[0]) : 'N/A');
        }
      }
      // If decrypt returns null, raw might already be a plain object
      if (!dec && typeof raw === 'object' && raw !== null) {
        dec = raw as any;
      }
      if (!dec) {
        console.warn('[fetchCallHistory] Decryption failed or null');
        return [];
      }
      // Accept code as "100" or 100
      const codeOk = dec.code === '100' || dec.code === 100;
      if (!codeOk) {
        console.log('[fetchCallHistory] Non-success code:', dec.code, dec.status);
        return [];
      }

      // Data can be in dec.data, dec.call_log_list, dec.callLogList
      let data = dec.data;
      if (!data && dec.call_log_list) data = dec.call_log_list;
      if (!data && dec.callLogList) data = dec.callLogList;
      if (!data && Array.isArray(dec)) data = dec;

      if (!data) return [];
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('fetchCallHistory error:', e);
      return [];
    }
  }

  /**
   * Initiate 1:1 call from call logs (Matches StrokeTeamOne SocketConnection.initiateCall)
   * Returns broadcast_id (Jitsi room ID) on success
   */
  public async initiateCall(
    receiverId: string,
    patientId: string = '0',
    appointmentId: string = '',
    role: string = '',
    callType: string = 'call_logs'
  ): Promise<string | null> {
    try {
      if (!this.socket || !this.isConnected) return null;
      const senderId = await getStringFromStorage(USER_ID);
      const senderName = await getStringFromStorage(USER_NAME);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);
      if (!senderId || !orgId) return null;

      const params = {
        sender_id: senderId,
        receiver_id: receiverId,
        sender_name: senderName || '',
        patient_id: patientId,
        organization_id: orgId,
        appointment_id: appointmentId || '',
        role: role || '',
        call_type: callType,
        device_id: 'RN_DEVICE_ID',
        device_type: Platform.OS === 'ios' ? 'iOS' : 'ANDROID',
        app_name: 'TiaTele MD',
        app_version: '1.0',
        device_model: 'React Native',
        device_version: '1.0',
      };
      const args = await this.emitWithAck('initiateCall', JSON.stringify(params));
      const raw = args?.[0];
      if (raw == null) return null;

      const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
      const dec = decryptJSON(str);
      const broadcastId = dec?.broadcast_id ?? dec?.broadcastId ?? null;
      return broadcastId ? String(broadcastId) : null;
    } catch (e) {
      console.error('initiateCall error:', e);
      return null;
    }
  }
}

export default new SocketService();
