/**
 * TaskEscalationScreen
 * Matches Java TaskEscalationActivity - Escalated tasks view
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
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiService from '../../services/apiService';
import { getStringFromStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID, ORGANIZATION_ID } from '../../constants';

interface EscalatedTask {
  id: string;
  patient_name: string;
  task_name: string;
  escalation_level: string;
  escalated_to: string;
  escalated_by: string;
  escalation_date: string;
  status: string;
  priority: string;
  reason?: string;
}

const TaskEscalationScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [tasks, setTasks] = useState<EscalatedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [totalCount, setTotalCount] = useState('0');

  const fetchEscalatedTasks = useCallback(async (isScrolling = false) => {
    try {
      if (!isScrolling) {
        setLoading(true);
      }

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const params = {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        search_key: searchText,
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        start: isScrolling ? String(tasks.length) : '0',
        limit: '10',
      };

      const response = await apiService.postEncrypted('ApiTiaTeleMD/getTaskListsEscalation', params);

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        const taskList = data?.escalationList || data?.tasks || [];
        setTotalCount(data?.totalcount || '0');

        if (isScrolling) {
          setTasks((prev) => [...prev, ...taskList]);
        } else {
          setTasks(taskList);
        }
      }
    } catch (error) {
      console.error('Error fetching escalated tasks:', error);
      Alert.alert('Error', 'Failed to fetch escalated tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchText, tasks.length]);

  useEffect(() => {
    fetchEscalatedTasks();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEscalatedTasks();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  const handleTaskPress = (task: EscalatedTask) => {
    navigation.navigate('TaskDetails', {
      taskId: task.id,
      patName: task.patient_name,
      taskName: task.task_name,
      isEscalated: true,
    });
  };

  const handleFilterPress = () => {
    navigation.navigate('TaskFilter', { isEscalation: true });
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const getEscalationLevelColor = (level: string): string => {
    const levelNum = parseInt(level);
    if (levelNum >= 3) return '#f44336';
    if (levelNum === 2) return '#FF9800';
    return '#2196F3';
  };

  const renderTaskItem = ({ item }: { item: EscalatedTask }) => (
    <TouchableOpacity style={styles.taskItem} onPress={() => handleTaskPress(item)}>
      <View style={styles.taskHeader}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.patient_name}</Text>
          <Text style={styles.taskName}>{item.task_name}</Text>
        </View>
        <View
          style={[
            styles.escalationBadge,
            { backgroundColor: getEscalationLevelColor(item.escalation_level) },
          ]}
        >
          <Text style={styles.escalationText}>Level {item.escalation_level}</Text>
        </View>
      </View>

      <View style={styles.taskBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Escalated To:</Text>
          <Text style={styles.infoValue}>{item.escalated_to}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Escalated By:</Text>
          <Text style={styles.infoValue}>{item.escalated_by}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>{item.escalation_date}</Text>
        </View>
        {item.reason && (
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText}>{item.reason}</Text>
          </View>
        )}
      </View>

      <View style={styles.taskFooter}>
        <View
          style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}
        >
          <Text style={styles.priorityText}>{item.priority}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'resolved' ? '#4CAF50' : '#FF9800' },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escalated Tasks</Text>
        <TouchableOpacity onPress={handleFilterPress} style={styles.filterHeaderButton}>
          <Text style={styles.filterHeaderText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search escalated tasks..."
          placeholderTextColor="#96969a"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>Total: {totalCount} escalated tasks</Text>
      </View>

      {/* Task List */}
      {loading && tasks.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchEscalatedTasks();
              }}
            />
          }
          onEndReached={() => {
            if (parseInt(totalCount) > tasks.length && !loading) {
              fetchEscalatedTasks(true);
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No escalated tasks</Text>
            </View>
          }
        />
      )}
    </View>
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
  filterHeaderButton: {
    padding: 5,
  },
  filterHeaderText: {
    color: '#fff',
    fontSize: 14,
  },
  searchContainer: {
    padding: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  countContainer: {
    backgroundColor: '#e3f2fd',
    padding: 10,
  },
  countText: {
    color: '#0070a9',
    fontSize: 14,
    fontWeight: '500',
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
    padding: 10,
  },
  taskItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  taskName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  escalationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  escalationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  taskBody: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    width: 100,
  },
  infoValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  reasonContainer: {
    marginTop: 8,
    backgroundColor: '#fff8e1',
    padding: 10,
    borderRadius: 4,
  },
  reasonLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 12,
    color: '#333',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
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
  },
});

export default TaskEscalationScreen;
