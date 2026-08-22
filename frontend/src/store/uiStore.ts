import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface UIState {
  toasts: ToastMessage[];
  mobileMenuOpen: boolean;
  searchQuery: string;
  showToast: (type: ToastMessage['type'], message: string, durationMs?: number) => void;
  removeToast: (id: string) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  mobileMenuOpen: false,
  searchQuery: '',

  showToast: (type, message, durationMs = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, durationMs);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

