/**
 * Organization Selection Screen (Choose Location)
 * Replicated from TeleMD_FileShare_Fix ChooseLocationScreen
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectOrganization } from '../../store/slices/authSlice';
import { RootStackParamList } from '../../types';
import { Organization } from '../../types';
import { saveStringToStorage, getStringFromStorage, getObjectFromStorage } from '../../utils/storage';
import {
  ORGANIZATION_ID,
  ORGANIZATION_NAME,
  PRACTICE_LOC_ID,
  PRACTICE_LOC_NAME,
} from '../../constants';
import apiService from '../../services/apiService';
import { API_FETCH_ORGANIZATION_LIST, API_SAVE_DOC_ORGANIZATION } from '../../constants';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const OrganizationSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { organizations: reduxOrgs } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [practiceModalVisible, setPracticeModalVisible] = useState(false);
  const [selectedOrgForPractice, setSelectedOrgForPractice] = useState<Organization | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // 1) Prefer cached org list from login
        const cached = await getObjectFromStorage('org_list');
        if (Array.isArray(cached) && cached.length > 0) {
          const mappedOrgs = cached.map((o: any) => ({
            organizationId: String(o.organizationId || o.organization_unit_id || o.id || ''),
            organizationName: String(o.organizationName || o.organization_unit_name || o.name || ''),
            practice_array: Array.isArray(o.practice_array) ? o.practice_array : [],
            filesharemenu: o.filesharemenu,
            AppointmentEnabledFlag: o.AppointmentEnabledFlag,
          }));
          setOrganizations(mappedOrgs);
          setLoading(false);
          return;
        }

        // 2) Route params fallback (if passed)
        const params: any = (route as any)?.params || {};
        if (params?.organizations && Array.isArray(params.organizations) && params.organizations.length > 0) {
          const mappedOrgs = params.organizations.map((o: any) => ({
            organizationId: String(o.organizationId || o.organization_unit_id || o.id || ''),
            organizationName: String(o.organizationName || o.organization_unit_name || o.name || ''),
            practice_array: Array.isArray(o.practice_array) ? o.practice_array : [],
            filesharemenu: o.filesharemenu,
            AppointmentEnabledFlag: o.AppointmentEnabledFlag,
          }));
          setOrganizations(mappedOrgs);
          setLoading(false);
          return;
        }

        // 3) Redux state fallback
        if (reduxOrgs && reduxOrgs.length > 0) {
          setOrganizations(reduxOrgs);
          setLoading(false);
          return;
        }

        // 4) Fetch from API
        await loadOrganizations();
      } catch (e) {
        console.error('[OrganizationSelection] init error:', e);
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const sessionId = await getStringFromStorage('session_id');
      const userId = await getStringFromStorage('userID');

      if (!sessionId || !userId) {
        Alert.alert('Error', 'Session expired. Please login again.');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      const response = await apiService.postEncrypted(API_FETCH_ORGANIZATION_LIST, {
        session_id: sessionId,
        user_id: userId,
      });

      const orgList = response.data?.organizationList || response.data?.organizations;
      if ((response.code === '100' || response.status === 'success' || response.status === 'SUCCESS') && orgList && Array.isArray(orgList)) {
        const mappedOrgs = orgList.map((o: any) => ({
          organizationId: String(o.organizationId ?? o.organization_unit_id ?? o.id ?? ''),
          organizationName: String(o.organizationName ?? o.organization_unit_name ?? o.name ?? ''),
          practice_array: Array.isArray(o.practice_array) ? o.practice_array : [],
          filesharemenu: o.filesharemenu,
          AppointmentEnabledFlag: o.AppointmentEnabledFlag,
        }));
        setOrganizations(mappedOrgs);
      } else {
        Alert.alert('Error', 'Failed to load organizations');
      }
    } catch (error) {
      console.error('[OrganizationSelection] fetch organizations error:', error);
      Alert.alert('Error', 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const saveOrganization = async (organization: Organization) => {
    try {
      if (loading) return;
      setLoading(true);
      
      const sessionId = await getStringFromStorage('session_id');
      const userId = await getStringFromStorage('userID');
      const doctorId = await getStringFromStorage('doctor_id');

      const response = await apiService.postEncrypted(API_SAVE_DOC_ORGANIZATION, {
        session_id: sessionId,
        user_id: userId,
        doctor_id: doctorId || '',
        organization_id: organization.organizationId,
        practice_id: await getStringFromStorage(PRACTICE_LOC_ID) || '0',
      });

      // 401 = session invalid/unauthorized on base server (e.g. "USER ALREADY LOGGED IN" session not valid on base)
      if (String(response.code) === '401') {
        const message = (response.status || response.message || 'Session expired or invalid.').toString();
        Alert.alert(
          'Session expired',
          message + '\n\nPlease log in again.',
          [{ text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }]
        );
        return;
      }

      const isSavedSuccess =
        !!response &&
        (String(response.code) === '100' ||
          String(response.code) === '200' ||
          String((response.status || '').toUpperCase()).includes('SAVED SUCCESSFULLY') ||
          String((response.status || '').toUpperCase()).includes('SUCCESS') ||
          String(response.data?.message || '').toLowerCase() === 'success');

      if (isSavedSuccess) {
        await saveStringToStorage(ORGANIZATION_ID, organization.organizationId);
        await saveStringToStorage(ORGANIZATION_NAME, organization.organizationName);
        await saveStringToStorage('IsOrganizationSelected', '1');

        // Set organization in Redux
        dispatch(selectOrganization({
          organizationId: organization.organizationId,
          organizationName: organization.organizationName,
        }));

        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } else {
        const serverMsg = response.status || response.message || 'Failed to save organization';
        Alert.alert('Error', typeof serverMsg === 'string' ? serverMsg : 'Failed to save organization');
      }
    } catch (error) {
      console.error('[OrganizationSelection] save organization error:', error);
      Alert.alert('Error', 'Failed to save organization');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrganization = async (organization: Organization) => {
    try {
      if (!organization.practice_array || organization.practice_array.length === 0) {
        await saveStringToStorage(PRACTICE_LOC_ID, '0');
        await saveStringToStorage(PRACTICE_LOC_NAME, '');
        await saveOrganization(organization);
      } else if (organization.practice_array.length === 1) {
        const practice = organization.practice_array[0];
        await saveStringToStorage(PRACTICE_LOC_ID, String(practice.id || '0'));
        await saveStringToStorage(PRACTICE_LOC_NAME, practice.name || '');
        await saveOrganization(organization);
      } else {
        setSelectedOrgForPractice(organization);
        setPracticeModalVisible(true);
      }
    } catch (e) {
      console.error('[OrganizationSelection] handleSelectOrganization error:', e);
      Alert.alert('Error', 'Failed to select organization');
    }
  };

  const handleSelectPractice = async (practiceId: string, practiceName: string) => {
    if (!selectedOrgForPractice) return;
    try {
      await saveStringToStorage(PRACTICE_LOC_ID, practiceId);
      await saveStringToStorage(PRACTICE_LOC_NAME, practiceName);
      setPracticeModalVisible(false);
      const org = selectedOrgForPractice;
      setSelectedOrgForPractice(null);
      await saveOrganization(org);
    } catch (e) {
      console.error('[OrganizationSelection] handleSelectPractice error:', e);
      Alert.alert('Error', 'Failed to select practice location');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0070a9" />
      
      {/* Header with Gradient – no marginTop so header starts at top like SupportFeedbackScreen/DirectoryScreen */}
      <View style={styles.headerContainer}>
        <View style={styles.gradientHeader}>
          <View style={styles.gradientLeft} />
          <View style={styles.gradientMiddle} />
          <View style={styles.gradientRight} />
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Choose Location</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0070a9" />
            <Text style={styles.loadingText}>Loading organizations...</Text>
          </View>
        ) : (
          <FlatList
            data={organizations}
            keyExtractor={(item) => item.organizationId}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.organizationItem}
                onPress={() => handleSelectOrganization(item)}
              >
                <Text style={styles.organizationName}>{item.organizationName}</Text>
                {item.practice_array && item.practice_array.length > 0 && (
                  <Text style={styles.practiceCount}>
                    {item.practice_array.length} practice location(s)
                  </Text>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Practice selection modal */}
      <Modal
        visible={practiceModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPracticeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Practice Location</Text>

            <FlatList
              data={selectedOrgForPractice?.practice_array || []}
              keyExtractor={(p: any, idx: number) => String(p?.id ?? idx)}
              renderItem={({ item }: any) => (
                <TouchableOpacity
                  style={styles.practiceItem}
                  onPress={() => handleSelectPractice(String(item?.id ?? ''), item?.name ?? 'Practice')}
                >
                  <Text style={styles.practiceName}>{item?.name ?? 'Practice'}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => {
                setPracticeModalVisible(false);
                setSelectedOrgForPractice(null);
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    height: 50,
    width: '100%',
  },
  gradientHeader: {
    flex: 1,
    justifyContent: 'center',
    height: '100%',
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0070a9',
  },
  titleContainer: {
    position: 'absolute',
    left: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 2,
  },
  gradientLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '35%',
    backgroundColor: '#0070a9',
  },
  gradientMiddle: {
    position: 'absolute',
    left: '35%',
    top: 0,
    bottom: 0,
    width: '30%',
    backgroundColor: '#00a0c3',
  },
  gradientRight: {
    position: 'absolute',
    left: '65%',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#00b8db',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  },
  contentContainer: {
    flex: 1,
    padding: 10,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666666',
  },
  listContent: {
    paddingBottom: 20,
  },
  organizationItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  organizationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
    fontFamily: 'Montserrat',
  },
  practiceCount: {
    fontSize: 13,
    color: '#666666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },
  practiceItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  practiceName: {
    fontSize: 16,
    color: '#333',
  },
  modalCancel: {
    marginTop: 12,
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  modalCancelText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrganizationSelectionScreen;
