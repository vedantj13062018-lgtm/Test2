/**
 * Call Logs Screen
 * Matches StrokeTeamOne CallLogActivity UI and AllCallLogListFragment logic
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, addDays, subDays } from 'date-fns';
import { RootStackParamList, CallLog } from '../../types';
import { COLORS } from '../../constants';
import socketService from '../../services/socketService';
import { getStringFromStorage } from '../../utils/storage';
import { GROUP_CALL_URL } from '../../constants';
import CustomDrawer from '../../components/CustomDrawer';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Display date format: 17-February-2026
const DISPLAY_DATE_FORMAT = 'dd-MMMM-yyyy';
// API date format: 2026-02-17
const API_DATE_FORMAT = 'yyyy-MM-dd';

const CallLogsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'missed'>('all');
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [callLoading, setCallLoading] = useState<string | null>(null);

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  const displayDateStr = format(selectedDate, DISPLAY_DATE_FORMAT);
  const apiDateStr = format(selectedDate, API_DATE_FORMAT);

  const fetchCallLogs = async () => {
    setLoading(true);
    try {
      if (!socketService.getConnectionStatus()) {
        await socketService.initSocket();
      }
      const logs = await socketService.fetchCallHistory(
        '0',
        activeTab === 'missed' ? 'missed' : '',
        apiDateStr,
        true
      );
      setCallLogs(logs || []);
    } catch (err) {
      console.error('Failed to fetch call logs:', err);
      setCallLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallLogs();
  }, [activeTab, selectedDate]);

  const goToPreviousDay = () => {
    setSelectedDate((d) => subDays(d, 1));
  };

  const goToNextDay = () => {
    setSelectedDate((d) => addDays(d, 1));
  };

  const getCallTypeLabel = (status?: string): string => {
    const s = (status || '').toLowerCase();
    if (s === 'incoming') return 'INCOMING';
    if (s === 'outgoing') return 'OUTGOING';
    if (s === 'missed') return 'MISSED';
    if (s === 'unanswered') return 'UNANSWERED';
    if (s === 'rejected') return 'REJECTED';
    return status || 'CALL';
  };

  const formatTimeRange = (log: CallLog): string => {
    const start = log.call_start;
    const end = log.call_end;
    const duration = log.call_duration;
    if (start && end && duration) {
      try {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const startStr = format(startDate, 'HH:mm a');
        const endStr = format(endDate, 'HH:mm a');
        return `${startStr} - ${endStr}  ${duration}`;
      } catch {
        return duration || '';
      }
    }
    if (log.call_time) {
      try {
        const ts = parseInt(String(log.call_time), 10);
        if (ts > 0) {
          const d = new Date(ts < 1000000000000 ? ts * 1000 : ts);
          return format(d, 'HH:mm a');
        }
      } catch {
        // ignore
      }
    }
    return duration || '';
  };

  const handleCallBack = async (log: CallLog) => {
    const receiverId = log.sender_id || log.user_id || '';
    if (!receiverId) return;
    if (callLoading) return;

    setCallLoading(receiverId);
    try {
      const broadcastId = await socketService.initiateCall(
        receiverId,
        '0',
        '',
        '',
        'call_logs'
      );
      if (broadcastId) {
        const serverUrl = await getStringFromStorage(GROUP_CALL_URL);
        navigation.navigate('JitsiMeeting', {
          room: broadcastId,
          serverURL: serverUrl || undefined,
          audioOnly: false,
        });
      } else {
        Alert.alert('Error', 'Failed to start call. Please try again.');
      }
    } catch (err) {
      console.error('Call initiation failed:', err);
      Alert.alert('Error', 'Failed to start call. Please try again.');
    } finally {
      setCallLoading(null);
    }
  };

  const renderCallLogItem = ({ item }: { item: CallLog }) => {
    const name = (item.sender_name || item.user_name || 'Unknown').toUpperCase();
    const receiverId = item.sender_id || item.user_id || '';
    const isCalling = callLoading === receiverId;

    return (
      <View style={styles.callItem}>
        <View style={styles.avatarContainer}>
          {item.profile_img ? (
            <Image source={{ uri: item.profile_img }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{name.charAt(0) || '?'}</Text>
            </View>
          )}
        </View>
        <View style={styles.callInfo}>
          <Text style={styles.name}>{name.replace(/,/g, ', ')}</Text>
          <Text style={styles.callType}>{getCallTypeLabel(item.call_status)}</Text>
          <Text style={styles.timeText}>{formatTimeRange(item)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.callButton, isCalling && styles.callButtonDisabled]}
          onPress={() => handleCallBack(item)}
          disabled={isCalling}
        >
          {isCalling ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.callButtonIcon}>📞</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00006e" />
      <CustomDrawer isOpen={drawerOpen} onClose={closeDrawer} />

      {/* Header - same structure as NewsletterScreen, DirectoryScreen */}
      <View style={styles.headerContainer}>
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
        <View style={styles.headerGradientContainer}>
          <View style={styles.gradientHeader}>
            <View style={styles.gradientLeft} />
            <View style={styles.gradientMiddle} />
            <View style={styles.gradientRight} />
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Call Logs</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All Calls
          </Text>
          {activeTab === 'all' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'missed' && styles.tabActive]}
          onPress={() => setActiveTab('missed')}
        >
          <Text style={[styles.tabText, activeTab === 'missed' && styles.tabTextActive]}>
            Missed Calls
          </Text>
          {activeTab === 'missed' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      </View>

      {/* Date Navigation */}
      <View style={styles.dateBar}>
        <TouchableOpacity style={styles.dateArrow} onPress={goToPreviousDay}>
          <Text style={styles.dateArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>{displayDateStr}</Text>
        <TouchableOpacity style={styles.dateArrow} onPress={goToNextDay}>
          <Text style={styles.dateArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Call Log List */}
      {loading ? (
        <View style={[styles.listWrapper, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={COLORS.chatBlueDark} />
        </View>
      ) : callLogs.length === 0 ? (
        <View style={[styles.listWrapper, styles.emptyContainer]}>
          <Text style={styles.emptyText}>No call logs for this date</Text>
        </View>
      ) : (
        <FlatList
          style={styles.listWrapper}
          data={callLogs}
          keyExtractor={(item, idx) =>
            `${item.sender_id || item.user_id || ''}-${item.call_time || idx}`
          }
          renderItem={renderCallLogItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  headerGradientContainer: {
    flex: 1,
  },
  gradientHeader: {
    flex: 1,
    justifyContent: 'center',
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
    backgroundColor: '#00006e',
  },
  gradientMiddle: {
    position: 'absolute',
    left: '35%',
    top: 0,
    bottom: 0,
    width: '30%',
    backgroundColor: '#0070a9',
  },
  gradientRight: {
    position: 'absolute',
    left: '65%',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#007eb6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
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
    fontFamily: 'Montserrat',
    marginLeft: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.chatBlueLight || '#005aa4',
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#d1d5db',
    marginHorizontal: 4,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  tabActive: {
    backgroundColor: COLORS.chatBlueDark,
  },
  tabText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: COLORS.chatBlueDark,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e8eef5',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dateArrow: {
    padding: 8,
  },
  dateArrowText: {
    fontSize: 28,
    color: COLORS.chatBlueLight || '#005aa4',
    fontWeight: '300',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  listWrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    paddingBottom: 24,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.chatBlueDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  callInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  callType: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonDisabled: {
    opacity: 0.7,
  },
  callButtonIcon: {
    fontSize: 22,
  },
  separator: {
    height: 1,
    backgroundColor: '#e8eef5',
    marginLeft: 78,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default CallLogsScreen;
