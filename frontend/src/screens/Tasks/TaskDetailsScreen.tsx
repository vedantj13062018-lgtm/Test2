/**
 * TaskDetailsScreen
 * Matches Java TasklistItemDetailsActivity - Single task view with status change
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../../services/apiService';
import { getStringFromStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID, ORGANIZATION_ID } from '../../constants';

interface TaskDetail {
  event_id: string;
  task_name: string;
  task_description: string;
  patient_name: string;
  patient_id: string;
  status: string;
  status_val: string;
  priority: string;
  due_date: string;
  assigned_to: string;
  created_by: string;
  created_date: string;
  care_element: string;
  task_category: string;
  notes?: string;
}

const STATUS_OPTIONS = [
  { value: '0', label: 'Upcoming', color: '#2196F3' },
  { value: '1', label: 'Overdue', color: '#f44336' },
  { value: '2', label: 'Completed', color: '#4CAF50' },
  { value: '3', label: 'Pending', color: '#FF9800' },
];

const TaskDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { eventId, patName, statusVal, status, patientId } = route.params || {};

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const fetchTaskDetails = useCallback(async () => {
    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/fetchTaskDetails', {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        event_id: eventId || '',
        patient_id: patientId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setTask(data?.taskDetails || data);
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
      Alert.alert('Error', 'Failed to fetch task details');
    } finally {
      setLoading(false);
    }
  }, [eventId, patientId]);

  useEffect(() => {
    if (eventId) {
      fetchTaskDetails();
    } else {
      // Create a basic task object from route params
      setTask({
        event_id: '',
        task_name: '',
        task_description: '',
        patient_name: patName || '',
        patient_id: patientId || '',
        status: status || '',
        status_val: statusVal || '',
        priority: '',
        due_date: '',
        assigned_to: '',
        created_by: '',
        created_date: '',
        care_element: '',
        task_category: '',
      });
    }
  }, []);

  const handleStatusChange = async (newStatusVal: string) => {
    try {
      setChangingStatus(true);
      setShowStatusModal(false);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/changeStatusCareplanTask', {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
        event_id: eventId || task?.event_id || '',
        status_val: newStatusVal,
      });

      if (response.code === '200' || response.code === '100') {
        Alert.alert('Success', 'Task status updated successfully');
        fetchTaskDetails();
      } else {
        Alert.alert('Error', response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error changing status:', error);
      Alert.alert('Error', 'Failed to update task status');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleViewComments = () => {
    navigation.navigate('TaskComments', {
      eventId: eventId || task?.event_id,
      taskName: task?.task_name,
      patientName: task?.patient_name || patName,
    });
  };

  const getStatusColor = (statusValue: string): string => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === statusValue);
    return option?.color || '#666';
  };

  const getStatusLabel = (statusValue: string): string => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === statusValue);
    return option?.label || status || 'Unknown';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Task Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <TouchableOpacity onPress={handleViewComments} style={styles.commentsButton}>
          <Text style={styles.commentsText}>Comments</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Patient Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Patient</Text>
          </View>
          <Text style={styles.patientName}>{task?.patient_name || patName}</Text>
        </View>

        {/* Task Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Task Information</Text>
          </View>
          {task?.task_name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Task Name</Text>
              <Text style={styles.infoValue}>{task.task_name}</Text>
            </View>
          )}
          {task?.task_description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{task.task_description}</Text>
            </View>
          )}
          {task?.care_element && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Care Element</Text>
              <Text style={styles.infoValue}>{task.care_element}</Text>
            </View>
          )}
          {task?.task_category && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{task.task_category}</Text>
            </View>
          )}
        </View>

        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Status</Text>
          </View>
          <TouchableOpacity
            style={styles.statusContainer}
            onPress={() => setShowStatusModal(true)}
          >
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(task?.status_val || statusVal) },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusLabel(task?.status_val || statusVal)}
              </Text>
            </View>
            <Text style={styles.changeStatusText}>Tap to change status</Text>
          </TouchableOpacity>
        </View>

        {/* Schedule Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Schedule</Text>
          </View>
          {task?.due_date && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Due Date</Text>
              <Text style={styles.infoValue}>{task.due_date}</Text>
            </View>
          )}
          {task?.priority && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Priority</Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color:
                      task.priority.toLowerCase() === 'high'
                        ? '#f44336'
                        : task.priority.toLowerCase() === 'medium'
                        ? '#FF9800'
                        : '#4CAF50',
                  },
                ]}
              >
                {task.priority}
              </Text>
            </View>
          )}
        </View>

        {/* Assignment Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Assignment</Text>
          </View>
          {task?.assigned_to && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assigned To</Text>
              <Text style={styles.infoValue}>{task.assigned_to}</Text>
            </View>
          )}
          {task?.created_by && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created By</Text>
              <Text style={styles.infoValue}>{task.created_by}</Text>
            </View>
          )}
          {task?.created_date && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created Date</Text>
              <Text style={styles.infoValue}>{task.created_date}</Text>
            </View>
          )}
        </View>

        {/* Notes Card */}
        {task?.notes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{task.notes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Status Modal */}
      <Modal visible={showStatusModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Status</Text>
            {STATUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.statusOption, { borderLeftColor: option.color }]}
                onPress={() => handleStatusChange(option.value)}
                disabled={changingStatus}
              >
                <Text style={styles.statusOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {changingStatus && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Updating status...</Text>
        </View>
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
  commentsButton: {
    padding: 5,
  },
  commentsText: {
    color: '#fff',
    fontSize: 14,
  },
  placeholder: {
    width: 70,
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
  content: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  cardHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0070a9',
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  statusContainer: {
    padding: 15,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  changeStatusText: {
    fontSize: 12,
    color: '#666',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    padding: 15,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusOption: {
    padding: 15,
    borderLeftWidth: 4,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  statusOptionText: {
    fontSize: 16,
    color: '#333',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TaskDetailsScreen;
