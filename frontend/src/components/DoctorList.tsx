/**
 * Doctor List Component
 * Replicated from StrokeTeamOne DoctorListFragment
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DoctorItem from './DoctorItem';
import socketService from '../services/socketService';
import { getStringFromStorage } from '../utils/storage';
import { USER_ID, ORGANIZATION_ID } from '../constants';
import { OnlineUser } from '../types';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAppDispatch } from '../store/hooks';
import { setPendingChatParams } from '../store/slices/chatSlice';
import { navigate as navRefNavigate } from '../navigation/navigationRef';
import { setNextChatParams } from '../navigation/nextChatParams';
import { decryptJSON } from '../utils/encryption';
import doctorService from '../services/doctorService';

interface DoctorListProps {
  userType: 'DOCTOR' | 'CART' | 'CLINICAL' | 'OTHERS';
}

type FilterType = 'username' | 'speciality' | 'oncall';

const DoctorList: React.FC<DoctorListProps> = ({ userType }) => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const [doctors, setDoctors] = useState<OnlineUser[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<OnlineUser[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('username');
  const [loading, setLoading] = useState(true);
  const [onCallList, setOnCallList] = useState<string[]>([]);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callNavGuardRef = useRef<string>(''); // broadcast_id we already navigated for

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      // Try to connect even if session data is missing (like in main app)
      const userId = await getStringFromStorage(USER_ID);
      const organizationId = await getStringFromStorage(ORGANIZATION_ID);

      console.log('[DoctorList] Session check - userId:', userId || 'EMPTY', 'organizationId:', organizationId || 'EMPTY');

      if (mounted) {
        await connectSocket();
        // Then fetch doctors
        if (userId && organizationId) {
          fetchDoctors();
        } else {
          console.log('[DoctorList] Attempting to connect socket without full session data');
        }
      }
    };

    initialize();

    // Listen for onlineUsers event to update online status
    // The socketService already listens to 'onlineUsers' event, but we need to update our local state
    // We'll use a custom event listener approach
    const updateOnlineStatus = (data: any) => {
      try {
        const onlineUsersData = typeof data === 'string' ? JSON.parse(data) : data;
        if (onlineUsersData && onlineUsersData.users) {
          // Update online status for existing doctors
          setDoctors(prevDoctors => {
            return prevDoctors.map((doctor) => {
              let onlineStatus = doctor.onlineStatus;
              
              // Check online status
              if (onlineUsersData.users[doctor.userId]) {
                onlineStatus = onlineUsersData.users[doctor.userId] || 'offline';
              }
              
              // Check offline orgs
              if (onlineUsersData.offline_orgs && onlineUsersData.offline_orgs[doctor.userId]) {
                onlineStatus = 'offline';
              }
              
              return {
                ...doctor,
                onlineStatus: onlineStatus,
              };
            });
          });
        }
      } catch (error) {
        console.error('[DoctorList] Error updating online status:', error);
      }
    };

    // Note: We can't directly listen to socket events here since socket is private
    // The socketService handles onlineUsers events internally
    // We'll fetch doctors on mount and when tab changes

    return () => {
      mounted = false;
    };
  }, []);

  // When user comes back to Directory (e.g., after call/navigation), refresh list.
  useFocusEffect(
    useCallback(() => {
      fetchDoctors();
      return () => {
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
          fetchTimeoutRef.current = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userType, filterType, searchText])
  );

  useEffect(() => {
    applyFilters();
  }, [doctors, searchText, filterType, onCallList]);

  const connectSocket = async () => {
    try {
      console.log('[DoctorList] Initializing socket...');
      await socketService.initSocket();
      // Wait a bit for connection to establish
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
    } catch (error) {
      console.error('[DoctorList] Error connecting socket:', error);
    }
  };

  const handleOnCallUsersList = (userIds: string[]) => {
    console.log('[DoctorList] On-call users list received:', userIds);
    setOnCallList(userIds);
    
    // Update on-call status for existing doctors
    const updatedDoctors = doctors.map((doctor) => ({
      ...doctor,
      oncall_status: userIds.includes(doctor.userId) ? '1' : '0',
    }));
    setDoctors(updatedDoctors);
  };

  const handleOnlineUsersUpdate = (data: any) => {
    console.log('[DoctorList] Online users update received:', data);
    // Update online status for existing doctors
    // Data format: {users: {user_id: "online|idle"}, offline_orgs: {user_id: [org_ids]}}
    try {
      const onlineUsersData = typeof data === 'string' ? JSON.parse(data) : data;
      const updatedDoctors = doctors.map((doctor) => {
        let onlineStatus = doctor.onlineStatus;
        
        // Check online status
        if (onlineUsersData.users && onlineUsersData.users[doctor.userId]) {
          onlineStatus = onlineUsersData.users[doctor.userId] || 'offline';
        }
        
        // Check offline orgs
        if (onlineUsersData.offline_orgs && onlineUsersData.offline_orgs[doctor.userId]) {
          const orgId = onlineUsersData.offline_orgs[doctor.userId];
          // If user's org is in offline list, mark as offline
          // This would need organizationId check - simplified for now
          onlineStatus = 'offline';
        }
        
        return {
          ...doctor,
          onlineStatus: onlineStatus,
        };
      });
      
      const sortedList = sortByOnlineStatus(updatedDoctors);
      setDoctors(sortedList);
    } catch (error) {
      console.error('[DoctorList] Error updating online status:', error);
    }
  };

  const handleOnlineUsersData = (data: any) => {
    try {
      console.log('[DoctorList] Received online users data:', typeof data, data);
      
      // Parse the response - adjust based on actual socket response format
      let userList: OnlineUser[] = [];
      let parsedData = data;
      
      // Handle string response (might be encrypted JSON string)
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          console.warn('[DoctorList] Failed to parse as JSON, might be encrypted:', e);
          // If parsing fails, might be encrypted - for now, return empty
          setLoading(false);
          setDoctors([]);
          return;
        }
      }
      
      // Extract user list from response - response structure: {usersList: [...]}
      // Matching StrokeTeamOne: onlineUser.getUserArrayList()
      if (parsedData && parsedData.usersList && Array.isArray(parsedData.usersList)) {
        userList = parsedData.usersList;
      } else if (parsedData && parsedData.userArrayList && Array.isArray(parsedData.userArrayList)) {
        userList = parsedData.userArrayList;
      } else if (parsedData && parsedData.user_array && Array.isArray(parsedData.user_array)) {
        userList = parsedData.user_array;
      } else if (parsedData && parsedData.users && Array.isArray(parsedData.users)) {
        userList = parsedData.users;
      } else if (Array.isArray(parsedData)) {
        userList = parsedData;
      } else if (parsedData && typeof parsedData === 'object') {
        // Try to find array property
        const arrayKeys = Object.keys(parsedData).filter(key => Array.isArray(parsedData[key]));
        if (arrayKeys.length > 0) {
          userList = parsedData[arrayKeys[0]];
        }
      }

      console.log('[DoctorList] Parsed user list length:', userList.length);

      // Map and validate user data - matching response structure from StrokeTeamOne
      const updatedList = userList
        .filter((user: any) => user && (user.userId || user.user_id)) // Filter out invalid entries
        .map((user: any) => {
          const userId = user.userId || user.user_id || '';
          const isOnCall = onCallList.includes(userId);
          return {
            userId: userId,
            userName: user.userName || user.user_name || user.name || 'Unknown',
            speciality: user.speciality || user.speciality_name || '',
            city: user.city || user.location || '',
            onlineStatus: user.onlineStatus || user.online_status || 'offline',
            oncall_status: user.oncall_status || (isOnCall ? '1' : '0'),
            profileImage: user.profileImage || user.profile_img || user.profile_image || user.imagePath,
            onlineOrder: user.onlineOrder || user.online_order,
          } as OnlineUser;
        });

      // IMPORTANT: backend/socket can return duplicate user_ids.
      // Dedupe by userId so FlatList keys stay unique and UI doesn't glitch.
      const seen = new Set<string>();
      const dedupedList: OnlineUser[] = [];
      for (const u of updatedList) {
        if (!u?.userId) continue;
        if (seen.has(u.userId)) continue;
        seen.add(u.userId);
        dedupedList.push(u);
      }

      // Sort by online status
      const sortedList = sortByOnlineStatus(dedupedList);
      setDoctors(sortedList);
      setLoading(false);
      
      // Clear timeout since we received data
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    } catch (error) {
      console.error('[DoctorList] Error parsing online users data:', error);
      console.error('[DoctorList] Error details:', JSON.stringify(error, null, 2));
      setLoading(false);
      setDoctors([]);
    }
  };

  const handleGroupCallInitiated = async (data: any) => {
    console.log('[DoctorList] Group call initiated:', data);
    const broadcastId = String(data?.broadcast_id || data?.broadcastId || '').trim();
    if (!broadcastId) return;
    if (callNavGuardRef.current === broadcastId) return;
    callNavGuardRef.current = broadcastId;
    const serverUrl = await getStringFromStorage('apiGroupCallURL');
    // Navigate to JitsiMeeting screen
    navigation.navigate('JitsiMeeting', { 
      room: broadcastId, 
      serverURL: serverUrl,
      audioOnly: false,
      videoMuted: false,
    });
  };

  const sortByOnlineStatus = (list: OnlineUser[]): OnlineUser[] => {
    const onlineOnCall: OnlineUser[] = [];
    const online: OnlineUser[] = [];
    const idleOnCall: OnlineUser[] = [];
    const idle: OnlineUser[] = [];
    const offlineOnCall: OnlineUser[] = [];
    const offline: OnlineUser[] = [];

    list.forEach((user) => {
      const isOnCall = user.oncall_status === '1';
      if (user.onlineStatus === 'online' && isOnCall) {
        onlineOnCall.push(user);
      } else if (user.onlineStatus === 'online') {
        online.push(user);
      } else if (user.onlineStatus === 'idle' && isOnCall) {
        idleOnCall.push(user);
      } else if (user.onlineStatus === 'idle') {
        idle.push(user);
      } else if (isOnCall) {
        offlineOnCall.push(user);
      } else {
        offline.push(user);
      }
    });

    return [
      ...onlineOnCall,
      ...online,
      ...idleOnCall,
      ...idle,
      ...offlineOnCall,
      ...offline,
    ];
  };

  const fetchDoctors = async () => {
    setLoading(true);
    
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    
    try {
      const userId = await getStringFromStorage(USER_ID);
      const organizationId = await getStringFromStorage(ORGANIZATION_ID);

      if (!userId || !organizationId) {
        console.error('[DoctorList] Missing userId or organizationId');
        setLoading(false);
        return;
      }

      // Build search parameters
      const searchType = filterType === 'username' ? 'username' : 
                        filterType === 'speciality' ? 'speciality' : '';
      
      const params = {
        user_id: userId,
        users_type: userType,
        search_type: searchType,
        search_string: searchText,
        organization_id: organizationId,
      };

      const jsonParam = JSON.stringify(params);
      console.log('[DoctorList] Fetching doctors with params:', params);

      // Set a timeout to stop loading if no response after 10 seconds
      fetchTimeoutRef.current = setTimeout(() => {
        console.warn('[DoctorList] Timeout waiting for response after 10 seconds');
        setLoading(false);
        fetchTimeoutRef.current = null;
      }, 10000);

      // Use socketService.emitWithAck to fetch users list
      const response = await socketService.emitWithAck('fetchUsersList', jsonParam);

      // Clear timeout since we got a response
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }

      if (response && Array.isArray(response) && response.length > 0) {
        const encryptedStr = response[0];
        const decryptedData = decryptJSON(encryptedStr);

        if (decryptedData && decryptedData.usersList) {
          // Map to OnlineUser format
          const userList = decryptedData.usersList.map((item: any) => {
            const userId = item.user_id || item.id || '';
            const isOnCall = onCallList.includes(userId);
            
            return {
              userId: userId,
              userName: item.user_name || item.name || 'Unknown',
              speciality: item.speciality || item.speciality_name || '',
              city: item.city || item.location || '',
              onlineStatus: item.online_status || 'offline',
              oncall_status: item.oncall_status || (isOnCall ? '1' : '0'),
              profileImage: item.user_profile_image || item.profile_img || item.profile_image || item.imagePath,
              onlineOrder: item.online_order || item.onlineOrder,
            } as OnlineUser;
          });

          // Deduplicate by userId
          const seen = new Set<string>();
          const dedupedList: OnlineUser[] = [];
          for (const u of userList) {
            if (!u?.userId) continue;
            if (seen.has(u.userId)) continue;
            seen.add(u.userId);
            dedupedList.push(u);
          }

          // Sort by online status
          const sortedList = sortByOnlineStatus(dedupedList);
          setDoctors(sortedList);
          setLoading(false);
        } else {
          console.warn('[DoctorList] Invalid response structure:', decryptedData);
          setDoctors([]);
          setLoading(false);
        }
      } else {
        console.warn('[DoctorList] Empty response from fetchUsersList');
        setDoctors([]);
        setLoading(false);
      }
    } catch (error) {
      console.error('[DoctorList] Error fetching doctors:', error);
      setLoading(false);
      setDoctors([]);
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    }
  };

  const applyFilters = () => {
    let filtered = [...doctors];

    // Apply filter type
    if (filterType === 'oncall') {
      filtered = filtered.filter((doc) => doc.oncall_status === '1');
    }

    // Apply search text
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      if (filterType === 'username') {
        filtered = filtered.filter((doc) =>
          doc.userName.toLowerCase().includes(searchLower)
        );
      } else if (filterType === 'speciality') {
        filtered = filtered.filter((doc) =>
          doc.speciality.toLowerCase().includes(searchLower)
        );
      } else if (filterType === 'oncall') {
        filtered = filtered.filter((doc) =>
          doc.userName.toLowerCase().includes(searchLower)
        );
      }
    }

    setFilteredDoctors(filtered);
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (text.trim().length === 0) {
      fetchDoctors();
    }
  };

  const handleFilterPress = (type: FilterType) => {
    setFilterType(type);
    fetchDoctors();
  };

  const handleCallPress = async (doctor: OnlineUser) => {
    try {
      console.log('[DoctorList] Initiating video call to:', doctor.userName, '(', doctor.userId, ')');

      // Initiate a group/video call using the existing doctorService helper
      const roomId = await doctorService.initiateVideoCall([doctor.userId]);
      const serverUrl = await getStringFromStorage('apiGroupCallURL');

      // Navigate to Jitsi meeting for the caller
      navigation.navigate('JitsiMeeting', {
        room: roomId,
        serverURL: serverUrl || undefined,
        audioOnly: false,
        videoMuted: false,
      });
    } catch (error) {
      console.error('[DoctorList] Error initiating call:', error);
    }
  };

  const handleChatPress = (doctor: OnlineUser) => {
    const rid = (doctor.userId ?? '').toString().trim();
    if (!rid || rid === '0') {
      console.warn('[DoctorList] Cannot start chat: invalid doctor userId', doctor.userId);
      return;
    }
    const params = {
      chatId: '',
      chatName: doctor.userName ?? 'Chat',
      receiverId: rid,
      isGroup: false,
    };
    dispatch(setPendingChatParams(params));
    setNextChatParams(params);
    navRefNavigate('Chat', params);
  };

  const renderFilterButton = (type: FilterType, label: string) => {
    const isActive = filterType === type;
    return (
      <TouchableOpacity
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => handleFilterPress(type)}
        activeOpacity={0.7}
      >
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: OnlineUser }) => (
    <DoctorItem
      doctor={item}
      onCallPress={() => handleCallPress(item)}
      onChatPress={() => handleChatPress(item)}
    />
  );

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filtersContainer}>
        {renderFilterButton('username', 'NAME')}
        {renderFilterButton('speciality', 'SPECIALITY')}
        {renderFilterButton('oncall', 'ON CALL')}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={handleSearchChange}
        />
        <View style={styles.searchIconContainer}>
          <Icon name="search" size={22} color="#999" />
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007eb6" />
          <Text style={styles.loadingText}>Loading doctors...</Text>
        </View>
      ) : filteredDoctors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No doctors found</Text>
          <Text style={styles.emptySubText}>
            {doctors.length === 0
              ? 'Please log in and select an organization to view the directory.'
              : 'No doctors match your search criteria. Try adjusting your filters.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredDoctors}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.userId || `user-${index}`}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
  },
  filterButtonActive: {
    backgroundColor: '#00006e',
    borderColor: '#00006e',
  },
  filterText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
    height: 45,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#000000',
  },
  searchIconContainer: {
    paddingRight: 10,
  },
  searchIcon: {
    fontSize: 18,
    color: '#007eb6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default DoctorList;
