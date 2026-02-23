/**
 * Inbox Redux Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InboxMessage, AlertMessage } from '../../types';

interface InboxState {
  messages: InboxMessage[];
  alerts: AlertMessage[];
  unreadCount: number;
  alertUnreadCount: number;
  isLoading: boolean;
}

const initialState: InboxState = {
  messages: [],
  alerts: [],
  unreadCount: 0,
  alertUnreadCount: 0,
  isLoading: false,
};

const inboxSlice = createSlice({
  name: 'inbox',
  initialState,
  reducers: {
    setMessages: (state, action: PayloadAction<InboxMessage[]>) => {
      state.messages = action.payload;
      state.unreadCount = action.payload.filter((m) => !m.isRead).length;
    },
    addMessage: (state, action: PayloadAction<InboxMessage>) => {
      state.messages.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const message = state.messages.find((m) => m.messageId === action.payload);
      if (message && !message.isRead) {
        message.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    setAlerts: (state, action: PayloadAction<AlertMessage[]>) => {
      state.alerts = action.payload;
      state.alertUnreadCount = action.payload.filter((a) => !a.isRead).length;
    },
    markAlertAsRead: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find((a) => a.alertId === action.payload);
      if (alert && !alert.isRead) {
        alert.isRead = true;
        state.alertUnreadCount = Math.max(0, state.alertUnreadCount - 1);
      }
    },
    markAllAlertsAsRead: (state) => {
      state.alerts.forEach((alert) => {
        alert.isRead = true;
      });
      state.alertUnreadCount = 0;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setMessages,
  addMessage,
  markAsRead,
  setAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
  setLoading,
} = inboxSlice.actions;

export default inboxSlice.reducer;
