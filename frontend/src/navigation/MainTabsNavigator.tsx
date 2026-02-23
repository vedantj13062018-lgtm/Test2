/**
 * Main Tabs Navigator
 * Matches Swift TabBarVC
 */

import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MainTabParamList, RootStackParamList } from '../types';
import { COLORS, USER_ID, USER_NAME, USER_TYPE, SESSION_ID } from '../constants';
import socketService from '../services/socketService';
import { getStringFromStorage } from '../utils/storage';

// Screens
import HomeScreen from '../screens/HomeScreen';
import DoctorListScreen from '../screens/DoctorList/DoctorListScreen';
import ChatsScreen from '../screens/Chats/ChatsScreen';
import MenuScreen from '../screens/Menu/MenuScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabsNavigator: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const setupSocket = async () => {
      try {
        const userId = await getStringFromStorage(USER_ID);
        const userName = await getStringFromStorage(USER_NAME);
        const userType = await getStringFromStorage(USER_TYPE);
        const sessionId = await getStringFromStorage(SESSION_ID);

        if (userId && sessionId) {
          console.log('MainTabsNavigator: Initializing socket...');
          await socketService.initSocket();

          socketService.onIncomingCall(async (roomId) => {
            console.log('MainTabsNavigator: 📞 Incoming call listener TRIGGERED with roomId:', roomId);

            // Swift uses key "apiGroupCallURL" -> GROUP_CALL_URL
            const serverUrl = await getStringFromStorage('apiGroupCallURL');
            console.log('MainTabsNavigator: Navigating to JitsiMeeting with:', { roomId, serverUrl, audioOnly: false });

            navigation.navigate('JitsiMeeting', {
              room: roomId,
              serverURL: serverUrl || undefined,
              audioOnly: false,
            });
          });
        }
      } catch (error) {
        console.error('Error initializing socket in MainTabs:', error);
      }
    };

    setupSocket();
    console.log('MainTabsNavigator: setupSocket called, expecting incoming call listener to be registered.');

    // Cleanup not fully necessary as this navigator persists, but good practice if we could disconnect
    // socketService.disconnect(); // Maybe don't disconnect on tab interactions, only logout
  }, [navigation]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // ========== BOTTOM NAVIGATION HIDDEN (per request) ==========
        // To restore: remove tabBar and tabBarStyle below and uncomment tabBar*.
        tabBar: () => null,
        tabBarStyle: { display: 'none', height: 0, overflow: 'hidden' },
        // tabBarActiveTintColor: COLORS.primary,
        // tabBarInactiveTintColor: '#999',
        // ============================================================
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="DoctorList"
        component={DoctorListScreen}
        options={{
          title: 'Doctors',
          tabBarIcon: ({ color, size }) => <Icon name="people" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatsScreen}
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <Icon name="chat" size={size} color={color} />,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Menu"
        component={MenuScreen}
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, size }) => <Icon name="menu" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabsNavigator;
