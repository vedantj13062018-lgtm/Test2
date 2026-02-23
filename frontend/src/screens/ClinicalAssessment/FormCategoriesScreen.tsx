/**
 * FormCategoriesScreen
 * Matches Java ClinicalAssessmentFormActivity - Form category selection
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../../services/apiService';
import { getStringFromStorage } from '../../utils/storage';
import { SESSION_ID, USER_ID } from '../../constants';

interface FormCategory {
  id: string;
  category_name: string;
  forms_count: number;
  forms_list?: FormTemplate[];
}

interface FormTemplate {
  id: string;
  form_id: string;
  name: string;
}

const FormCategoriesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientId, patientName } = route.params || {};

  const [categories, setCategories] = useState<FormCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);

      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);

      const response = await apiService.postEncrypted('ApiTiaTeleMD/fetchFormCategories', {
        user_id: userId || '',
        session_id: sessionId || '',
      });

      if (response.code === '200' || response.code === '100') {
        const data = response.data as any;
        setCategories(data?.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to fetch form categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryPress = (category: FormCategory) => {
    if (expandedCategory === category.id) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(category.id);
    }
  };

  const handleFormPress = (form: FormTemplate) => {
    navigation.navigate('FormItems', {
      patientId,
      patientName,
      formId: form.form_id,
      formName: form.name,
    });
  };

  const renderFormItem = (form: FormTemplate) => (
    <TouchableOpacity
      key={form.form_id}
      style={styles.formItem}
      onPress={() => handleFormPress(form)}
    >
      <View style={styles.formIcon}>
        <Text style={styles.formIconText}>📋</Text>
      </View>
      <Text style={styles.formName}>{form.name}</Text>
      <Text style={styles.formArrow}>›</Text>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: FormCategory }) => {
    const isExpanded = expandedCategory === item.id;

    return (
      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={styles.categoryItem}
          onPress={() => handleCategoryPress(item)}
        >
          <View style={styles.categoryIcon}>
            <Text style={styles.categoryIconText}>📁</Text>
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{item.category_name}</Text>
            <Text style={styles.categoryCount}>
              {item.forms_list?.length || item.forms_count || 0} templates
            </Text>
          </View>
          <Text style={[styles.expandIcon, isExpanded && styles.expandIconRotated]}>
            ▼
          </Text>
        </TouchableOpacity>

        {isExpanded && item.forms_list && item.forms_list.length > 0 && (
          <View style={styles.formsList}>
            {item.forms_list.map(renderFormItem)}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Form</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading categories...</Text>
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
        <Text style={styles.headerTitle}>Select Form</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Patient Info */}
      {patientName && (
        <View style={styles.patientInfo}>
          <Text style={styles.patientLabel}>Patient: {patientName}</Text>
        </View>
      )}

      {/* Categories List */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategoryItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No form categories available</Text>
          </View>
        }
      />
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
  placeholder: {
    width: 50,
  },
  patientInfo: {
    backgroundColor: '#e3f2fd',
    padding: 12,
  },
  patientLabel: {
    fontSize: 14,
    color: '#0070a9',
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
  categoryContainer: {
    marginBottom: 10,
  },
  categoryItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 12,
    color: '#666',
    transform: [{ rotate: '0deg' }],
  },
  expandIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  formsList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 2,
    marginLeft: 56,
    paddingVertical: 5,
  },
  formItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  formIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  formIconText: {
    fontSize: 14,
  },
  formName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  formArrow: {
    fontSize: 16,
    color: '#999',
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

export default FormCategoriesScreen;
