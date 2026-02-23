/**
 * TaskListScreen
 * Matches Java TasklistActivity - Care plan task list with patient/task view toggle
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
  Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../../services/apiService';
import { getStringFromStorage, saveStringToStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID, ORGANIZATION_ID } from '../../constants';
import DebugPanel from '../../components/DebugPanel';

interface TaskItem {
  event_id: string;
  patient_id: string;
  pat_name: string;
  task_name?: string;
  status: string;
  status_val: string;
  event_datetime: string;
  overdue_cnt: string;
  pending_cnt: string;
  upcoming_cnt: string;
  complt_cnt: string;
  priority?: string;
  assignee?: string;
}

const TaskListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { istaskwise: initialTaskwise } = route.params || {};

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isTaskWise, setIsTaskWise] = useState(initialTaskwise === '0');
  const [totalCount, setTotalCount] = useState('0');
  const [isFilterEnabled, setIsFilterEnabled] = useState(false);
  
  // Debug panel state
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugResponse, setDebugResponse] = useState<any>(null);
  const [debugError, setDebugError] = useState<string>('');

  const fetchTasks = useCallback(async (isScrolling = false) => {
    try {
      if (!isScrolling) {
        setLoading(true);
      }

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);
      
      // Debug logging
      console.log('=== TaskListScreen API Debug ===');
      console.log('Session ID:', sessionId ? 'SET' : 'EMPTY');
      console.log('User ID:', userId ? 'SET' : 'EMPTY');
      console.log('Organization ID:', orgId ? 'SET' : 'EMPTY');
      
      if (!sessionId || !userId || !orgId) {
        console.warn('Missing required session data for Task List API');
        Alert.alert('Session Required', 'Please login to view tasks');
        setLoading(false);
        return;
      }
      
      const filterTaskStat = await getStringFromStorage('filter_task_stat') || '';
      const filterCare = await getStringFromStorage('filter_care') || '';
      const filterTaskCat = await getStringFromStorage('filter_task_cat') || '';
      const filterFromDate = await getStringFromStorage('filter_from_date') || '';
      const filterToDate = await getStringFromStorage('filter_to_date') || '';

      const params = {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        patient_search: searchText,
        task_status: filterTaskStat,
        care_element_id: filterCare,
        task_category_id: filterTaskCat,
        from_date: filterFromDate,
        to_date: filterToDate,
        combined_view: isTaskWise ? '0' : '1',
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        start: isScrolling ? String(tasks.length) : '0',
        limit: '10',
      };
      
      console.log('Request params:', JSON.stringify(params, null, 2));

      const response = await apiService.postEncrypted('ApiTiaTeleMD/getTaskListsNew', params);
      
      // Store response for debug panel
      setDebugResponse(response);
      setDebugError('');
      
      console.log('API Response code:', response.code);
      console.log('API Response data:', JSON.stringify(response.data, null, 2));

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        const taskList = data?.tasklistArraylist || data?.tasks || data?.task_list || [];
        console.log('Task list count:', taskList.length);
        setTotalCount(data?.totalcount || data?.total_count || '0');

        if (isScrolling) {
          setTasks((prev) => [...prev, ...taskList]);
        } else {
          setTasks(taskList);
        }
      } else {
        console.warn('API returned non-success code:', response.code, response.status);
      }
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      setDebugError(error?.message || 'Unknown error occurred');
      Alert.alert('Error', 'Failed to fetch tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchText, isTaskWise, tasks.length]);

  useEffect(() => {
    fetchTasks();
  }, [isTaskWise]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  const handleTaskPress = (task: TaskItem) => {
    if (isTaskWise) {
      navigation.navigate('TaskDetails', {
        patName: task.pat_name,
        statusVal: task.status_val,
        status: task.status,
        dueDate: task.event_datetime,
        eventId: task.event_id,
        patientId: task.patient_id,
      });
    }
  };

  const handleStatusTap = (task: TaskItem, status: 'overdue' | 'pending' | 'upcoming' | 'completed') => {
    let count = '0';
    let statusVal = '0';

    switch (status) {
      case 'overdue':
        count = task.overdue_cnt;
        statusVal = '1';
        break;
      case 'pending':
        count = task.pending_cnt;
        statusVal = '3';
        break;
      case 'upcoming':
        count = task.upcoming_cnt;
        statusVal = '0';
        break;
      case 'completed':
        const compltParts = task.complt_cnt.split('/');
        count = compltParts[0];
        statusVal = '2';
        break;
    }

    if (count === '0') {
      Alert.alert('Info', 'No data available');
      return;
    }

    navigation.navigate('TaskDetails', {
      patName: task.pat_name,
      statusVal,
      status,
      taskCount: count,
      patientId: task.patient_id,
    });
  };

  const handleFilterPress = () => {
    navigation.navigate('TaskFilter', { istaskwise: isTaskWise ? '0' : '1' });
  };

  const handleEscalationPress = () => {
    navigation.navigate('TaskEscalation');
  };

  const handleLoadMore = () => {
    if (parseInt(totalCount) > tasks.length && !loading) {
      fetchTasks(true);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'overdue':
        return '#f44336';
      case 'pending':
        return '#FF9800';
      case 'upcoming':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const renderTaskItem = ({ item }: { item: TaskItem }) => (
    <TouchableOpacity
      style={styles.taskItem}
      onPress={() => handleTaskPress(item)}
    >
      <View style={styles.taskHeader}>
        <Text style={styles.patientName}>{item.pat_name}</Text>
        {isTaskWise && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        )}
      </View>

      {isTaskWise ? (
        <View style={styles.taskDetails}>
          {item.task_name && <Text style={styles.taskName}>{item.task_name}</Text>}
          <Text style={styles.dueDate}>Due: {item.event_datetime}</Text>
        </View>
      ) : (
        <View style={styles.statusCountsContainer}>
          <TouchableOpacity
            style={styles.statusCount}
            onPress={() => handleStatusTap(item, 'overdue')}
          >
            <Text style={[styles.countValue, { color: '#f44336' }]}>{item.overdue_cnt}</Text>
            <Text style={styles.countLabel}>Overdue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statusCount}
            onPress={() => handleStatusTap(item, 'pending')}
          >
            <Text style={[styles.countValue, { color: '#FF9800' }]}>{item.pending_cnt}</Text>
            <Text style={styles.countLabel}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statusCount}
            onPress={() => handleStatusTap(item, 'upcoming')}
          >
            <Text style={[styles.countValue, { color: '#2196F3' }]}>{item.upcoming_cnt}</Text>
            <Text style={styles.countLabel}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statusCount}
            onPress={() => handleStatusTap(item, 'completed')}
          >
            <Text style={[styles.countValue, { color: '#4CAF50' }]}>{item.complt_cnt}</Text>
            <Text style={styles.countLabel}>Completed</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Debug Panel */}
      <DebugPanel
        visible={debugVisible}
        onClose={() => setDebugVisible(false)}
        apiResponse={debugResponse}
        apiError={debugError}
        endpoint="ApiTiaTeleMD/getTaskListsNew"
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task List</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setDebugVisible(true)} style={styles.debugButton}>
            <Text style={styles.debugButtonText}>🔧</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEscalationPress} style={styles.escalationButton}>
            <Text style={styles.escalationText}>Escalation</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <Text style={[styles.toggleLabel, isTaskWise && styles.toggleLabelActive]}>Task Wise</Text>
        <Switch
          value={!isTaskWise}
          onValueChange={(value) => {
            setIsTaskWise(!value);
            setTasks([]);
          }}
          trackColor={{ false: '#0070a9', true: '#0070a9' }}
          thumbColor="#fff"
        />
        <Text style={[styles.toggleLabel, !isTaskWise && styles.toggleLabelActive]}>Patient Wise</Text>
        {isTaskWise && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{totalCount}</Text>
          </View>
        )}
      </View>

      {/* Search and Filter */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#96969a"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={handleFilterPress}>
          <Text style={styles.filterIcon}>⚙️</Text>
          {isFilterEnabled && <View style={styles.filterIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Task List */}
      {loading && tasks.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item, index) => item.event_id || `task_${index}`}
          renderItem={renderTaskItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchTasks();
              }}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tasks found</Text>
            </View>
          }
          ListFooterComponent={
            loading && tasks.length > 0 ? (
              <ActivityIndicator style={styles.footerLoader} color="#0070a9" />
            ) : null
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
  escalationButton: {
    padding: 5,
  },
  escalationText: {
    color: '#fff',
    fontSize: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 10,
  },
  toggleLabelActive: {
    color: '#0070a9',
    fontWeight: 'bold',
  },
  countBadge: {
    backgroundColor: '#0070a9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flex: 1,
    marginRight: 10,
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
  filterButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  filterIcon: {
    fontSize: 20,
  },
  filterIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f44336',
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
    alignItems: 'center',
    marginBottom: 10,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
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
  taskDetails: {
    marginTop: 5,
  },
  taskName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
  },
  statusCountsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 5,
  },
  statusCount: {
    alignItems: 'center',
    padding: 8,
  },
  countValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  countLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
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
  footerLoader: {
    marginVertical: 20,
  },
});

export default TaskListScreen;
