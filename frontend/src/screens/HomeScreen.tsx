/**
 * Home Screen
 * Replicated from RLDashBoardPatientActivity
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Dimensions,
  Platform,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import CustomDrawer from '../components/CustomDrawer';
import apiService from '../services/apiService';
import { DashboardPatient, TeleAppointment } from '../types';
import { API_GET_DASHBOARD_DATA } from '../constants';
import { getStringFromStorage } from '../utils/storage';
import { ORGANIZATION_ID, USER_ID, SESSION_ID } from '../constants';
import { format } from 'date-fns';
import OPListContent from '../components/home/OPListContent';
import IPListContent from '../components/home/IPListContent';
import RoundingListContent from '../components/home/RoundingListContent';
import PatientListContent from '../components/home/PatientListContent';
import MyPatientsContent from '../components/home/MyPatientsContent';
import AppointmentsContent from '../components/home/AppointmentsContent';

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('OP List');
  const [showDisableOption, setShowDisableOption] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [fromDate, setFromDate] = useState('01-01-2026');
  const [toDate, setToDate] = useState('01-31-2026');
  const [currentDate, setCurrentDate] = useState('01-14-2026');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'from' | 'to'>('from');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Data states
  const [patients, setPatients] = useState<DashboardPatient[]>([]);
  const [loading, setLoading] = useState(false);
  const [seenCount, setSeenCount] = useState('0');
  const [totalCount, setTotalCount] = useState('0');
  const [showOnHold, setShowOnHold] = useState(false);
  const [isMyPatients, setIsMyPatients] = useState(false);
  
  const dropdownOptions = ['OP List', 'IP List', 'Rounding List', 'Appointments', 'My Patients', 'Patient List'];
  
  // Map dropdown option to API type
  const getApiType = (filter: string): string => {
    const map: Record<string, string> = {
      'OP List': 'op_list',
      'IP List': 'ip_list',
      'Rounding List': 'rounding_list',
      'Appointments': 'tele_appointments',
      'My Patients': 'my_patients',
      'Patient List': 'patient_list',
    };
    return map[filter] || 'op_list';
  };

  // Fetch data from API
  const fetchData = useCallback(async (isScrolling = false) => {
    try {
      setLoading(true);
      const apiType = getApiType(selectedFilter);
      
      const params: any = {
        type: apiType,
        patient_search: searchText,
        start: isScrolling ? String(patients.length) : '0',
        limit: '10',
      };

      // Add current_date for all types except patient_list
      if (apiType !== 'patient_list') {
        params.current_date = currentDate;
      }

      // Add date range for specific types
      if (apiType === 'patient_list' || apiType === 'op_list' || 
          apiType === 'ip_list' || apiType === 'my_patients') {
        params.date_from = fromDate;
        params.date_to = toDate;
      }

      // Add type-specific parameters
      if (apiType === 'tele_appointments') {
        params.combined_view = '0';
        params.hold_status = showOnHold ? '1' : '0';
      }

      if (apiType === 'rounding_list') {
        params.sort_by = '';
        params.my_patients = isMyPatients ? '1' : '0';
      }

      // Get required parameters
      const sessionId = await getStringFromStorage(SESSION_ID);
      const userId = await getStringFromStorage(USER_ID);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);
      const timeZone = await getStringFromStorage('time_zone') || 'UTC';
      
      // Format dates for API (yyyy-MM-dd)
      const formatDateForAPI = (dateStr: string): string => {
        const [month, day, year] = dateStr.split('-');
        return `${year}-${month}-${day}`;
      };
      
      const apiParams: any = {
        session_id: sessionId,
        user_id: userId,
        organization_id: orgId,
        type: apiType,
        time_zone: timeZone,
        start: params.start || '0',
        limit: params.limit || '10',
        patient_search: params.patient_search || '',
      };
      
      // Add current_date for all types except patient_list
      if (apiType !== 'patient_list') {
        apiParams.current_date = formatDateForAPI(currentDate);
      }
      
      // Add date range for specific types
      if (apiType === 'patient_list' || apiType === 'op_list' || 
          apiType === 'ip_list' || apiType === 'my_patients') {
        if (fromDate) apiParams.date_from = formatDateForAPI(fromDate);
        if (toDate) apiParams.date_to = formatDateForAPI(toDate);
      }
      
      // Add type-specific parameters
      if (apiType === 'tele_appointments') {
        apiParams.combined_view = '0';
        apiParams.hold_status = showOnHold ? '1' : '0';
      }
      
      if (apiType === 'rounding_list') {
        apiParams.sort_by = '';
        apiParams.my_patients = isMyPatients ? '1' : '0';
      }
      
      const response = await apiService.postNumr(API_GET_DASHBOARD_DATA, apiParams);
      const isSuccess = response.code === '200' || response.code === 200;
      if (isSuccess) {
        const data = (response.data ?? {}) as TeleAppointment;
        let newPatients: DashboardPatient[] = [];

        switch (apiType) {
          case 'tele_appointments':
            newPatients = data.appointmentsArray || data.Appointments || [];
            break;
          case 'patient_list':
            newPatients = data.patientListArray || data.patientList || [];
            break;
          case 'ip_list':
            newPatients = data.ipListArray || data.IpList || [];
            break;
          case 'rounding_list':
            newPatients = data.roundingListArray || data.RoundingList || [];
            break;
          case 'op_list':
            newPatients = data.opListArray || data.OpList || [];
            break;
          case 'my_patients':
            newPatients = data.mypatientsArray || data.MyPatients || [];
            break;
        }

        if (isScrolling) {
          setPatients(prev => [...prev, ...newPatients]);
        } else {
          setPatients(newPatients);
        }

        if (data.seenCount) setSeenCount(data.seenCount);
        if (data.totalCount) setTotalCount(data.totalCount);
      } else {
        // Handle API error responses
        const errorMessage = (response.data as any)?.message || response.message || 'Failed to fetch data';
        if (errorMessage.includes('Invalid Token') || errorMessage.includes('User ID') || errorMessage.includes('Session')) {
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please log in again.',
            [{ text: 'OK' }]
          );
          // TODO: Navigate to login screen
        } else {
          Alert.alert('Error', errorMessage);
        }
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           (error?.response?.data as any)?.decrypted_text ||
                           'Failed to fetch data';
      
      if (errorMessage.includes('Invalid Token') || errorMessage.includes('User ID') || errorMessage.includes('Session')) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [{ text: 'OK' }]
        );
        // TODO: Navigate to login screen
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedFilter, searchText, currentDate, fromDate, toDate, showOnHold, isMyPatients, patients.length]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData(false);
  }, [selectedFilter, currentDate, fromDate, toDate, showOnHold, isMyPatients]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  const openDrawer = () => {
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const toggleDisableOption = () => {
    setShowDisableOption(!showDisableOption);
  };

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const parseDate = (dateString: string): Date => {
    const [day, month, year] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const current = parseDate(currentDate);
    const newDate = new Date(current);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(formatDate(newDate));
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
    const formattedDate = formatDate(newDate);
    if (datePickerType === 'from') {
      setFromDate(formattedDate);
    } else {
      setToDate(formattedDate);
    }
    setShowDatePicker(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const openDatePicker = (type: 'from' | 'to') => {
    setDatePickerType(type);
    const dateToUse = type === 'from' ? parseDate(fromDate) : parseDate(toDate);
    setSelectedDate(dateToUse);
    setCurrentMonth(dateToUse.getMonth());
    setCurrentYear(dateToUse.getFullYear());
    setShowDatePicker(true);
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    setDropdownVisible(false);
    setPatients([]);
  };

  const renderContent = () => {
    if (loading && patients.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070a9" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    const commonProps = {
      patients,
      onPatientPress: (patient: DashboardPatient) => {
        console.log('Patient pressed:', patient);
        // Navigate to patient details
      },
      onMessagePress: (patient: DashboardPatient) => {
        console.log('Message pressed:', patient);
        // Navigate to message
      },
      onCalendarPress: (patient: DashboardPatient) => {
        console.log('Calendar pressed:', patient);
        // Navigate to calendar
      },
      onHistoryPress: (patient: DashboardPatient) => {
        console.log('History pressed:', patient);
        // Navigate to history
      },
    };

    switch (selectedFilter) {
      case 'OP List':
        return <OPListContent {...commonProps} />;
      case 'IP List':
        return <IPListContent {...commonProps} />;
      case 'Rounding List':
        return (
          <RoundingListContent
            patients={patients}
            currentDate={currentDate}
            seenCount={seenCount}
            totalCount={totalCount}
            onDatePrev={() => navigateDate('prev')}
            onDateNext={() => navigateDate('next')}
            onMyPatientsPress={() => setIsMyPatients(!isMyPatients)}
            onFilterPress={() => console.log('Filter pressed')}
            onPatientPress={commonProps.onPatientPress}
            onViewPress={(patient) => console.log('View pressed:', patient)}
            onEditPress={(patient) => console.log('Edit pressed:', patient)}
            onVoicePress={(patient) => console.log('Voice pressed:', patient)}
            onExpandPress={(patient) => console.log('Expand pressed:', patient)}
            onAddPress={(patient) => console.log('Add pressed:', patient)}
            onDocumentPress={(patient) => console.log('Document pressed:', patient)}
            onMessagePress={commonProps.onMessagePress}
            onDeletePress={(patient) => console.log('Delete pressed:', patient)}
          />
        );
      case 'Patient List':
        return (
          <PatientListContent
            {...commonProps}
            onAddToRoundingPress={(patient) => console.log('Add to rounding:', patient)}
          />
        );
      case 'My Patients':
        return <MyPatientsContent {...commonProps} />;
      case 'Appointments':
        return (
          <AppointmentsContent
            appointments={patients}
            currentDate={currentDate}
            onDatePrev={() => navigateDate('prev')}
            onDateNext={() => navigateDate('next')}
            onShowOnHoldToggle={(value) => setShowOnHold(value)}
            showOnHold={showOnHold}
            onOrganizationToggle={(value) => console.log('Organization toggle:', value)}
            organizationName="TiaTele_Organisation"
            onPatientPress={commonProps.onPatientPress}
            onViewDetailsPress={(appointment) => console.log('View details:', appointment)}
            onMessagePress={commonProps.onMessagePress}
            onChatPress={(appointment) => console.log('Chat pressed:', appointment)}
            onInAppCallPress={(appointment) => console.log('In-app call:', appointment)}
            onCellCallPress={(appointment) => console.log('Cell call:', appointment)}
            onViewEHRPress={(appointment) => console.log('View EHR:', appointment)}
            onEmailVideoLinkPress={(appointment) => console.log('Email video link:', appointment)}
            onCopyVideoLinkPress={(appointment) => console.log('Copy video link:', appointment)}
            onReschedulePress={(appointment) => console.log('Reschedule:', appointment)}
            onCancelPress={(appointment) => console.log('Cancel:', appointment)}
          />
        );
      default:
        return <OPListContent {...commonProps} />;
    }
  };

  const shouldShowDateRange = () => {
    return selectedFilter === 'OP List' || selectedFilter === 'IP List' || 
           selectedFilter === 'Patient List' || selectedFilter === 'My Patients';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0070a9" translucent={false} />
      
      {/* Header with Gradient */}
      <View style={styles.headerContainer}>
        {/* Left Drawer Icon Section - Dark Blue */}
        <TouchableOpacity 
          style={styles.drawerIconContainer}
          onPress={openDrawer}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../assets/images/side_bar_icon.png')}
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
            <Text style={styles.headerTitle}>Home</Text>
          </View>
          
          {/* Right Icons */}
          <View style={styles.headerIconsContainer}>
            <TouchableOpacity style={styles.headerIcon}>
              <Image
                source={require('../../assets/images/location_new.png')}
                style={styles.headerIconImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Image
                source={require('../../assets/images/ic_alert_white.png')}
                style={styles.headerIconImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Image
                source={require('../../assets/images/mailbox.png')}
                style={styles.headerIconImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {showDisableOption && (
              <TouchableOpacity style={styles.headerIcon}>
                <View style={styles.greenCircle} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerIcon} onPress={toggleDisableOption}>
              <Image
                source={showDisableOption 
                  ? require('../../assets/images/rl_up.png')
                  : require('../../assets/images/rl_down.png')
                }
                style={styles.headerIconImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.contentWrapper}>
        {/* Dropdown Section */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setDropdownVisible(!dropdownVisible)}
          >
            <Text style={styles.dropdownButtonText}>{selectedFilter}</Text>
            <Image
              source={require('../../assets/images/rl_down.png')}
              style={styles.dropdownArrow}
              resizeMode="contain"
            />
          </TouchableOpacity>
          
          {dropdownVisible && (
            <ScrollView 
              style={styles.dropdownList}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {dropdownOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => handleFilterChange(option)}
                >
                  <Text style={styles.dropdownItemText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#96969a"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity style={styles.searchIconContainer}>
            <Image
              source={require('../../assets/images/search_ic.png')}
              style={styles.searchIconImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Date Range - Only for specific list types */}
        {shouldShowDateRange() && (
          <View style={styles.dateRangeContainer}>
            <View style={styles.dateRangeHeader}>
              <Text style={styles.dateRangeLabel}>From</Text>
              <Text style={styles.dateRangeLabel}>To</Text>
            </View>
            <View style={styles.dateRangeValues}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => openDatePicker('from')}
              >
                <Text style={styles.dateText}>{fromDate}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => openDatePicker('to')}
              >
                <Text style={styles.dateText}>{toDate}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Date Picker Modal */}
        {showDatePicker && (
          <Modal
            visible={showDatePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.datePickerModal}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <Text style={styles.datePickerHeaderYear}>{currentYear}</Text>
                  <Text style={styles.datePickerHeaderDate}>
                    {(() => {
                      const dateToShow = datePickerType === 'from' ? parseDate(fromDate) : parseDate(toDate);
                      return dateToShow.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
                    })()}
                  </Text>
                </View>
                <View style={styles.datePickerBody}>
                  <View style={styles.monthNavigation}>
                    <TouchableOpacity onPress={() => navigateMonth('prev')}>
                      <Text style={styles.monthNavArrow}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.monthText}>{monthNames[currentMonth]} {currentYear}</Text>
                    <TouchableOpacity onPress={() => navigateMonth('next')}>
                      <Text style={styles.monthNavArrow}>→</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dayNamesRow}>
                    {dayNames.map((day: string, index: number) => (
                      <Text key={index} style={styles.dayName}>{day}</Text>
                    ))}
                  </View>
                  <View style={styles.calendarGrid}>
                    {Array.from({ length: getFirstDayOfMonth(currentMonth, currentYear) }, (_, i) => (
                      <View key={`empty-${i}`} style={styles.calendarDay} />
                    ))}
                    {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }, (_, i) => {
                      const day = i + 1;
                      const dateToCheck = datePickerType === 'from' ? parseDate(fromDate) : parseDate(toDate);
                      const isSelected = dateToCheck.getDate() === day && 
                                        dateToCheck.getMonth() === currentMonth && 
                                        dateToCheck.getFullYear() === currentYear;
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
                          onPress={() => handleDateSelect(day)}
                        >
                          <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                <View style={styles.datePickerFooter}>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.datePickerButtonText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => {
                      const formattedDate = formatDate(selectedDate);
                      if (datePickerType === 'from') {
                        setFromDate(formattedDate);
                      } else {
                        setToDate(formattedDate);
                      }
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={styles.datePickerButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Dynamic Content */}
        <View style={styles.dynamicContentContainer}>
          {renderContent()}
        </View>
      </View>

      {/* Custom Drawer */}
      <CustomDrawer isOpen={drawerOpen} onClose={closeDrawer} />
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
  drawerIconContainer: {
    width: 65,
    height: '100%',
    backgroundColor: '#00006e',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  drawerIcon: {
    width: 40,
    height: 40,
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
    width: '100%',
    backgroundColor: '#00a0c3',
  },
  gradientMiddle: {
    position: 'absolute',
    left: '15%',
    top: 0,
    bottom: 0,
    width: '15%',
    backgroundColor: '#00a0c3',
  },
  gradientRight: {
    position: 'absolute',
    left: '100%',
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
  headerIconsContainer: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  headerIcon: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconImage: {
    width: 20,
    height: 20,
    tintColor: '#ffffff',
  },
  greenCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00ff00',
  },
  contentWrapper: {
    flex: 1,
    padding: 10,
  },
  dropdownContainer: {
    marginBottom: 10,
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    backgroundColor: '#ffffff',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Montserrat',
  },
  dropdownArrow: {
    width: 16,
    height: 16,
    tintColor: '#0070a9',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 5,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 300,
    zIndex: 1001,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Montserrat',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 5,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Montserrat',
  },
  searchIconContainer: {
    padding: 5,
  },
  searchIconImage: {
    width: 20,
    height: 20,
    tintColor: '#96969a',
  },
  dateRangeContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  dateRangeHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 5,
  },
  dateRangeLabel: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Montserrat',
    marginRight: 40,
  },
  dateRangeValues: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 30,
  },
  dateText: {
    fontSize: 15,
    color: '#000000',
    fontFamily: 'Montserrat',
    fontWeight: 'bold',
  },
  datePickerModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    width: width * 0.9,
    maxWidth: 400,
    overflow: 'hidden',
  },
  datePickerHeader: {
    backgroundColor: '#0070a9',
    padding: 20,
    alignItems: 'flex-start',
  },
  datePickerHeaderYear: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 5,
  },
  datePickerHeaderDate: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  datePickerBody: {
    padding: 20,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  monthNavArrow: {
    fontSize: 20,
    color: '#0070a9',
    padding: 10,
  },
  monthText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: 'bold',
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dayName: {
    fontSize: 14,
    color: '#000000',
    fontWeight: 'bold',
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calendarDay: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  calendarDaySelected: {
    backgroundColor: '#0070a9',
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#000000',
  },
  calendarDayTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  datePickerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderTopColor: '#e0e0e0',
  },
  datePickerButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#00b8db',
    fontWeight: 'bold',
  },
  dynamicContentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#96969a',
    fontFamily: 'Montserrat',
  },
});

export default HomeScreen;
