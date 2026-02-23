/**
 * Chat Screen – Matches Swift/Android 1-1 and group chat
 * Loads messages via fetchChat; sends via privateMessageWeb; incoming via socket 'message' (handled in socketService → Redux).
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { getAndClearNextChatParams } from '../../navigation/nextChatParams';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setMessages, addMessage, setPendingChatParams } from '../../store/slices/chatSlice';
import { ChatMessage } from '../../types';
import socketService from '../../services/socketService';
import { COLORS } from '../../constants';
import { formatDateTime } from '../../utils/dateFormatter';
import { getStringFromStorage } from '../../utils/storage';
import { USER_ID } from '../../constants';

type RouteParams = {
  chatId: string;
  chatName: string;
  isGroup?: boolean;
  receiverId?: string;
};

const ChatScreen: React.FC = () => {
  const route = useRoute<{ params?: RouteParams }>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { messages, pendingChatParams } = useAppSelector((state) => state.chat);
  const { user } = useAppSelector((state) => state.auth);

  // Resolved params: read from sync nextParams on every focus (so we get params even when screen is reused)
  const [resolvedParams, setResolvedParams] = useState<{ chatId: string; chatName: string; isGroup: boolean; receiverId?: string } | null>(() => {
    const p = getAndClearNextChatParams();
    if (p && (p.chatId || p.receiverId)) {
      return { chatId: p.chatId ?? '', chatName: p.chatName ?? 'Chat', isGroup: p.isGroup ?? false, receiverId: p.receiverId };
    }
    return null;
  });
  useFocusEffect(
    useCallback(() => {
      const p = getAndClearNextChatParams();
      if (p && (p.chatId || p.receiverId)) {
        setResolvedParams({ chatId: p.chatId ?? '', chatName: p.chatName ?? 'Chat', isGroup: p.isGroup ?? false, receiverId: p.receiverId });
      }
    }, [])
  );
  const params = route.params;
  const fromSession = pendingChatParams;
  const effectiveParams =
    resolvedParams && (resolvedParams.chatId || resolvedParams.receiverId)
      ? resolvedParams
      : params?.chatId || params?.receiverId
        ? { chatId: params?.chatId ?? '', chatName: params?.chatName ?? 'Chat', isGroup: params?.isGroup ?? false, receiverId: params?.receiverId }
        : fromSession
          ? { chatId: fromSession.chatId ?? '', chatName: fromSession.chatName ?? 'Chat', isGroup: fromSession.isGroup ?? false, receiverId: fromSession.receiverId }
          : null;

  const chatId = (effectiveParams?.chatId ?? '').toString().trim();
  const chatName = effectiveParams?.chatName ?? 'Chat';
  const isGroup = effectiveParams?.isGroup ?? false;
  const paramReceiverId = effectiveParams?.receiverId;

  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [paramsSettled, setParamsSettled] = useState(false);
  // Lock in first valid params so we don't show "Invalid chat" when route/Redux lag or clear
  const lockedParamsRef = useRef<typeof effectiveParams | null>(null);

  // StrokeTeamOne: valid chat = has chatId (broadcast/thread) OR receiverId (other user). Use whichever is valid for API "to".
  const hasValidChatId = chatId && chatId !== '0';
  const hasValidParamReceiver = paramReceiverId != null && String(paramReceiverId).trim() !== '' && String(paramReceiverId).trim() !== '0';
  const receiverId = hasValidParamReceiver ? String(paramReceiverId).trim() : (hasValidChatId ? chatId : '');
  const hasValidReceiver = receiverId && receiverId !== '0';
  const hasValidChat = effectiveParams && (hasValidChatId || hasValidReceiver);

  // Once we have valid params, lock them in so later renders don't lose them
  if (effectiveParams && hasValidChat && !lockedParamsRef.current) {
    lockedParamsRef.current = effectiveParams;
  }
  const displayParams = lockedParamsRef.current ?? effectiveParams;
  const displayChatId = (displayParams?.chatId ?? '').toString().trim();
  const displayChatName = displayParams?.chatName ?? 'Chat';
  const displayIsGroup = displayParams?.isGroup ?? false;
  const displayParamReceiver = displayParams?.receiverId != null && String(displayParams.receiverId).trim() !== '' && String(displayParams.receiverId).trim() !== '0';
  const displayReceiverId = displayParamReceiver ? String(displayParams!.receiverId).trim() : (displayChatId && displayChatId !== '0' ? displayChatId : '');
  const displayHasValidChat = !!displayParams && (displayChatId !== '0' && displayChatId !== '' || (displayReceiverId !== '' && displayReceiverId !== '0'));

  useEffect(() => {
    const t = setTimeout(() => setParamsSettled(true), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (fromSession) dispatch(setPendingChatParams(null));
  }, [dispatch, fromSession]);

  // For 1-1 new chat (no broadcast_id), key by receiverId so incoming messages (keyed by sender=receiver) show
  const messagesKey = displayChatId && displayChatId !== '0' ? displayChatId : displayReceiverId || displayChatId;
  const chatMessages = useMemo(() => {
    const list = messages[messagesKey] || [];
    return [...list].sort((a, b) => {
      const t1 = new Date(a.timestamp || a.sortTime || 0).getTime();
      const t2 = new Date(b.timestamp || b.sortTime || 0).getTime();
      return t1 - t2;
    });
  }, [messages, messagesKey]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const uid = await getStringFromStorage(USER_ID);
      if (!cancelled) setCurrentUserId(uid || user?.userId || '');

      const list = await socketService.fetchChat(displayReceiverId, displayChatId, 0, displayIsGroup);
      if (!cancelled && list.length > 0) {
        dispatch(setMessages({ chatId: messagesKey, messages: list }));
      }
      if (!cancelled) setLoading(false);
    };

    if (displayHasValidChat && displayReceiverId) {
      load();
    } else {
      if (!cancelled) setLoading(false);
    }
    return () => { cancelled = true; };
  }, [displayChatId, displayReceiverId, displayIsGroup, displayHasValidChat, messagesKey, dispatch]);

  // Guard: need valid chat (chatId or receiverId). Wait for params to settle so Redux/route have a tick to provide data.
  if (!paramsSettled) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingHint}>Loading chat...</Text>
      </View>
    );
  }
  if (!displayHasValidChat) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Invalid chat. Missing chat details.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSendMessage = async () => {
    const text = messageText.trim();
    if (!text) return;
    if (!displayReceiverId || displayReceiverId === '0') return;
    setMessageText('');
    const groupName = displayIsGroup ? displayChatName : '';
    const sent = await socketService.sendChatMessage(
      text,
      displayChatId,
      displayReceiverId,
      displayIsGroup,
      groupName,
      [],
      false
    );
    if (sent) {
      dispatch(addMessage({ chatId: messagesKey, message: sent }));
    } else {
      const fallback: ChatMessage = {
        messageId: `msg-${Date.now()}`,
        chatId,
        senderId: currentUserId || user?.userId || '',
        senderName: user?.userName ?? 'You',
        message: text,
        timestamp: new Date().toISOString(),
        messageType: 'text',
      };
      dispatch(addMessage({ chatId: messagesKey, message: fallback }));
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.senderId === currentUserId || item.senderId === user?.userId;
    const timeStr = item.timestamp ? formatDateTime(item.timestamp) : '';

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwnMessage && <Text style={styles.senderName}>{item.senderName}</Text>}
        <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>{item.message}</Text>
        {timeStr ? <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageText]}>{timeStr}</Text> : null}
      </View>
    );
  };

  const chatTitle = displayChatName.length > 20 ? `${displayChatName.slice(0, 20)}…` : displayChatName;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.chatBlueDark} />
      <LinearGradient
        colors={[COLORS.chatBlueDark, COLORS.chatBlueLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.chatHeader}
      >
        <View style={styles.headerChatIconWrap}>
          <Text style={styles.headerIconText}>💬</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackWrap}>
          <Text style={styles.headerIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Chat with {chatTitle}</Text>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Text style={styles.headerIconText}>➕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Text style={styles.headerIconText}>🔍</Text>
        </TouchableOpacity>
      </LinearGradient>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={chatMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.messageId}
          contentContainerStyle={styles.messagesList}
          inverted={false}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textSecondary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity style={styles.attachBtn} accessibilityLabel="Attach file">
            <Text style={styles.inputIconText}>📎</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} accessibilityLabel="Send message">
            <Text style={styles.sendIconText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
  },
  headerChatIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerBackWrap: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconBtn: {
    minWidth: 44,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 22,
    color: '#FFF',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 10,
  },
  keyboardWrap: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingHint: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8E8E8',
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 20,
  },
  ownMessageText: {
    color: COLORS.white,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 8,
    fontSize: 15,
    color: COLORS.text,
  },
  attachBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00897B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputIconText: {
    fontSize: 22,
    color: COLORS.textSecondary,
  },
  sendIconText: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
  },
  sendButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default ChatScreen;
