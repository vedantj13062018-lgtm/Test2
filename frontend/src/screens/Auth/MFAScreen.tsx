/**
 * Multi-Factor Authentication Screen
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch } from '../../store/hooks';
import { setMFAToken } from '../../store/slices/authSlice';
import { RootStackParamList } from '../../types';
import apiService from '../../services/apiService';
import { API_VALIDATE_MULTIFACTOR_AUTH, COLORS } from '../../constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = { params: { userName: string } };

const MFAScreen: React.FC = () => {
  const route = useRoute<RouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { userName } = route.params;

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (!code || code.length < 6) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.postEncrypted(API_VALIDATE_MULTIFACTOR_AUTH, {
        user_name: userName,
        token: code,
      });

      if (response.code === '100') {
        dispatch(setMFAToken(code));
        navigation.replace('MainTabs');
      } else {
        Alert.alert('Error', response.status || 'Invalid verification code');
      }
    } catch (error: any) {
      Alert.alert('Error', error.status || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Multi-Factor Authentication</Text>
      <Text style={styles.subtitle}>Enter the verification code sent to your device</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter verification code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Verify</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MFAScreen;
