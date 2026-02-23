/**
 * FormItemsScreen
 * Dynamic form items display and editing
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../../services/apiService';
import { getStringFromStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID } from '../../constants';

interface FormItem {
  id: string;
  question_id: string;
  question: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'date' | 'textarea';
  required: boolean;
  options?: { value: string; label: string }[];
  value?: string;
  placeholder?: string;
}

const FormItemsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    patientId,
    patientName,
    formId,
    formName,
    assessmentId,
    isEdit,
    isCopy,
    isView,
  } = route.params || {};

  const [formItems, setFormItems] = useState<FormItem[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchFormDetails = useCallback(async () => {
    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/fetchFormDetals', {
        user_id: userId || '',
        session_id: sessionId || '',
        patient_id: patientId || '',
        form_id: formId || '',
        id: isEdit || isCopy ? assessmentId : '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        const items = data?.formitems || data?.form_items || [];
        setFormItems(items);

        // Pre-populate answers if editing
        const initialAnswers: { [key: string]: string } = {};
        items.forEach((item: FormItem) => {
          if (item.value) {
            initialAnswers[item.question_id] = item.value;
          }
        });
        setAnswers(initialAnswers);
      }
    } catch (error) {
      console.error('Error fetching form details:', error);
      Alert.alert('Error', 'Failed to load form');
    } finally {
      setLoading(false);
    }
  }, [patientId, formId, assessmentId, isEdit, isCopy]);

  useEffect(() => {
    fetchFormDetails();
  }, []);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSave = async () => {
    // Validate required fields
    const missingRequired = formItems.filter(
      (item) => item.required && !answers[item.question_id]
    );

    if (missingRequired.length > 0) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    try {
      setSaving(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      const dataList = formItems.map((item) => ({
        question_id: item.question_id,
        answer: answers[item.question_id] || '',
      }));

      const response = await apiService.postEncrypted('ApiTiaTeleMD/saveFormDetails', {
        user_id: userId || '',
        session_id: sessionId || '',
        patient_id: patientId || '',
        form_id: formId || '',
        data_list: JSON.stringify(dataList),
        id: isEdit ? assessmentId : '',
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (response.code === '200' || response.code === '100') {
        Alert.alert('Success', 'Form saved successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to save form');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      Alert.alert('Error', 'Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    Alert.alert('Clear Form', 'Are you sure you want to clear all entries?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => setAnswers({}),
      },
    ]);
  };

  const renderFormItem = (item: FormItem) => {
    const value = answers[item.question_id] || '';

    switch (item.type) {
      case 'text':
      case 'number':
        return (
          <TextInput
            style={[styles.textInput, isView && styles.textInputDisabled]}
            placeholder={item.placeholder || 'Enter value...'}
            placeholderTextColor="#999"
            value={value}
            onChangeText={(text) => handleAnswerChange(item.question_id, text)}
            keyboardType={item.type === 'number' ? 'numeric' : 'default'}
            editable={!isView}
          />
        );

      case 'textarea':
        return (
          <TextInput
            style={[styles.textArea, isView && styles.textInputDisabled]}
            placeholder={item.placeholder || 'Enter text...'}
            placeholderTextColor="#999"
            value={value}
            onChangeText={(text) => handleAnswerChange(item.question_id, text)}
            multiline
            numberOfLines={4}
            editable={!isView}
          />
        );

      case 'select':
      case 'radio':
        return (
          <View style={styles.optionsContainer}>
            {item.options?.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  value === option.value && styles.optionButtonSelected,
                ]}
                onPress={() => !isView && handleAnswerChange(item.question_id, option.value)}
                disabled={isView}
              >
                <View style={styles.radioOuter}>
                  {value === option.value && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.optionLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'checkbox':
      case 'multiselect':
        const selectedValues = value ? value.split(',') : [];
        return (
          <View style={styles.optionsContainer}>
            {item.options?.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                  onPress={() => {
                    if (isView) return;
                    let newValues = [...selectedValues];
                    if (isSelected) {
                      newValues = newValues.filter((v) => v !== option.value);
                    } else {
                      newValues.push(option.value);
                    }
                    handleAnswerChange(item.question_id, newValues.join(','));
                  }}
                  disabled={isView}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      default:
        return (
          <TextInput
            style={[styles.textInput, isView && styles.textInputDisabled]}
            placeholder="Enter value..."
            placeholderTextColor="#999"
            value={value}
            onChangeText={(text) => handleAnswerChange(item.question_id, text)}
            editable={!isView}
          />
        );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{formName || 'Assessment Form'}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading form...</Text>
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {formName || 'Assessment Form'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Form Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {formItems.map((item, index) => (
          <View key={item.question_id} style={styles.formItemContainer}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionNumber}>{index + 1}.</Text>
              <Text style={styles.questionText}>
                {item.question}
                {item.required && <Text style={styles.requiredMark}> *</Text>}
              </Text>
            </View>
            {renderFormItem(item)}
          </View>
        ))}
      </ScrollView>

      {/* Footer Buttons */}
      {!isView && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
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
  },
  contentContainer: {
    padding: 15,
  },
  formItemContainer: {
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
  questionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0070a9',
    marginRight: 8,
  },
  questionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  requiredMark: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textInputDisabled: {
    backgroundColor: '#eee',
    color: '#666',
  },
  textArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    marginTop: 4,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionButtonSelected: {
    backgroundColor: '#f0f7ff',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0070a9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0070a9',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#0070a9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: '#0070a9',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#0070a9',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FormItemsScreen;
