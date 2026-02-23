import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, User } from '../../types';
import { COLORS } from '../../constants';
import doctorService from '../../services/doctorService';
import socketService from '../../services/socketService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DoctorListScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const [doctors, setDoctors] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [error, setError] = useState<string | null>(null);
    const [isCallLoading, setIsCallLoading] = useState<string | null>(null); // userId of doctor being called

    useEffect(() => {
        loadDoctors();
    }, []);

    const loadDoctors = async () => {
        setLoading(true);
        setError(null);
        // Ensure socket is initialized (idempotent)
        if (!socketService.getConnectionStatus()) {
            await socketService.initSocket();
        }

        try {
            const fetchedDoctors = await doctorService.fetchDoctorList();
            setDoctors(fetchedDoctors);
        } catch (err: any) {
            console.error('Failed to load doctors:', err);
            setError(err.message || 'Failed to load doctors');
        } finally {
            setLoading(false);
        }
    };

    const handleCall = async (doctor: User) => {
        if (isCallLoading) return;
        setIsCallLoading(doctor.userId);

        try {
            // 1. Get Room ID from server (Signaling)
            const roomName = await doctorService.initiateVideoCall([doctor.userId]);

            // 2. Get Jitsi Server URL from storage (Dynamic)
            const { getStringFromStorage } = require('../../utils/storage');
            const { GROUP_CALL_URL, USER_NAME } = require('../../constants');
            const serverUrl = await getStringFromStorage(GROUP_CALL_URL);
            const myName = await getStringFromStorage(USER_NAME);

            console.log('Starting call in room:', roomName, 'on server:', serverUrl);

            // 3. Navigate to Jitsi Meeting
            navigation.navigate('JitsiMeeting', {
                room: roomName,
                userInfo: {
                    displayName: myName || 'Me',
                    email: '',
                },
                audioOnly: false,
                videoMuted: false,
                serverURL: serverUrl, // Pass explicit server URL
            });
        } catch (err) {
            console.error('Call initiation failed:', err);
            // Optionally show alert
            Alert.alert('Error', 'Failed to start call. Please try again.');
        } finally {
            setIsCallLoading(null);
        }
    };

    const renderItem = ({ item }: { item: User }) => (
        <View style={styles.card}>
            <View style={styles.infoContainer}>
                <View style={styles.avatarPlaceholder}>
                    {item.profileImage ? (
                        <Image source={{ uri: item.profileImage }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarText}>{item.userName.charAt(0)}</Text>
                    )}
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.name}>{item.userName}</Text>
                    <Text style={styles.speciality}>{item.designation || item.specialityId || 'General Physician'}</Text>
                    {item.available && <Text style={styles.availableText}>Online</Text>}
                </View>
            </View>
            <TouchableOpacity
                style={[styles.callButton, (!item.available || isCallLoading === item.userId) && styles.disabledButton]}
                onPress={() => handleCall(item)}
                disabled={!item.available || isCallLoading !== null}
            >
                {isCallLoading === item.userId ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                    <Text style={styles.callButtonText}>Video Call</Text>
                )}
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary || '#007AFF'} />
                <Text style={styles.loadingText}>Fetching doctors...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.errorText}>Error: {error}</Text>
                <Text style={styles.subErrorText}>Please check your connection or log in again.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadDoctors}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={doctors}
                renderItem={renderItem}
                keyExtractor={(item) => item.userId}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No doctors found.</Text>
                    </View>
                }
                onRefresh={loadDoctors}
                refreshing={loading}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary || '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    textContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    speciality: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    availableText: {
        fontSize: 12,
        color: '#34C759', // Success green
        fontWeight: 'bold',
        marginTop: 2,
    },
    callButton: {
        backgroundColor: COLORS.primary || '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginLeft: 8,
    },
    disabledButton: {
        backgroundColor: '#CCC',
    },
    callButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    errorText: {
        color: COLORS.danger || '#FF3B30',
        fontSize: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    subErrorText: {
        color: '#666',
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: COLORS.primary || '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default DoctorListScreen;
