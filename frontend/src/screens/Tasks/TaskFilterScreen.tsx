/**
 * TaskFilterScreen
 * Matches Java TasklistFilterActivity - Filter tasks by priority/status/assignee
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../../services/apiService';
import { getStringFromStorage, saveStringToStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID, ORGANIZATION_ID } from '../../constants';

interface FilterOption {
  id: string;
  name: string;
}

interface CareElement {
  id: string;
  name: string;
}

interface TaskCategory {
  id: string;
  name: string;
}

const STATUS_OPTIONS: FilterOption[] = [
  { id: '', name: 'All' },
  { id: '0', name: 'Upcoming' },
  { id: '1', name: 'Overdue' },
  { id: '2', name: 'Completed' },
  { id: '3', name: 'Pending' },
];

const TaskFilterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { istaskwise, isEscalation } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [careElements, setCareElements] = useState<CareElement[]>([]);
  const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([]);

  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCareElement, setSelectedCareElement] = useState('');
  const [selectedTaskCategory, setSelectedTaskCategory] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchFilterOptions = useCallback(async () => {
    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);

      // Load saved filter values
      const savedStatus = await getStringFromStorage('filter_task_stat');
      const savedCare = await getStringFromStorage('filter_care');
      const savedCat = await getStringFromStorage('filter_task_cat');
      const savedFromDate = await getStringFromStorage('filter_from_date');
      const savedToDate = await getStringFromStorage('filter_to_date');

      if (savedStatus) setSelectedStatus(savedStatus);
      if (savedCare) setSelectedCareElement(savedCare);
      if (savedCat) setSelectedTaskCategory(savedCat);
      if (savedFromDate) setFromDate(savedFromDate);
      if (savedToDate) setToDate(savedToDate);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/getCareElements', {
        session_id: sessionId || '',
        user_id: userId || '',
        organization_id: orgId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setCareElements(data?.careElements || data?.care_elements || []);
        setTaskCategories(data?.taskCategories || data?.task_categories || []);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const handleApplyFilter = async () => {
    try {
      await saveStringToStorage('filter_task_stat', selectedStatus);
      await saveStringToStorage('filter_care', selectedCareElement);
      await saveStringToStorage('filter_task_cat', selectedTaskCategory);
      await saveStringToStorage('filter_from_date', fromDate);
      await saveStringToStorage('filter_to_date', toDate);
      await saveStringToStorage('is_filter_enabled', 'true');

      navigation.goBack();
    } catch (error) {
      console.error('Error saving filters:', error);
      Alert.alert('Error', 'Failed to save filters');
    }
  };

  const handleClearFilter = async () => {
    try {
      setSelectedStatus('');
      setSelectedCareElement('');
      setSelectedTaskCategory('');
      setFromDate('');
      setToDate('');

      await saveStringToStorage('filter_task_stat', '');
      await saveStringToStorage('filter_care', '');
      await saveStringToStorage('filter_task_cat', '');
      await saveStringToStorage('filter_from_date', '');
      await saveStringToStorage('filter_to_date', '');
      await saveStringToStorage('is_filter_enabled', 'false');

      navigation.goBack();
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  };

  const renderFilterSection = (
    title: string,
    options: FilterOption[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionButton,
              selectedValue === option.id && styles.optionButtonSelected,
            ]}
            onPress={() => onSelect(option.id)}
          >
            <Text
              style={[
                styles.optionText,
                selectedValue === option.id && styles.optionTextSelected,
              ]}
            >
              {option.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filter Tasks</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading filters...</Text>
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
        <Text style={styles.headerTitle}>Filter Tasks</Text>
        <TouchableOpacity onPress={handleClearFilter} style={styles.clearButton}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Status Filter */}
        {renderFilterSection(
          'Task Status',
          STATUS_OPTIONS,
          selectedStatus,
          setSelectedStatus
        )}

        {/* Care Element Filter */}
        {careElements.length > 0 &&
          renderFilterSection(
            'Care Element',
            [{ id: '', name: 'All' }, ...careElements],
            selectedCareElement,
            setSelectedCareElement
          )}

        {/* Task Category Filter */}
        {taskCategories.length > 0 &&
          renderFilterSection(
            'Task Category',
            [{ id: '', name: 'All' }, ...taskCategories],
            selectedTaskCategory,
            setSelectedTaskCategory
          )}

        {/* Date Range */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Date Range</Text>
          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                // In a real implementation, show date picker
                Alert.alert('Date Picker', 'Date picker would open here');
              }}
            >
              <Text style={styles.dateLabel}>From</Text>
              <Text style={styles.dateValue}>{fromDate || 'Select date'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                Alert.alert('Date Picker', 'Date picker would open here');
              }}
            >
              <Text style={styles.dateLabel}>To</Text>
              <Text style={styles.dateValue}>{toDate || 'Select date'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilter}>
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
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
  clearButton: {
    padding: 5,
  },
  clearText: {
    color: '#fff',
    fontSize: 14,
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
  content: {
    flex: 1,
    padding: 15,
  },
  filterSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  optionButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionButtonSelected: {
    backgroundColor: '#0070a9',
    borderColor: '#0070a9',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextSelected: {
    color: '#fff',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    color: '#333',
  },
  footer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  applyButton: {
    backgroundColor: '#0070a9',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TaskFilterScreen;
