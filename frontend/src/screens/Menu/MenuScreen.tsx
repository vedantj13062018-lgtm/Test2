/**
 * Menu Screen
 */

import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAppSelector } from '../../store/hooks';
import { COLORS } from '../../constants';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
}

const MenuScreen: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  const menuItems: MenuItem[] = [
    { id: '1', title: 'Settings', icon: 'settings', onPress: () => {} },
    { id: '2', title: 'Profile', icon: 'person', onPress: () => {} },
    { id: '3', title: 'Help', icon: 'help', onPress: () => {} },
    { id: '4', title: 'About', icon: 'info', onPress: () => {} },
    { id: '5', title: 'Logout', icon: 'logout', onPress: () => {} },
  ];

  const renderItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity style={styles.item} onPress={item.onPress}>
      <Icon name={item.icon} size={24} color={COLORS.primary} style={styles.icon} />
      <Text style={styles.itemText}>{item.title}</Text>
      <Icon name="chevron-right" size={24} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.userName}>{user?.userName || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.doctorName || ''}</Text>
      </View>
      <FlatList
        data={menuItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  icon: {
    marginRight: 16,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
});

export default MenuScreen;
