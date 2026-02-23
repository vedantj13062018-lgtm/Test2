/**
 * Chat Redux Slice
 * Matches Swift/Android: recent chats list, chat requests, messages per chat
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Chat, ChatMessage, ChatRequest } from '../../types';

/** Session-like params for Chat screen when opened without route params (matches StrokeTeamOne Session.getChat*) */
export interface PendingChatParams {
  chatId: string;
  chatName: string;
  receiverId: string;
  isGroup?: boolean;
}

interface ChatState {
  chats: Chat[];
  recentChats: Chat[];
  chatRequests: ChatRequest[];
  currentChat: Chat | null;
  messages: Record<string, ChatMessage[]>;
  isLoading: boolean;
  isConnected: boolean;
  /** Set before navigating to Chat so ChatScreen can read when params are missing (matches Android Session) */
  pendingChatParams: PendingChatParams | null;
}

const initialState: ChatState = {
  chats: [],
  recentChats: [],
  chatRequests: [],
  currentChat: null,
  messages: {},
  isLoading: false,
  isConnected: false,
  pendingChatParams: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChats: (state, action: PayloadAction<Chat[]>) => {
      state.chats = action.payload;
    },
    addChat: (state, action: PayloadAction<Chat>) => {
      const existingIndex = state.chats.findIndex((c) => c.chatId === action.payload.chatId);
      if (existingIndex >= 0) {
        state.chats[existingIndex] = action.payload;
      } else {
        state.chats.push(action.payload);
      }
    },
    setCurrentChat: (state, action: PayloadAction<Chat | null>) => {
      state.currentChat = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ chatId: string; message: ChatMessage }>) => {
      const { chatId, message } = action.payload;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(message);
    },
    setMessages: (state, action: PayloadAction<{ chatId: string; messages: ChatMessage[] }>) => {
      const { chatId, messages } = action.payload;
      state.messages[chatId] = messages;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setRecentChats: (state, action: PayloadAction<Chat[]>) => {
      state.recentChats = action.payload;
    },
    setChatRequests: (state, action: PayloadAction<ChatRequest[]>) => {
      state.chatRequests = action.payload;
    },
    /** Set before navigate to Chat; cleared when ChatScreen reads it (matches StrokeTeamOne Session) */
    setPendingChatParams: (state, action: PayloadAction<PendingChatParams | null>) => {
      state.pendingChatParams = action.payload;
    },
  },
});

export const {
  setChats,
  addChat,
  setCurrentChat,
  addMessage,
  setMessages,
  setLoading,
  setConnected,
  setRecentChats,
  setChatRequests,
  setPendingChatParams,
} = chatSlice.actions;

export default chatSlice.reducer;
