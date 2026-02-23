/**
 * TaskCommentsScreen
 * Matches Java TaskCommentsActivity - Task comments feed
 */
import React, { useState, useEffect, useCallback } from 'react';
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

interface Comment {
  comment_id: string;
  user_id: string;
  user_name: string;
  comment_text: string;
  created_at: string;
  profile_image?: string;
}

const TaskCommentsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { eventId, taskName, patientName } = route.params || {};

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      setCurrentUserId(userId || '');

      const response = await apiService.postEncrypted('ApiTiaTeleMD/fetchTasksListComments', {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        event_id: eventId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setComments(data?.comments || data?.commentsList || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchComments();
  }, []);

  const handleSendComment = async () => {
    if (!newComment.trim()) {
      return;
    }

    try {
      setSending(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/saveTasksListComments', {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        event_id: eventId || '',
        comment: newComment.trim(),
      });

      if (response.code === '200' || response.code === '100') {
        setNewComment('');
        fetchComments();
      } else {
        Alert.alert('Error', response.message || 'Failed to send comment');
      }
    } catch (error) {
      console.error('Error sending comment:', error);
      Alert.alert('Error', 'Failed to send comment');
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

  const renderCommentItem = ({ item }: { item: Comment }) => {
    const isCurrentUser = item.user_id === currentUserId;

    return (
      <View style={[styles.commentItem, isCurrentUser && styles.commentItemCurrentUser]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, isCurrentUser && styles.avatarCurrentUser]}>
            <Text style={styles.avatarText}>
              {item.user_name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        </View>
        <View style={[styles.commentContent, isCurrentUser && styles.commentContentCurrentUser]}>
          <View style={styles.commentHeader}>
            <Text style={styles.userName}>{item.user_name}</Text>
            <Text style={styles.commentTime}>{formatDate(item.created_at)}</Text>
          </View>
          <Text style={styles.commentText}>{item.comment_text}</Text>
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
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Task Info */}
      <View style={styles.taskInfo}>
        {taskName && <Text style={styles.taskName}>{taskName}</Text>}
        {patientName && <Text style={styles.patientName}>Patient: {patientName}</Text>}
      </View>

      {/* Comments List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading comments...</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.comment_id}
          renderItem={renderCommentItem}
          contentContainerStyle={styles.listContent}
          inverted={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No comments yet</Text>
              <Text style={styles.emptySubtext}>Be the first to add a comment</Text>
            </View>
          }
        />
      )}

      {/* Comment Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Type a comment..."
          placeholderTextColor="#999"
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newComment.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSendComment}
          disabled={!newComment.trim() || sending}
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
  taskInfo: {
    backgroundColor: '#e3f2fd',
    padding: 15,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 14,
    color: '#666',
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
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  commentItemCurrentUser: {
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
  commentContent: {
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
  commentContentCurrentUser: {
    backgroundColor: '#e3f2fd',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 4,
  },
  commentHeader: {
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
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
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
  commentInput: {
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

export default TaskCommentsScreen;
