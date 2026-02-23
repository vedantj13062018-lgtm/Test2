/**
 * Conference Call Screen
 * Matches StrokeTeamOne VideoCallParticipantsActivityNew UI and functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import socketService from '../../services/socketService';
import { getStringFromStorage } from '../../utils/storage';
import { USER_ID, USER_NAME, ORGANIZATION_ID } from '../../constants';
import type { GroupContactNew, GroupUser } from '../../types';

const COLORS = {
  colorDrawer: '#00006e',
  skyblue: '#00bcdc',
  patientHistoryBg: '#00a0c3',
  callNowBg: '#00b47c',
  white: '#FFFFFF',
  black: '#000000',
  grey: '#9E9E9E',
  greyLight: '#E0E0E0',
};

const SECTION_ORDER = ['CART', 'CLINICAL', 'DOCTOR'];

const ConferenceCallScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [groups, setGroups] = useState<GroupContactNew[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<GroupContactNew[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<GroupUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);

  const normalizeGroups = useCallback((list: GroupContactNew[]) => {
    return SECTION_ORDER.map((role) => {
      const found = list.find((g) => g.rolename.toUpperCase() === role);
      return found || { rolename: role, users: [] };
    });
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      if (!socketService.getConnectionStatus()) {
        await socketService.initSocket();
      }
      const list = await socketService.fetchUsersMobileNew(true, false);
      const normalized = normalizeGroups(list);
      setGroups(normalized);
      setFilteredGroups(normalized);
      setExpandedSections(SECTION_ORDER.reduce((acc, r) => ({ ...acc, [r]: false }), {} as Record<string, boolean>));
    } catch (e) {
      console.error('fetchUsersMobileNew error:', e);
      Alert.alert('Error', 'Failed to load participants. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [normalizeGroups]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGroups(groups);
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = groups.map((g) => ({
      ...g,
      users: g.users.filter((u) => u.userName.toLowerCase().includes(q)),
    }));
    setFilteredGroups(filtered);
  }, [searchQuery, groups]);

  const toggleUser = (user: GroupUser) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      if (exists) return prev.filter((u) => u.id !== user.id);
      return [...prev, { ...user, selected: true }];
    });
  };

  const isSelected = (userId: string) => selectedUsers.some((u) => u.id === userId);

  const toggleSection = (rolename: string) => {
    setExpandedSections((prev) => ({ ...prev, [rolename]: !prev[rolename] }));
  };

  const handleCallNow = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('', 'Please select participants to start call');
      return;
    }
    setCalling(true);
    try {
      const userId = await getStringFromStorage(USER_ID);
      const userName = await getStringFromStorage(USER_NAME);
      const orgId = await getStringFromStorage(ORGANIZATION_ID);
      if (!userId || !userName || !orgId) {
        Alert.alert('Error', 'User details missing. Please log in again.');
        return;
      }
      const participantIds = selectedUsers.map((u) => u.id);
      const broadcastId = await socketService.generateGroupCall(userId, userName, participantIds, orgId);
      const jitsiUrl = await getStringFromStorage('apiGroupCallURL');
      if (!jitsiUrl || !broadcastId) {
        Alert.alert('Error', 'Failed to initiate call');
        return;
      }
      const room = jitsiUrl.replace(/\/$/, '') + '/' + broadcastId;
      navigation.replace('JitsiMeeting', {
        room,
        serverURL: jitsiUrl,
        audioOnly: false,
        videoMuted: false,
      });
    } catch (e: any) {
      console.error('Call now error:', e);
      Alert.alert('Error', e?.message || 'Failed to initiate call');
    } finally {
      setCalling(false);
    }
  };

  const handleJoinWithMeetingID = () => {
    navigation.navigate('JoinWithMeetingID');
  };

  const addedNames = selectedUsers.map((u) => u.userName).join(', ');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - matches StrokeTeamOne toolbar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.headerIconText}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerTitle}>Conference Call</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Add to call row */}
        <View style={styles.addToCallRow}>
          <View style={styles.addToCallLabel}>
            <Text style={styles.plusText}>+</Text>
            <Text style={styles.addToCallText}>Add to call</Text>
          </View>
          <TouchableOpacity
            style={[styles.callNowBtn, calling && styles.callNowBtnDisabled]}
            onPress={handleCallNow}
            disabled={calling}
          >
            {calling ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.callNowText}>CALL NOW</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name here..."
            placeholderTextColor={COLORS.grey}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Text style={styles.searchIconText}>🔍</Text>
        </View>

        {/* Expandable participant list */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.patientHistoryBg} />
          </View>
        ) : (
          <ScrollView
            style={styles.listScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredGroups.map((group, groupIndex) => (
              <View key={group.rolename}>
                <TouchableOpacity
                  style={[
                    styles.sectionHeader,
                    { backgroundColor: groupIndex % 2 === 0 ? COLORS.colorDrawer : COLORS.skyblue },
                  ]}
                  onPress={() => toggleSection(group.rolename)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chevronIcon}>
                    {expandedSections[group.rolename] ? '▲' : '▼'}
                  </Text>
                  <Text style={styles.sectionTitle}>{group.rolename.toUpperCase()}</Text>
                </TouchableOpacity>
                {expandedSections[group.rolename] !== false &&
                  group.users.map((user, userIndex) => {
                    const selected = isSelected(user.id);
                    const isCart = group.rolename.toUpperCase() === 'CART';
                    return (
                      <TouchableOpacity
                        key={`${group.rolename}-${user.id}-${userIndex}`}
                        style={[
                          styles.userRow,
                          { backgroundColor: selected ? COLORS.skyblue : COLORS.white },
                        ]}
                        onPress={() => toggleUser(user)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.userTypeIcon, selected && styles.userTypeIconSelected]}>
                          {isCart ? '🛒' : '⚕'}
                        </Text>
                        <Text
                          style={[
                            styles.userName,
                            { color: selected ? COLORS.white : COLORS.black },
                          ]}
                        >
                          {user.userName}
                        </Text>
                        <Text style={[styles.addIcon, selected && styles.addIconSelected]}>
                          {selected ? '✓' : '+'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            ))}
          </ScrollView>
        )}

        {/* ADDED section */}
        <View style={styles.addedSection}>
          <Text style={styles.addedLabel}>ADDED</Text>
          <Text style={styles.addedNames} numberOfLines={2}>
            {addedNames || ' '}
          </Text>
        </View>

        {/* Join Call with Meeting ID button */}
        <TouchableOpacity style={styles.joinBtn} onPress={handleJoinWithMeetingID}>
          <Text style={styles.joinBtnText}>Join Call with Meeting ID</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: COLORS.colorDrawer,
  },
  headerLeft: {
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.colorDrawer,
  },
  headerRight: {
    flex: 1,
    backgroundColor: COLORS.skyblue,
    justifyContent: 'center',
    paddingLeft: 12,
  },
  backBtn: {
    padding: 8,
  },
  headerIconText: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
  },
  addToCallRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  addToCallLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plusText: {
    fontSize: 18,
    color: COLORS.black,
    marginRight: 8,
  },
  addToCallText: {
    fontSize: 16,
    color: COLORS.black,
  },
  callNowBtn: {
    backgroundColor: COLORS.callNowBg,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  callNowBtnDisabled: {
    opacity: 0.7,
  },
  callNowText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.greyLight,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    paddingVertical: 0,
    color: COLORS.black,
  },
  searchIcon: {
    marginLeft: 8,
  },
  searchIconText: {
    fontSize: 20,
    marginLeft: 8,
  },
  chevronIcon: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: 'bold',
    marginRight: 4,
  },
  listScroll: {
    flex: 1,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.greyLight,
  },
  userTypeIcon: {
    fontSize: 20,
    color: COLORS.grey,
  },
  userTypeIconSelected: {
    color: COLORS.white,
  },
  userName: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  addIcon: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.grey,
  },
  addIconSelected: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addedSection: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  addedLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  addedNames: {
    fontSize: 14,
    color: COLORS.grey,
  },
  joinBtn: {
    backgroundColor: COLORS.patientHistoryBg,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConferenceCallScreen;
