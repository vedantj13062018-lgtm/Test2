/**
 * Authentication Redux Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Organization, LoginResponse } from '../../types';
import {
  saveStringToStorage,
  getStringFromStorage,
  saveObjectToStorage,
} from '../../utils/storage';
import {
  SESSION_ID,
  USER_ID,
  USER_NAME,
  DOCTOR_NAME,
  SPECIALITY_ID,
  ORGANIZATION_ID,
  ORGANIZATION_NAME,
  IS_LOGGED_IN,
} from '../../constants';

interface AuthState {
  user: User | null;
  sessionId: string;
  isLoggedIn: boolean;
  isAuthenticating: boolean;
  organizations: Organization[];
  selectedOrganization: Organization | null;
  isMFAEnabled: boolean;
  mfaToken: string | null;
}

const initialState: AuthState = {
  user: null,
  sessionId: '',
  isLoggedIn: false,
  isAuthenticating: false,
  organizations: [],
  selectedOrganization: null,
  isMFAEnabled: false,
  mfaToken: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticating: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticating = action.payload;
    },
    loginSuccess: (state, action: PayloadAction<LoginResponse>) => {
      const { sessionId, data, chat_user_name } = action.payload;
      
      if (data && sessionId) {
        state.sessionId = sessionId;
        state.isLoggedIn = true;
        state.isMFAEnabled = data.multifactor_status === 1;
        
        state.user = {
          userId: String(data.userId),
          userName: data.user_name,
          doctorId: data.doctor_id ? String(data.doctor_id) : undefined,
          doctorName: data.doctor_name,
          userLevel: data.userLevel,
          isAdmin: data.admin,
          designation: data.designation,
          timezone: data.timezone,
          specialityId: data.speciality_id ? String(data.speciality_id) : undefined,
          nuanceOrg: data.nuance_org,
          nuanceGuid: data.nuance_guid,
          nuanceUser: data.nuance_user,
        };

        state.organizations = (data.organizations || []).map((org: any) => ({
          organizationId: String(org.organizationId || org.id),
          organizationName: org.organizationName || org.name,
        }));

        // Save to storage
        saveStringToStorage(SESSION_ID, sessionId);
        saveStringToStorage(USER_ID, String(data.userId));
        saveStringToStorage(USER_NAME, data.user_name);
        if (data.doctor_id) {
          saveStringToStorage(DOCTOR_NAME, data.doctor_name || '');
        }
        if (data.speciality_id) {
          saveStringToStorage(SPECIALITY_ID, String(data.speciality_id));
        }
        if (chat_user_name) {
          saveStringToStorage('chat_user_name', chat_user_name);
        }
        saveObjectToStorage('org_list', data.organizations || []);
      }
    },
    setMFAEnabled: (state, action: PayloadAction<boolean>) => {
      state.isMFAEnabled = action.payload;
    },
    setMFAToken: (state, action: PayloadAction<string | null>) => {
      state.mfaToken = action.payload;
    },
    selectOrganization: (state, action: PayloadAction<Organization>) => {
      state.selectedOrganization = action.payload;
      saveStringToStorage(ORGANIZATION_ID, action.payload.organizationId);
      saveStringToStorage(ORGANIZATION_NAME, action.payload.organizationName);
    },
    logout: (state) => {
      state.user = null;
      state.sessionId = '';
      state.isLoggedIn = false;
      state.organizations = [];
      state.selectedOrganization = null;
      state.isMFAEnabled = false;
      state.mfaToken = null;
    },
    restoreSession: (state) => {
      // This is a thunk action, but we'll handle it synchronously for now
      // The actual restoration should be done in a thunk or in the component
      // For now, we'll just return the state as-is
      // The component will handle the async restoration
    },
  },
});

export const {
  setAuthenticating,
  loginSuccess,
  setMFAEnabled,
  setMFAToken,
  selectOrganization,
  logout,
  restoreSession,
} = authSlice.actions;

export default authSlice.reducer;
