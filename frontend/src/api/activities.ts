import { apiClient } from './client';
import { mapActivity } from './mappers';
import { Activity, ActivityType } from '../types';

export const activitiesApi = {
  async getActivities(params?: {
    q?: string;
    city_id?: number;
    type?: ActivityType;
    max_cost?: number;
    max_duration_mins?: number;
    sort?: string;
    limit?: number;
  }): Promise<Activity[]> {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.city_id) query.append('city_id', String(params.city_id));
    if (params?.type) query.append('type', params.type);
    if (params?.max_cost !== undefined) query.append('max_cost', String(params.max_cost));
    if (params?.max_duration_mins !== undefined) {
      query.append('max_duration_mins', String(params.max_duration_mins));
    }
    if (params?.sort) query.append('sort', params.sort);
    if (params?.limit) query.append('limit', String(params.limit));
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const activities = await apiClient<Activity[]>(`/activities${queryString}`, {
      method: 'GET',
    });
    return activities.map(mapActivity);
  },
};
