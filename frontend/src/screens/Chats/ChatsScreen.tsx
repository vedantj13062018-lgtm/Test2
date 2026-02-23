/**
 * Chats List Screen – Matches StrokeTeamOne ChatMainActivity
 * Tabs: CHAT | CHAT REQUEST
 * Same UI, API fetching via socketService (fetchRecentChats, fetchChatRequests)
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { navigate as navRefNavigate } from '../../navigation/navigationRef';
import { setNextChatParams } from '../../navigation/nextChatParams';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setRecentChats, setChatRequests, setPendingChatParams } from '../../store/slices/chatSlice';
import { Chat, ChatRequest } from '../../types';
import { COLORS } from '../../constants';
import { formatChatTimestamp } from '../../utils/dateFormatter';
import socketService from '../../services/socketService';
import CustomDrawer from '../../components/CustomDrawer';

const ChatsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { recentChats, chatRequests } = useAppSelector((state) => state.chat);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const loadRecentChats = useCallback(async () => {
    setLoadingRecent(true);
    try {
      const list = await socketService.fetchRecentChats();
      dispatch(setRecentChats(list));
    } finally {
      setLoadingRecent(false);
    }
  }, [dispatch]);

  const loadChatRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const list = await socketService.fetchChatRequests();
      dispatch(setChatRequests(list));
    } finally {
      setLoadingRequests(false);
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadRecentChats();
      loadChatRequests();
    }, [loadRecentChats, loadChatRequests])
  );

  const handleChatPress = (chat: Chat) => {
    const chatId = (chat.chatId || chat.broadcastId || '').toString().trim();
    const receiverId = (chat.receiverId || chat.chatId || '').toString().trim();
    // Must have at least one valid id (not empty, not '0')
    const validChatId = chatId && chatId !== '0';
    const validReceiverId = receiverId && receiverId !== '0';
    if (!validChatId && !validReceiverId) {
      return; // Don't navigate with invalid data
    }
    const params = {
      chatId: validChatId ? chatId : '',
      receiverId: validReceiverId ? receiverId : chatId,
      chatName: chat.chatName ?? 'Chat',
      isGroup: chat.isGroup ?? false,
    };
    dispatch(setPendingChatParams(params));
    setNextChatParams(params);
    navRefNavigate('Chat', params);
  };

  const handleAcceptRequest = async (req: ChatRequest) => {
    await socketService.acceptChatRequest(req.broadcast_id, req.appointment_id || '0');
    await loadChatRequests();
    const params = {
      chatId: req.broadcast_id,
      chatName: req.user_name,
      isGroup: false,
      receiverId: req.user_id,
    };
    dispatch(setPendingChatParams(params));
    setNextChatParams(params);
    navRefNavigate('Chat', params);
  };

  const handleRejectRequest = async (req: ChatRequest) => {
    await socketService.rejectChatRequest(req.broadcast_id, req.appointment_id || '0');
    await loadChatRequests();
  };

  const handleStartNewChat = () => {
    navRefNavigate('Directory', { fromStartNewChat: true });
  };

  const handleBackPress = () => {
    navRefNavigate('MainTabs', { screen: 'Dashboard' });
  };

  const renderRecentItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity style={styles.chatItem} onPress={() => handleChatPress(item)} activeOpacity={0.7}>
      <View style={styles.avatarWrapper}>
        <LinearGradient
          colors={[COLORS.chatBlueDark, COLORS.chatBlueLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.avatarGradient}
        >
          <Icon name="person" size={26} color={COLORS.white} />
        </LinearGradient>
      </View>
      <View style={styles.chatContent}>
        <Text style={styles.chatName} numberOfLines={1}>{item.chatName}</Text>
        {(item.lastMessage != null && item.lastMessage !== '') && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_msg_user_name ? `${item.last_msg_user_name}: ` : ''}{item.lastMessage}
          </Text>
        )}
      </View>
      {item.lastMessageTime && (
        <Text style={styles.timestamp}>{formatChatTimestamp(item.lastMessageTime)}</Text>
      )}
    </TouchableOpacity>
  );

  const renderRequestItem = ({ item }: { item: ChatRequest }) => (
    <View style={styles.requestItem}>
      <View style={styles.requestContent}>
        <View style={styles.avatarWrapper}>
          <LinearGradient
            colors={[COLORS.chatBlueDark, COLORS.chatBlueLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.avatarGradient}
          >
            <Icon name="person" size={26} color={COLORS.white} />
          </LinearGradient>
        </View>
        <View style={styles.requestTextContent}>
          <Text style={styles.chatName}>{item.user_name}</Text>
          {item.created_at && (
            <Text style={styles.timestamp}>{formatChatTimestamp(item.created_at)}</Text>
          )}
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.requestBtn, styles.rejectBtn]}
          onPress={() => handleRejectRequest(item)}
        >
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.requestBtn, styles.acceptBtn]}
          onPress={() => handleAcceptRequest(item)}
        >
          <Text style={styles.acceptBtnText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const loading = tabIndex === 0 ? loadingRecent : loadingRequests;
  const list = tabIndex === 0 ? recentChats : chatRequests;
  const emptyText = tabIndex === 0 ? 'No recent chats' : 'No Chat Requests';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00006e" />
      <CustomDrawer isOpen={drawerOpen} onClose={closeDrawer} />

      {/* Header – same structure as NewsletterScreen, DirectoryScreen, CallLogsScreen */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.drawerIconContainer}
          onPress={openDrawer}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../../assets/images/side_bar_icon.png')}
            style={styles.drawerIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View style={styles.headerGradientContainer}>
          <View style={styles.gradientHeader}>
            <View style={styles.gradientLeft} />
            <View style={styles.gradientMiddle} />
            <View style={styles.gradientRight} />
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBackPress}
                >
                  <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chat</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Tab bar – CHAT | CHAT REQUEST (uppercase, matches StrokeTeamOne tabLayout) */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tabIndex === 0 && styles.tabActive]}
          onPress={() => setTabIndex(0)}
        >
          <Text style={[styles.tabText, tabIndex === 0 && styles.tabTextActive]}>CHAT</Text>
          {tabIndex === 0 && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tabIndex === 1 && styles.tabActive]}
          onPress={() => setTabIndex(1)}
        >
          <Text style={[styles.tabText, tabIndex === 1 && styles.tabTextActive]}>CHAT REQUEST</Text>
          {chatRequests.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{chatRequests.length}</Text>
            </View>
          )}
          {tabIndex === 1 && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Content – loading or list */}
      <View style={styles.content}>
        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.chatBlueLight} />
          </View>
        )}

        {!loading && tabIndex === 0 && (
          <FlatList
            data={recentChats}
            renderItem={renderRecentItem}
            keyExtractor={(item, index) => `recent-${item.chatId ?? item.broadcastId ?? item.id ?? 'noid'}-${index}`}
            contentContainerStyle={list.length === 0 ? styles.emptyList : undefined}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{emptyText}</Text>
              </View>
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {!loading && tabIndex === 1 && (
          <FlatList
            data={chatRequests}
            renderItem={renderRequestItem}
            keyExtractor={(item, index) => `req-${item.broadcast_id}-${item.user_id}-${item.appointment_id ?? index}`}
            contentContainerStyle={list.length === 0 ? styles.emptyList : undefined}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{emptyText}</Text>
              </View>
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>

      {/* Start New Chat button – matches StrokeTeamOne MaterialButton at bottom */}
      <TouchableOpacity style={styles.startNewChatBtn} onPress={handleStartNewChat} activeOpacity={0.8}>
        <Text style={styles.startNewChatText}>Start New Chat</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  headerContainer: {
    flexDirection: 'row',
    height: 50,
    width: '100%',
  },
  drawerIconContainer: {
    width: 65,
    height: '100%',
    backgroundColor: '#00006e',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  drawerIcon: {
    width: 40,
    height: 40,
  },
  headerGradientContainer: {
    flex: 1,
  },
  gradientHeader: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0070a9',
  },
  gradientLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '35%',
    backgroundColor: '#00006e',
  },
  gradientMiddle: {
    position: 'absolute',
    left: '35%',
    top: 0,
    bottom: 0,
    width: '30%',
    backgroundColor: '#0070a9',
  },
  gradientRight: {
    position: 'absolute',
    left: '65%',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#007eb6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    marginLeft: 4,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
    color: COLORS.white,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.lightGray,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    // indicator is separate view
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9b9b9b',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: COLORS.chatBlueLight,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 2,
    backgroundColor: COLORS.chatBlueLight,
  },
  tabBadge: {
    position: 'absolute',
    top: 8,
    right: '20%',
    backgroundColor: COLORS.chatBlueLight,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F3F3',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  avatarWrapper: {
    marginRight: 12,
  },
  avatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContent: {
    flex: 1,
    minWidth: 0,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 8,
    flexShrink: 0,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginLeft: 78,
  },
  requestItem: {
    padding: 16,
    backgroundColor: COLORS.white,
  },
  requestContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestTextContent: {
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  requestBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  acceptBtn: {
    backgroundColor: COLORS.chatBlueLight,
  },
  rejectBtn: {
    backgroundColor: COLORS.lightGray,
  },
  acceptBtnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  rejectBtnText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },
  startNewChatBtn: {
    backgroundColor: COLORS.chatBlueDark,
    paddingVertical: 16,
    marginHorizontal: 5,
    marginBottom: Platform.OS === 'ios' ? 0 : 8,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startNewChatText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChatsScreen;
