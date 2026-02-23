/**
 * Inbox Details Screen
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useAppSelector } from '../../store/hooks';
import { RootStackParamList } from '../../types';
import { COLORS } from '../../constants';
import { formatDateTime } from '../../utils/dateFormatter';

type RouteProp = { params: { messageId: string } };

const InboxDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProp>();
  const { messageId } = route.params;
  const { messages } = useAppSelector((state) => state.inbox);
  const [message, setMessage] = useState<any>(null);

  useEffect(() => {
    const foundMessage = messages.find((m) => m.messageId === messageId);
    setMessage(foundMessage);
  }, [messageId, messages]);

  if (!message) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Message not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.subject}>{message.subject}</Text>
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>From: {message.senderName}</Text>
          <Text style={styles.metaText}>{formatDateTime(message.timestamp)}</Text>
        </View>
        <Text style={styles.message}>{message.message}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: 16,
  },
  subject: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  metaContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  message: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default InboxDetailsScreen;
