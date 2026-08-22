import { apiClient } from './client';
import { AdminAnalytics, AdminUser } from '../types';
import { MOCK_ADMIN_ANALYTICS, MOCK_ADMIN_USERS } from './mockData';

export const adminApi = {
  async getAnalytics(): Promise<AdminAnalytics> {
    return apiClient<AdminAnalytics>('/admin/analytics/trends', {
      method: 'GET',
      fallbackData: MOCK_ADMIN_ANALYTICS,
    });
  },

  async getUsers(): Promise<AdminUser[]> {
    return apiClient<AdminUser[]>('/admin/users', {
      method: 'GET',
      fallbackData: MOCK_ADMIN_USERS,
    });
  },

  async toggleUserStatus(userId: number): Promise<AdminUser> {
    const user = MOCK_ADMIN_USERS.find((u) => u.id === userId);
    if (user) {
      user.is_active = !user.is_active;
    }

    return apiClient<AdminUser>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      fallbackData: user || MOCK_ADMIN_USERS[0],
    });
  },
};

