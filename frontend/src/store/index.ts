/**
 * Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import chatSlice from './slices/chatSlice';
import callSlice from './slices/callSlice';
import inboxSlice from './slices/inboxSlice';
import dashboardSlice from './slices/dashboardSlice';
import taskSlice from './slices/taskSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    chat: chatSlice,
    call: callSlice,
    inbox: inboxSlice,
    dashboard: dashboardSlice,
    task: taskSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['call/setCallState', 'chat/addMessage'],
        ignoredPaths: ['call.currentCall', 'chat.messages'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
