/**
 * Call Redux Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Call } from '../../types';

interface CallState {
  currentCall: Call | null;
  callHistory: Call[];
  isInCall: boolean;
  isRinging: boolean;
}

const initialState: CallState = {
  currentCall: null,
  callHistory: [],
  isInCall: false,
  isRinging: false,
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    setCall: (state, action: PayloadAction<Call>) => {
      state.currentCall = action.payload;
      state.isInCall = true;
    },
    setCallState: (state, action: PayloadAction<'connecting' | 'active' | 'ended'>) => {
      if (state.currentCall) {
        state.currentCall.status = action.payload;
        if (action.payload === 'ended') {
          state.isInCall = false;
        }
      }
    },
    endCall: (state) => {
      if (state.currentCall) {
        state.callHistory.push({
          ...state.currentCall,
          status: 'ended',
          endTime: new Date().toISOString(),
        });
      }
      state.currentCall = null;
      state.isInCall = false;
      state.isRinging = false;
    },
    setRinging: (state, action: PayloadAction<boolean>) => {
      state.isRinging = action.payload;
    },
  },
});

export const { setCall, setCallState, endCall, setRinging } = callSlice.actions;

export default callSlice.reducer;
