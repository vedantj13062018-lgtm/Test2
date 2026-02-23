/**
 * ICURemarksScreen
 * Matches Java RemarkICUActivity - Add/view ICU remarks
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../../services/apiService';
import { getStringFromStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID, ORGANIZATION_ID } from '../../constants';

interface Remark {
  id: string;
  user_id: string;
  user_name: string;
  remarks: string;
  created_at: string;
  profile_image?: string;
}

const ICURemarksScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId } = route.params || {};
  const flatListRef = useRef<FlatList>(null);

  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newRemark, setNewRemark] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [totalCount, setTotalCount] = useState('0');

  const fetchRemarks = useCallback(async (isScrolling = false) => {
    try {
      if (!isScrolling) {
        setLoading(true);
      }

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      setCurrentUserId(userId || '');

      const response = await apiService.postEncrypted('ApiTiaTeleMD/fetchIcuPatientRemarks', {
        patient_id: patientId || '',
        user_id: userId || '',
        session_id: sessionId || '',
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        start: isScrolling ? String(remarks.length) : '0',
        limit: '10',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        const remarkList = data?.remarkdata || data?.remarks || [];
        setTotalCount(data?.total_count || '0');

        // Reverse for chat-like display (newest at bottom)
        const reversedList = [...remarkList].reverse();

        if (isScrolling) {
          setRemarks((prev) => [...reversedList, ...prev]);
        } else {
          setRemarks(reversedList);
          // Scroll to bottom after initial load
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error fetching remarks:', error);
      Alert.alert('Error', 'Failed to fetch remarks');
    } finally {
      setLoading(false);
    }
  }, [patientId, remarks.length]);

  useEffect(() => {
    fetchRemarks();
  }, []);

  const handleSendRemark = async () => {
    if (!newRemark.trim()) {
      return;
    }

    try {
      setSending(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/saveIcuPatientRemarks', {
        patient_id: patientId || '',
        user_id: userId || '',
        remarks: newRemark.trim(),
        session_id: sessionId || '',
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (response.code === '200' || response.code === '100') {
        setNewRemark('');
        fetchRemarks();
      } else {
        Alert.alert('Error', response.message || 'Failed to send remark');
      }
    } catch (error) {
      console.error('Error sending remark:', error);
      Alert.alert('Error', 'Failed to send remark');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;

      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const renderRemarkItem = ({ item }: { item: Remark }) => {
    const isCurrentUser = item.user_id === currentUserId;

    return (
      <View style={[styles.remarkItem, isCurrentUser && styles.remarkItemCurrentUser]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, isCurrentUser && styles.avatarCurrentUser]}>
            <Text style={styles.avatarText}>
              {item.user_name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        </View>
        <View style={[styles.remarkContent, isCurrentUser && styles.remarkContentCurrentUser]}>
          <View style={styles.remarkHeader}>
            <Text style={styles.userName}>{item.user_name}</Text>
            <Text style={styles.remarkTime}>{formatDate(item.created_at)}</Text>
          </View>
          <Text style={styles.remarkText}>{item.remarks}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Remarks</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Remarks List */}
      {loading && remarks.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading remarks...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={remarks}
          keyExtractor={(item, index) => item.id || `remark_${index}`}
          renderItem={renderRemarkItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => {
            if (remarks.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No remarks yet</Text>
              <Text style={styles.emptySubtext}>Be the first to add a remark</Text>
            </View>
          }
        />
      )}

      {/* Input Container */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.remarkInput}
          placeholder="Type a remark..."
          placeholderTextColor="#999"
          value={newRemark}
          onChangeText={setNewRemark}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newRemark.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSendRemark}
          disabled={!newRemark.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0070a9',
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingTop: 40,
  },
  backButton: {
    padding: 5,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 15,
    flexGrow: 1,
  },
  remarkItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  remarkItemCurrentUser: {
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    marginHorizontal: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0070a9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCurrentUser: {
    backgroundColor: '#4CAF50',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  remarkContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderTopLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  remarkContentCurrentUser: {
    backgroundColor: '#e3f2fd',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 4,
  },
  remarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  remarkTime: {
    fontSize: 12,
    color: '#999',
  },
  remarkText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  remarkInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#0070a9',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ICURemarksScreen;
