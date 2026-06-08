import { create } from 'zustand';
import type { Message } from '../types';

interface MessageState {
  unreadCount: number;
  messages: Record<number, Message[]>;
  isLoading: boolean;
  fetchUnreadCount: (userId: number) => Promise<void>;
  fetchMessages: (exchangeId: number) => Promise<void>;
  addMessage: (message: Message) => void;
  markAsRead: (exchangeId: number, userId: number) => Promise<void>;
  setUnreadCount: (count: number) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  unreadCount: 0,
  messages: {},
  isLoading: false,
  fetchUnreadCount: async (userId: number) => {
    try {
      const response = await fetch(`/api/messages/unread/${userId}`);
      const result = await response.json();
      if (result.success) {
        set({ unreadCount: result.data?.count || 0 });
      }
    } catch (error) {
      console.error('Fetch unread count failed:', error);
    }
  },
  fetchMessages: async (exchangeId: number) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/messages/exchange/${exchangeId}`);
      const result = await response.json();
      if (result.success && result.data) {
        set((state) => ({
          messages: {
            ...state.messages,
            [exchangeId]: result.data,
          },
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Fetch messages failed:', error);
      set({ isLoading: false });
    }
  },
  addMessage: (message: Message) => {
    set((state) => {
      const existing = state.messages[message.exchangeId] || [];
      return {
        messages: {
          ...state.messages,
          [message.exchangeId]: [...existing, message],
        },
      };
    });
  },
  markAsRead: async (exchangeId: number, userId: number) => {
    try {
      await fetch(`/api/messages/read/${exchangeId}?userId=${userId}`, {
        method: 'PUT',
      });
      const { fetchUnreadCount } = get();
      await fetchUnreadCount(userId);
    } catch (error) {
      console.error('Mark as read failed:', error);
    }
  },
  setUnreadCount: (count: number) => {
    set({ unreadCount: count });
  },
}));
