import { create } from 'zustand';
import type { User } from '../types';
import { DEFAULT_USER_ID } from '../utils/constants';

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  setCurrentUser: (user: User | null) => void;
  login: (userId?: number) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoading: true,
  setCurrentUser: (user) => set({ currentUser: user }),
  login: async (userId = DEFAULT_USER_ID) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/users/${userId}`);
      const result = await response.json();
      if (result.success && result.data) {
        set({ currentUser: result.data, isLoading: false });
      }
    } catch (error) {
      console.error('Login failed:', error);
      set({ isLoading: false });
    }
  },
  logout: () => {
    set({ currentUser: null });
  },
}));
