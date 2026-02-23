/**
 * Dashboard Screen
 * Matches Swift DashboardViewController
 */

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  RefreshControl, 
  ActivityIndicator,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setItems, setLoading } from '../../store/slices/dashboardSlice';
import { DashboardItem, RootStackParamList } from '../../types';
import apiService from '../../services/apiService';
import { API_GET_DASHBOARD_DATA, COLORS } from '../../constants';
import { getStringFromStorage } from '../../utils/storage';
import { format } from 'date-fns';
import CustomDrawer from '../../components/CustomDrawer';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { items, isLoading } = useAppSelector((state) => state.dashboard);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardType, setDashboardType] = useState('op_list'); // Default to OP List
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = () => {
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const handlePatientPress = (item: DashboardItem) => {
    // Navigate to patient details with patient context
    navigation.navigate('PatientDetails', {
      patientId: item.id || item.patientId || '',
      encounterId: item.encounterId || item.encounter_id || '',
    });
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    dispatch(setLoading(true));
    try {
      // Get required parameters (matching Swift DashboardViewController.swift lines 1525-1531)
      const timeZone = await getStringFromStorage('time_zone') || 'UTC';
      const currentDate = format(new Date(), 'MM-dd-yyyy'); // Format: MM-dd-yyyy
      const currentDateSearchString = format(new Date(), 'yyyy-MM-dd'); // Format for API: yyyy-MM-dd
      
      // For op_list, ip_list, patient_list, my_patients - set date_from and date_to
      // Matching Swift lines 1526-1531
      let dateFrom = '';
      let dateTo = '';
      
      if (dashboardType === 'op_list' || dashboardType === 'ip_list' || dashboardType === 'patient_list' || dashboardType === 'my_patients') {
        // Set date range to first and last day of current month (matching Swift behavior)
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        dateFrom = format(firstDay, 'yyyy-MM-dd'); // Format: yyyy-MM-dd for API
        dateTo = format(lastDay, 'yyyy-MM-dd'); // Format: yyyy-MM-dd for API
      }
      
      // Build params matching Swift implementation
      const params = {
        current_date: currentDateSearchString,
        type: dashboardType,
        patient_search: '',
        date_from: dateFrom,
        date_to: dateTo,
        limit: '100',
        start: 0,
        time_zone: timeZone,
        combined_view: '0', // Default to 0 (not combined view)
        my_patients: 0,
        sort_by: '',
      };
      
      console.log('Dashboard API params:', params);

      console.log('Loading dashboard data with params:', params);
      // Use postNumr instead of postEncrypted - dashboard uses SERVER_URL and Numr headers
      const response = await apiService.postNumr(API_GET_DASHBOARD_DATA, params);
      
      console.log('Dashboard response:', {
        code: response.code,
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        fullResponseStructure: JSON.stringify(response).substring(0, 1000),
      });
      
      // Log the actual data structure
      if (response.data) {
        console.log('Response.data structure:', {
          isArray: Array.isArray(response.data),
          isObject: typeof response.data === 'object',
          keys: Object.keys(response.data),
          opListType: typeof response.data.OpList,
          opListIsArray: Array.isArray(response.data.OpList),
          opListValue: response.data.OpList,
        });
      }

      // Swift expects code "200" for success (line 1539)
      // For code "200", Swift: let data = result as! [String:AnyObject]
      // The result parameter IS the data dictionary (contains OpList, IpList, etc.)
      // So response.data should be the data dictionary directly
      let data = response.data;
      
      console.log('=== DASHBOARD DATA PROCESSING ===');
      console.log('Response code:', response.code);
      console.log('Response status:', response.status);
      console.log('Has response.data:', !!response.data);
      console.log('Response.data type:', typeof response.data);
      console.log('Response.data is array:', Array.isArray(response.data));
      
      if (response.data) {
        console.log('Response.data keys:', Object.keys(response.data));
        console.log('OpList exists:', 'OpList' in response.data);
        console.log('OpList value:', response.data.OpList);
        console.log('OpList type:', typeof response.data.OpList);
        console.log('OpList is array:', Array.isArray(response.data.OpList));
        if (Array.isArray(response.data.OpList)) {
          console.log('OpList length:', response.data.OpList.length);
          if (response.data.OpList.length > 0) {
            console.log('First OpList item:', JSON.stringify(response.data.OpList[0], null, 2));
          }
        }
      }
      
      if (response.code === '200' && data) {
        // Response structure: patientList, Appointments, IpList, RoundingList, OpList, MyPatients
        // Swift only processes the list matching the current dashboardType
        // We'll process the list matching dashboardType (default: 'op_list')
        const allItems: DashboardItem[] = [];
        
        // Process based on dashboardType (matching Swift behavior)
        // Swift checks: if self.titleLabel.text == "OP List" { for item in opList { ... } }
        console.log(`Processing dashboard type: ${dashboardType}`);
        
        // Process OpList (Outpatient List) - matching Swift line 1545, 1696-1712
        if (dashboardType === 'op_list') {
          console.log('Checking OpList:', {
            exists: 'OpList' in data,
            value: data.OpList,
            isArray: Array.isArray(data.OpList),
            length: Array.isArray(data.OpList) ? data.OpList.length : 'N/A',
          });
          
          if (data.OpList && Array.isArray(data.OpList)) {
            console.log(`Processing ${data.OpList.length} OP list items`);
            if (data.OpList.length > 0) {
              console.log('First OpList item structure:', Object.keys(data.OpList[0]));
              console.log('First OpList item:', JSON.stringify(data.OpList[0], null, 2).substring(0, 500));
            }
            
            data.OpList.forEach((item: any, index: number) => {
              const dashboardItem: DashboardItem = {
                id: String(item.id || item.visit_id || `op_${index}`),
                title: item.patient_name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown Patient',
                type: 'op_list',
                patientId: String(item.patient_id || ''),
                encounterId: String(item.encounter_id || ''),
                appointmentId: String(item.booking_id || ''),
                date: item.last_visited || item.start_datetime || '',
                status: item.visit_status || '',
                isFavorite: false,
              };
              allItems.push(dashboardItem);
              if (index === 0) {
                console.log('Created first OpList dashboard item:', dashboardItem);
              }
            });
            console.log(`Added ${data.OpList.length} items from OpList`);
          } else {
            console.warn('OpList is missing, empty, or not an array:', {
              exists: 'OpList' in data,
              value: data.OpList,
              type: typeof data.OpList,
              isArray: Array.isArray(data.OpList),
            });
          }
        }
        
        // Process IpList (Inpatient List) - matching Swift line 1612-1628
        else if (dashboardType === 'ip_list') {
          if (data.IpList && Array.isArray(data.IpList)) {
            console.log(`Processing ${data.IpList.length} IP list items`);
            data.IpList.forEach((item: any) => {
              allItems.push({
                id: String(item.id || item.visit_id || ''),
                title: item.patient_name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown Patient',
                type: 'ip_list',
                patientId: String(item.patient_id || ''),
                encounterId: String(item.encounter_id || ''),
                appointmentId: String(item.booking_id || ''),
                date: item.last_visited || item.start_datetime || '',
                status: item.visit_status || '',
                isFavorite: false,
              });
            });
          }
        }
        
        // Process Appointments - matching Swift line 1570-1592
        else if (dashboardType === 'tele_appointments') {
          if (data.Appointments && Array.isArray(data.Appointments)) {
            console.log(`Processing ${data.Appointments.length} appointment items`);
            data.Appointments.forEach((item: any) => {
              allItems.push({
                id: String(item.id || item.appointment_id || ''),
                title: item.patient_name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown Patient',
                type: 'appointment',
                patientId: String(item.patient_id || ''),
                encounterId: String(item.encounter_id || ''),
                appointmentId: String(item.appointment_id || item.id || ''),
                date: item.appointment_date || item.start_datetime || '',
                status: item.status || '',
                isFavorite: false,
              });
            });
          }
        }
        
        // Process RoundingList - matching Swift line 1630-1671
        else if (dashboardType === 'rounding_list') {
          if (data.RoundingList && Array.isArray(data.RoundingList)) {
            console.log(`Processing ${data.RoundingList.length} rounding list items`);
            data.RoundingList.forEach((item: any) => {
              allItems.push({
                id: String(item.id || item.visit_id || ''),
                title: item.patient_name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown Patient',
                type: 'rounding_list',
                patientId: String(item.patient_id || ''),
                encounterId: String(item.encounter_id || ''),
                appointmentId: String(item.booking_id || ''),
                date: item.last_visited || item.start_datetime || '',
                status: item.visit_status || '',
                isFavorite: false,
              });
            });
          }
        }
        
        // Process patientList - matching Swift line 1594-1610
        else if (dashboardType === 'patient_list') {
          if (data.patientList && Array.isArray(data.patientList)) {
            console.log(`Processing ${data.patientList.length} patient list items`);
            data.patientList.forEach((item: any) => {
              allItems.push({
                id: String(item.id || item.patient_id || ''),
                title: item.patient_name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown Patient',
                type: 'patient_list',
                patientId: String(item.patient_id || ''),
                encounterId: String(item.encounter_id || ''),
                appointmentId: String(item.booking_id || ''),
                date: item.last_visited || item.start_datetime || '',
                status: item.visit_status || '',
                isFavorite: false,
              });
            });
          }
        }
        
        // Process MyPatients - matching Swift line 1714-1730
        else if (dashboardType === 'my_patients') {
          if (data.MyPatients && Array.isArray(data.MyPatients)) {
            console.log(`Processing ${data.MyPatients.length} my patients items`);
            data.MyPatients.forEach((item: any) => {
              allItems.push({
                id: String(item.id || item.visit_id || ''),
                title: item.patient_name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown Patient',
                type: 'my_patients',
                patientId: String(item.patient_id || ''),
                encounterId: String(item.encounter_id || ''),
                appointmentId: String(item.booking_id || ''),
                date: item.last_visited || item.start_datetime || '',
                status: item.visit_status || '',
                isFavorite: false,
              });
            });
          }
        }
        
        console.log(`Loaded ${allItems.length} dashboard items total`);
        dispatch(setItems(allItems));
      } else {
        console.warn('Dashboard API returned unexpected response:', response);
        dispatch(setItems([]));
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      dispatch(setItems([]));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: DashboardItem }) => (
    <TouchableOpacity 
      style={styles.item}
      onPress={() => handlePatientPress(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.itemTitle}>{item.title}</Text>
      {item.date && <Text style={styles.itemDate}>{item.date}</Text>}
    </TouchableOpacity>
  );

  if (isLoading && items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0070a9" />
      
      {/* Header with Gradient */}
      <View style={[styles.headerContainer, { marginTop: statusBarHeight }]}>
        {/* Left Drawer Icon Section - Dark Blue */}
        <TouchableOpacity 
          style={styles.drawerIconContainer}
          onPress={openDrawer}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../../assets/images/side_bar_icon.png')}
            style={styles.drawerIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Gradient Header Section */}
        <View style={styles.gradientHeader}>
          <View style={styles.gradientLeft} />
          <View style={styles.gradientMiddle} />
          <View style={styles.gradientRight} />
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        }
      />

      {/* Custom Drawer */}
      <CustomDrawer isOpen={drawerOpen} onClose={closeDrawer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    height: 50,
    width: '100%',
  },
  drawerIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#0070a9', // Dark blue
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  drawerIcon: {
    width: 24,
    height: 24,
    tintColor: '#ffffff',
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
  titleContainer: {
    position: 'absolute',
    left: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 2,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  },
  item: {
    padding: 16,
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});

export default DashboardScreen;
