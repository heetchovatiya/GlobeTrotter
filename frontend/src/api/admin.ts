import { apiClient } from './client';
import { mapAdminAnalytics, mapAdminUser } from './mappers';
import { AdminAnalytics, AdminUser, User } from '../types';

export const adminApi = {
  async getAnalytics(): Promise<AdminAnalytics> {
    const [trends, cities, activities] = await Promise.all([
      apiClient<{
        trips_over_time: { date: string; trips_created: number }[];
        active_users: number;
        total_trips: number;
        total_users: number;
        total_spend?: number;
        total_destinations?: number;
      }>('/admin/analytics/trends', { method: 'GET' }),
      apiClient<
        { city_id: number; name: string; country: string; trip_count: number }[]
      >('/admin/analytics/cities?limit=10', { method: 'GET' }),
      apiClient<
        { activity_id: number; name: string; city_id: number; booking_count: number }[]
      >('/admin/analytics/activities?limit=10', { method: 'GET' }),
    ]);
    return mapAdminAnalytics(trends, cities, activities);
  },

  async getUsers(): Promise<AdminUser[]> {
    const users = await apiClient<(User & { is_suspended?: boolean; trips_count?: number })[]>(
      '/admin/users',
      { method: 'GET' }
    );
    return users.map(mapAdminUser);
  },

  async toggleUserStatus(userId: number, suspended: boolean): Promise<AdminUser> {
    const user = await apiClient<User & { is_suspended?: boolean }>(
      `/admin/users/${userId}/suspend`,
      {
        method: 'POST',
        body: JSON.stringify({ suspended }),
      }
    );
    return mapAdminUser(user);
  },
};
