/**
 * Inbox Screen
 */

import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setMessages, markAsRead } from '../../store/slices/inboxSlice';
import { RootStackParamList } from '../../types';
import apiService from '../../services/apiService';
import { API_FETCH_INBOX_MESSAGES, COLORS } from '../../constants';
import { formatDateTime } from '../../utils/dateFormatter';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const InboxScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { messages, unreadCount } = useAppSelector((state) => state.inbox);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const response = await apiService.postEncrypted(API_FETCH_INBOX_MESSAGES, {
        type: 'inbox',
      });
      if (response.code === '100' && response.data) {
        // Transform and set messages
        dispatch(setMessages(response.data));
      }
    } catch (error) {
      console.error('Load messages error:', error);
    }
  };

  const handleMessagePress = (messageId: string) => {
    dispatch(markAsRead(messageId));
    navigation.navigate('InboxDetails', { messageId });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.unreadItem]}
      onPress={() => handleMessagePress(item.messageId)}
    >
      <Text style={styles.itemTitle}>{item.subject}</Text>
      <Text style={styles.itemMessage} numberOfLines={2}>
        {item.message}
      </Text>
      <Text style={styles.itemDate}>{formatDateTime(item.timestamp)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.messageId}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  item: {
    padding: 16,
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  unreadItem: {
    backgroundColor: COLORS.light,
    borderColor: COLORS.primary,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  itemDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});

export default InboxScreen;
