import { create } from 'zustand';
import { User } from '../types';
import { authApi } from '../api/auth';
import { getAuthToken, setAuthToken } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Parameters<typeof authApi.register>[0]) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getAuthToken(),
  isAuthenticated: !!getAuthToken(),
  isAdmin: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(email, password);
      set({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
        isAdmin: response.user.role === 'admin',
        isLoading: false,
      });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(userData);
      set({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
        isAdmin: response.user.role === 'admin',
        isLoading: false,
      });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: () => {
    authApi.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      error: null,
    });
  },

  updateProfile: async (data) => {
    try {
      const updated = await authApi.updateMe(data);
      set({ user: updated });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Profile update failed';
      set({ error: message });
    }
  },

  checkAuth: async () => {
    const token = getAuthToken();
    if (!token) {
      set({ isAuthenticated: false, user: null, isAdmin: false, token: null });
      return;
    }
    set({ isLoading: true });
    try {
      const user = await authApi.getMe();
      set({
        user,
        token,
        isAuthenticated: true,
        isAdmin: user.role === 'admin',
        isLoading: false,
      });
    } catch {
      setAuthToken(null);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
      });
    }
  },
}));
