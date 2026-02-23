/**
 * Support & Feedback Screen
 * Replicated from StrokeTeamOne ConcernActivity – same UI and APIs.
 * - Type: dropdown from fetchConcernTypes (ApiTiaTeleMD/fetchConcernTypes)
 * - Details: multiline text
 * - SUBMIT REQUEST: saveConcernTypes (ApiTiaTeleMD/saveConcernTypes)
 * - SPEAK TO AN EXECUTIVE: confirm dialog then fetchSupportdetails → call tech_support
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import apiService from '../services/apiService';
import { getStringFromStorage } from '../utils/storage';
import { SESSION_ID, USER_ID } from '../constants';
import {
  API_FETCH_CONCERN_TYPES,
  API_SAVE_CONCERN_DETAILS,
  API_FETCH_SUPPORT_DETAILS,
} from '../constants';
import DeviceInfo from 'react-native-device-info';

const SELECT_PLACEHOLDER = '-Select-';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SupportFeedback'>;

interface ConcernType {
  id?: string;
  type: string;
}

interface SupportDetailsData {
  tech_support?: string;
  details?: string;
  billing?: string;
  email?: string;
  office?: string;
  cell?: string;
  fax?: string;
}

const SupportFeedbackScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [concernTypes, setConcernTypes] = useState<ConcernType[]>([]);
  const [selectedType, setSelectedType] = useState<string>(SELECT_PLACEHOLDER);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const fetchConcernTypes = useCallback(async () => {
    try {
      setLoading(true);
      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      // Same params as StrokeTeamOne ConcernActivity: user_id, session_id (apiService adds organization_id)
      const params: Record<string, string> = {
        user_id: userId || '',
        session_id: sessionId || '',
      };
      const response = await apiService.postEncrypted(API_FETCH_CONCERN_TYPES, params);
      const ok = response.code === '200' || response.code === '100';
      if (ok && response.data != null) {
        const raw = response.data as any;
        // Backend can return: { data: [...] } or direct array; support multiple shapes like Android ResponseResult.getData()
        let list: any[] = [];
        if (Array.isArray(raw)) {
          list = raw;
        } else if (raw && typeof raw === 'object') {
          list =
            Array.isArray(raw.concern_types)
              ? raw.concern_types
              : Array.isArray(raw.concernTypes)
                ? raw.concernTypes
                : Array.isArray(raw.data)
                  ? raw.data
                  : Array.isArray(raw.list)
                    ? raw.list
                    : Array.isArray(raw.types)
                      ? raw.types
                      : [];
        }
        const normalized: ConcernType[] = list
          .filter((c: any) => c != null && typeof c === 'object')
          .map((c: any) => ({
            id: c.id ?? c.concern_id,
            type: c.type ?? c.type_name ?? String(c),
          }))
          .filter((c) => c.type);
        setConcernTypes(normalized);
      } else {
        setConcernTypes([]);
      }
    } catch (e) {
      console.error('[SupportFeedback] fetchConcernTypes error:', e);
      setConcernTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchConcernTypes();
    }, [fetchConcernTypes])
  );

  const submitRequest = async () => {
    if (selectedType === SELECT_PLACEHOLDER || !selectedType.trim()) {
      Alert.alert('', 'Please Select a Type');
      return;
    }
    try {
      setSubmitting(true);
      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const appName = await DeviceInfo.getApplicationName().catch(() => 'TiaTeleMD');
      const response = await apiService.postEncrypted(API_SAVE_CONCERN_DETAILS, {
        user_id: userId,
        session_id: sessionId,
        type: selectedType,
        description: details.trim(),
        app_name: appName,
      });
      const ok =
        response.code === '200' ||
        response.code === '100' ||
        (response.status && String(response.status).toLowerCase() === 'success');
      if (ok) {
        Alert.alert('Success', response.message || 'Success !', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        setSelectedType(SELECT_PLACEHOLDER);
        setDetails('');
      } else {
        Alert.alert('Error', response.message || 'Failed to submit request');
      }
    } catch (e: any) {
      console.error('[SupportFeedback] saveConcern error:', e);
      Alert.alert('Error', e.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const speakToExecutive = () => {
    Alert.alert(
      'Speak to an Executive',
      'Do you want to speak to a support executive ? (Local call charges apply)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const sessionId = await getStringFromStorage(SESSION_ID);
              const userId = await getStringFromStorage(USER_ID);
              const response = await apiService.postEncrypted<SupportDetailsData>(
                API_FETCH_SUPPORT_DETAILS,
                { user_id: userId, session_id: sessionId }
              );
              if ((response.code === '200' || response.code === '100') && response.data?.tech_support) {
                const phone = response.data.tech_support.trim();
                if (phone) {
                  await Linking.openURL(`tel:${phone}`);
                } else {
                  Alert.alert('', 'Support number not available');
                }
              } else {
                Alert.alert('', 'Support details could not be loaded');
              }
            } catch (e) {
              console.error('[SupportFeedback] fetchSupportdetails error:', e);
              Alert.alert('Error', 'Could not load support number');
            }
          },
        },
      ]
    );
  };

  const typeOptions = [SELECT_PLACEHOLDER, ...concernTypes.map((c) => c.type).filter(Boolean)];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00006e" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {/* Header – same as NewsletterScreen / screenshot */}
        <View style={styles.headerContainer}>
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Support & feedback</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#0070a9" />
            </View>
          ) : (
            <>
              {/* Type – fetched from API */}
              <Text style={styles.label}>Type</Text>
              <TouchableOpacity
                style={styles.typeField}
                onPress={() => setDropdownVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeFieldText, selectedType === SELECT_PLACEHOLDER && styles.placeholder]}>
                  {selectedType}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>

              <Modal
                visible={dropdownVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDropdownVisible(false)}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setDropdownVisible(false)}
                >
                  <View style={styles.dropdownCard} pointerEvents="box-none">
                    <View style={styles.dropdownList}>
                      <ScrollView
                        style={styles.dropdownScroll}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={true}
                      >
                        {typeOptions.map((opt) => (
                          <TouchableOpacity
                            key={opt}
                            style={[
                              styles.dropdownItem,
                              selectedType === opt && styles.dropdownItemSelected,
                            ]}
                            onPress={() => {
                              setSelectedType(opt);
                              setDropdownVisible(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                selectedType === opt && styles.dropdownItemTextSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {opt}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </TouchableOpacity>
              </Modal>

              {/* Details – large box like StrokeTeamOne cardViewDetails */}
              <Text style={styles.label}>Details</Text>
              <TextInput
                style={styles.detailsInput}
                placeholder=""
                placeholderTextColor="#999"
                value={details}
                onChangeText={setDetails}
                multiline
                textAlignVertical="top"
              />
            </>
          )}
        </ScrollView>

        {/* Buttons pinned to bottom – same as activity_concern layout_btns alignParentBottom */}
        <View style={styles.buttonsWrap}>
          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.buttonDisabled]}
            onPress={submitRequest}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>SUBMIT REQUEST</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={speakToExecutive}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>SPEAK TO AN EXECUTIVE</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardView: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: '#0070a9',
    // No paddingTop – match NewsletterScreen/DirectoryScreen so no gap above header
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
    marginLeft: 4,
  },
  typeField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 45,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  typeFieldText: {
    fontSize: 16,
    color: '#000',
  },
  placeholder: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dropdownCard: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    minHeight: 120,
    maxHeight: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownList: {
    maxHeight: 320,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 320,
  },
  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  dropdownItemSelected: {
    backgroundColor: '#E8F4FD',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000',
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
    color: '#0070a9',
  },
  detailsInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    padding: 12,
    minHeight: 240,
    fontSize: 16,
    color: '#000',
  },
  buttonsWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#F2F2F7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DDD',
  },
  primaryButton: {
    backgroundColor: '#000053',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#000053',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default SupportFeedbackScreen;
