/**
 * Directory Screen
 * Replicated from StrokeTeamOne DirectoryActivityNew
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DoctorList from '../components/DoctorList';
import CustomDrawer from '../components/CustomDrawer';
import { navigate } from '../navigation/navigationRef';

const { width } = Dimensions.get('window');

type TabType = 'doctors' | 'carts' | 'clinical' | 'others';

const DirectoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const fromStartNewChat = (route.params as { fromStartNewChat?: boolean } | undefined)?.fromStartNewChat ?? false;
  const [activeTab, setActiveTab] = useState<TabType>('doctors');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = () => {
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
  };

  const renderTabButton = (tab: TabType, label: string) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        key={tab}
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={() => handleTabPress(tab)}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTabIndicator = (tab: TabType) => {
    const isActive = activeTab === tab;
    return (
      <View
        key={tab}
        style={[
          styles.tabIndicator,
          isActive && styles.tabIndicatorActive,
        ]}
      />
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'doctors':
        return <DoctorList userType="DOCTOR" />;
      case 'carts':
        return <DoctorList userType="CART" />;
      case 'clinical':
        return <DoctorList userType="CLINICAL" />;
      case 'others':
        return <DoctorList userType="OTHERS" />;
      default:
        return <DoctorList userType="DOCTOR" />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00006e" />
      <CustomDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
      />
      
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

        <View style={styles.headerGradientContainer}>
          <View style={styles.gradientHeader}>
            <View style={styles.gradientLeft} />
            <View style={styles.gradientMiddle} />
            <View style={styles.gradientRight} />
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                {fromStartNewChat && (
                  <View style={styles.headerChatIconWrap}>
                    <Icon name="chat" size={20} color="#FFF" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => (fromStartNewChat ? navigate('MainTabs', { screen: 'Chats' }) : navigation.goBack())}
                >
                  <Icon name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{fromStartNewChat ? 'Chat' : 'Directory'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabsContainer}>
        {renderTabButton('doctors', 'Doctors')}
        {renderTabButton('carts', 'Carts')}
        {renderTabButton('clinical', 'Clinical')}
        {renderTabButton('others', 'Others')}
      </View>

      {/* Tab Indicators */}
      <View style={styles.indicatorsContainer}>
        {renderTabIndicator('doctors')}
        {renderTabIndicator('carts')}
        {renderTabIndicator('clinical')}
        {renderTabIndicator('others')}
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
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
  headerChatIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#e0f0f8',
    paddingHorizontal: 3,
    paddingVertical: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 5,
    marginHorizontal: 3,
    backgroundColor: '#b3d9e8',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#000000',
  },
  indicatorsContainer: {
    flexDirection: 'row',
    height: 3,
    backgroundColor: '#e0f0f8',
  },
  tabIndicator: {
    flex: 1,
    backgroundColor: '#b3d9e8',
  },
  tabIndicatorActive: {
    backgroundColor: '#000000',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default DirectoryScreen;
