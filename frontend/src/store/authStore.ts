import { create } from 'zustand';
import { User } from '../types';
import { authApi } from '../api/auth';
import { getAuthToken, setAuthToken } from '../api/client';
import { MOCK_CURRENT_USER } from '../api/mockData';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Partial<User> & { password?: string }) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
  setDemoRole: (role: 'admin' | 'user') => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: MOCK_CURRENT_USER, // Default to demo user for easy evaluation
  token: getAuthToken() || 'demo_jwt_token',
  isAuthenticated: true,
  isAdmin: true,
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
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
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
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
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
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  checkAuth: async () => {
    const token = getAuthToken();
    if (!token) {
      set({ isAuthenticated: false, user: null, isAdmin: false });
      return;
    }
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isAdmin: user.role === 'admin' });
    } catch {
      // If token verification failed, maintain current state in demo mode
    }
  },

  setDemoRole: (role) => {
    const currentUser = get().user || MOCK_CURRENT_USER;
    const updatedUser: User = { ...currentUser, role };
    set({
      user: updatedUser,
      isAdmin: role === 'admin',
      isAuthenticated: true,
    });
  },
}));

