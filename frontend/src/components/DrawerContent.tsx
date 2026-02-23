/**
 * Drawer Content Component
 * Replicated from TeleMD_FileShare_Fix nav_drawer_menu.xml
 * Logout flow matches StrokeTeamOne BaseActivity.logout() and DataManager.doLogoutUser (node + encrypted app_data).
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { RootStackParamList } from '../types';
import apiService from '../services/apiService';
import { getStringFromStorage, removeFromStorage } from '../utils/storage';
import {
  SESSION_ID,
  USER_ID,
  USER_NAME,
  USER_TYPE,
  ORGANIZATION_ID,
  ORGANIZATION_NAME,
  ORGANIZATION_COUNT,
  PRACTICE_LOC_ID,
  PRACTICE_LOC_NAME,
  IS_LOGGED_IN,
  LOGOUT_URL,
  SPECIALITY_ID,
} from '../constants';
import { logout as logoutAction } from '../store/slices/authSlice';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DrawerContentProps {
  onClose?: () => void;
}

const DrawerContent: React.FC<DrawerContentProps> = ({ onClose }) => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleNavigation = (screenName: keyof RootStackParamList) => {
    if (onClose) onClose();
    navigation.navigate(screenName as never);
  };

  /** Clear session storage to match Android Session clears in BaseActivity.logout() and SocketConnection "logout" event.
   * Must use removeFromStorage (not saveStringToStorage(key, '')) so Keychain is cleared; otherwise old session_id
   * remains in Keychain and getStringFromStorage returns it on next login, causing login to fail. */
  const clearSessionStorage = async () => {
    const keys = [
      SESSION_ID,
      USER_ID,
      USER_NAME,
      USER_TYPE,
      ORGANIZATION_ID,
      ORGANIZATION_NAME,
      ORGANIZATION_COUNT,
      PRACTICE_LOC_ID,
      PRACTICE_LOC_NAME,
      IS_LOGGED_IN,
      SPECIALITY_ID,
      'doctor_id',
      'user_level',
      'admin',
      'designation',
      'token',
      'IsOrganizationSelected',
      'chat_user_name',
      'nuance_org',
      'nuance_guid',
      'nuance_user',
      'time_zone',
      'is_multifactor_enabled',
      'mfaToken',
      'org_list', // stored via saveObjectToStorage; removeFromStorage clears AsyncStorage
    ];
    for (const key of keys) {
      await removeFromStorage(key);
    }
  };

  const performLogout = async () => {
    if (onClose) onClose();
    setLoggingOut(true);
    try {
      const sessionId = await getStringFromStorage(SESSION_ID);
      // Match Android: POST to node server with encrypted app_data { session_id } (DataManager.doLogoutUser, getLogoutParams)
      if (sessionId) {
        try {
          const res = await apiService.postEncrypted(LOGOUT_URL, { session_id: sessionId });
          const msg = (res?.data as any)?.message ?? (res?.data as any)?.status ?? (typeof res?.data === 'string' ? res.data : null);
          if (msg) console.log('Logout response:', msg);
        } catch (error) {
          console.error('Logout API error:', error);
          // Still clear local session and navigate (match Android: onError only hides progress and shows toast)
        }
      }

      // Match Android: SocketConnection.socketLogout()
      try {
        const socketService = require('../services/socketService').default;
        socketService.disconnect();
      } catch (_) {
        // Socket may not be initialized
      }

      await clearSessionStorage();
      dispatch(logoutAction());

      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      await clearSessionStorage();
      dispatch(logoutAction());
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLogout = () => {
    // Match Android BaseActivity.showConfirmDialog() – confirm before logout
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: performLogout },
      ],
      { cancelable: true }
    );
  };

  // Get user info from storage
  const [userName, setUserName] = React.useState('');
  const [designation, setDesignation] = React.useState('');
  const [organizationName, setOrganizationName] = React.useState('');

  React.useEffect(() => {
    const loadUserInfo = async () => {
      const name = await getStringFromStorage('user_name');
      const desig = await getStringFromStorage('designation');
      const orgName = await getStringFromStorage('organization_Name');
      setUserName(name || '');
      setDesignation(desig || '');
      setOrganizationName(orgName || '');
    };
    loadUserInfo();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View style={styles.editIconContainer}>
              <Text style={styles.editIcon}>✏️</Text>
            </View>
          </View>
          
          <Text style={styles.profileName}>{userName.toUpperCase() || 'USER'}</Text>
          <Text style={styles.profileRole}>{designation.toUpperCase() || ''}</Text>
          <Text style={styles.profileLocation}>{organizationName || ''}</Text>
        </View>

        {/* Menu Header */}
        <TouchableOpacity style={styles.menuHeader} onPress={onClose}>
          <Text style={styles.menuHeaderArrow}>←</Text>
          <Text style={styles.menuHeaderText}>MENU</Text>
        </TouchableOpacity>

        {/* Menu Items */}
        <View style={styles.menuItems}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleNavigation('MainTabs')}
          >
            <Text style={styles.menuItemText}>Home</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              // TODO: Navigate to Settings when screen is created
              if (onClose) onClose();
            }}
          >
            <Text style={styles.menuItemText}>Settings</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              // TODO: Navigate to AppointmentHistory when screen is created
              if (onClose) onClose();
            }}
          >
            <Text style={styles.menuItemText}>Appointment History</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              // TODO: Navigate to Schedule when screen is created
              if (onClose) onClose();
            }}
          >
            <Text style={styles.menuItemText}>Schedule</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              navigation.navigate('FileShare' as never);
              if (onClose) onClose();
            }}
          >
            <Text style={styles.menuItemText}>File Share</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleNavigation('Directory')}
          >
            <Text style={styles.menuItemText}>Directory</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('TaskList');
            }}
          >
            <Text style={styles.menuItemText}>Task List</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('TaskEscalation');
            }}
          >
            <Text style={styles.menuItemText}>Task List Escalation</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('ICUList');
            }}
          >
            <Text style={styles.menuItemText}>ICU List</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('InvestigationsList');
            }}
          >
            <Text style={styles.menuItemText}>Investigations</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          {/* Clinical Assessment & Forms Section */}
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('ClinicalAssessment');
            }}
          >
            <Text style={styles.menuItemText}>Clinical Assessment</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('AssessmentHistory');
            }}
          >
            <Text style={styles.menuItemText}>Assessment History</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('FormCategories');
            }}
          >
            <Text style={styles.menuItemText}>Form Categories / Templates</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('StrokeScale');
            }}
          >
            <Text style={styles.menuItemText}>Stroke Scale</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('ICDCPT');
            }}
          >
            <Text style={styles.menuItemText}>ICD / CPT</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('FavouriteICDCPT');
            }}
          >
            <Text style={styles.menuItemText}>Favourite ICD/CPT</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          {/* Notes & Documentation Section */}
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('PatientNotes');
            }}
          >
            <Text style={styles.menuItemText}>Patient Notes</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('NoteTypes');
            }}
          >
            <Text style={styles.menuItemText}>Note Types</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('VoiceRecord');
            }}
          >
            <Text style={styles.menuItemText}>Voice Record (Notes)</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          {/* Medications & Prescription Section */}
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('MedicationsLabOrders');
            }}
          >
            <Text style={styles.menuItemText}>Medications / Lab Orders</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('AddPrescription');
            }}
          >
            <Text style={styles.menuItemText}>Add Prescription</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('UploadPrescription');
            }}
          >
            <Text style={styles.menuItemText}>Upload Prescription</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('SearchMedicines');
            }}
          >
            <Text style={styles.menuItemText}>Search Medicines</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('FrequencyRouteList');
            }}
          >
            <Text style={styles.menuItemText}>Frequency / Route List</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              handleNavigation('CallLogs');
            }}
          >
            <Text style={styles.menuItemText}>Call Logs</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              if (onClose) onClose();
              (navigation as any).navigate('MainTabs', { screen: 'Chats' });
            }}
          >
            <Text style={styles.menuItemText}>Chat</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              handleNavigation('ConferenceCall');
            }}
          >
            <Text style={styles.menuItemText}>Conference Call</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => handleNavigation('Help')}
          >
            <Text style={styles.menuItemText}>Help</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              handleNavigation('SupportFeedback');
            }}
          >
            <Text style={styles.menuItemText}>Support & feedback</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => handleNavigation('Newsletters')}
          >
            <Text style={styles.menuItemText}>Newsletters</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color="#00e1ff" />
            ) : (
              <Text style={styles.logoutText}>LOGOUT</Text>
            )}
          </TouchableOpacity>
          <View style={styles.menuDivider} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000053', // colorPrimaryDark
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    padding: 15,
    paddingTop: 15,
    marginTop: 15,
  },
  avatarContainer: {
    width: 78,
    height: 78,
    marginBottom: 10,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    color: '#96969a',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#96969a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    transform: [{ rotate: '75deg' }],
  },
  editIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Montserrat',
    marginTop: 10,
    marginLeft: 10,
    textTransform: 'uppercase',
  },
  profileRole: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    marginTop: 5,
    marginLeft: 10,
    textTransform: 'uppercase',
  },
  profileLocation: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    marginTop: 5,
    marginLeft: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00b8db', // colorPrimary
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  menuHeaderArrow: {
    color: '#ffffff',
    fontSize: 20,
    marginRight: 5,
  },
  menuHeaderText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
    textTransform: 'uppercase',
  },
  menuItems: {
    marginTop: 0,
  },
  menuItem: {
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  menuItemText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Montserrat',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#00b8db', // colorPrimary
  },
  logoutText: {
    fontSize: 16,
    color: '#00e1ff', // nav_logout_color - light blue
    fontFamily: 'Montserrat',
    textTransform: 'uppercase',
  },
});

export default DrawerContent;
