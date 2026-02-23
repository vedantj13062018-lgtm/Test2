import socketService from './socketService';
import { getStringFromStorage } from '../utils/storage';
import { USER_ID, ORGANIZATION_ID, USER_TYPE } from '../constants';
import { decryptJSON } from '../utils/encryption';
import { User } from '../types';

class DoctorService {
    /**
     * Fetch doctor list (matches Swift fetchUsersList for DOCTOR)
     */
    async fetchDoctorList(searchString: string = ''): Promise<User[]> {
        try {
            const userId = await getStringFromStorage(USER_ID);
            const organizationId = await getStringFromStorage(ORGANIZATION_ID);

            if (!userId || !organizationId) {
                console.error('Missing USER_ID or ORGANIZATION_ID');
                throw new Error('Authentication parameters missing. Please log out and log in again.');
            }

            const params = {
                user_id: userId,
                users_type: 'DOCTOR',
                search_type: searchString ? 'username' : '',
                search_string: searchString,
                organization_id: organizationId,
            };

            // Note: Swift's getJsonStringFromDictionary simply does JSON.stringify
            const jsonParam = JSON.stringify(params);

            console.log('Fetching doctor list with params:', jsonParam);

            const response = await socketService.emitWithAck('fetchUsersList', jsonParam);

            if (response && Array.isArray(response) && response.length > 0) {
                const encryptedStr = response[0];
                const decryptedData = decryptJSON(encryptedStr);

                if (decryptedData && decryptedData.usersList) {
                    // Map to User objects
                    const users: User[] = decryptedData.usersList.map((item: any) => ({
                        userId: item.user_id || item.id || '',
                        userName: item.user_name || item.name || '',
                        userLevel: parseInt(item.user_level || '0', 10),
                        isAdmin: item.is_admin === '1' || item.is_admin === 1,
                        designation: item.designation || '',
                        available: item.online_status === 'online',
                        profileImage: item.user_profile_image || '',
                        specialityId: item.speciality || '',
                    }));

                    // Deduplicate by userId
                    const uniqueUsers = Array.from(new Map(users.map(user => [user.userId, user])).values());

                    // Sort: Online first, then alphabetical by name
                    uniqueUsers.sort((a, b) => {
                        // 1. Available (Online) first
                        if (a.available && !b.available) return -1;
                        if (!a.available && b.available) return 1;

                        // 2. Alphabetical by userName
                        return a.userName.localeCompare(b.userName);
                    });

                    return uniqueUsers;
                } else {
                    console.warn('Doctor list response invalid:', decryptedData);
                    throw new Error('Invalid server response');
                }
            } else {
                console.warn('Socket response empty for fetchUsersList');
                throw new Error('Empty response from server');
            }

        } catch (error) {
            console.error('Error fetching doctor list:', error);
            return [];
        }
    }

    /**
     * Initiate Video Call (Jitsi)
     * Gather user details and call socketService to generate room
     */
    async initiateVideoCall(participants: string[]): Promise<string> {
        try {
            const userId = await getStringFromStorage(USER_ID);
            const userType = await getStringFromStorage(USER_TYPE);
            const organizationId = await getStringFromStorage(ORGANIZATION_ID);
            const userName = await getStringFromStorage('user_name'); // Correct key for username

            if (!userId || !organizationId || !userName) {
                console.error('Missing user details for call');
                throw new Error('User details missing. Please log in again.');
            }

            console.log('Initiating video call with:', participants);

            const roomId = await socketService.generateGroupCall(
                userId,
                userName,
                participants,
                organizationId
            );

            return roomId;
        } catch (error) {
            console.error('Error initiating video call:', error);
            throw error;
        }
    }
}


export default new DoctorService();
