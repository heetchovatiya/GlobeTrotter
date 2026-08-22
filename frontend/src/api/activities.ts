import { apiClient } from './client';
import { Activity, ActivityType } from '../types';
import { MOCK_ACTIVITIES } from './mockData';

export const activitiesApi = {
  async getActivities(params?: {
    q?: string;
    city_id?: number;
    type?: ActivityType;
    max_cost?: number;
    sort?: string;
  }): Promise<Activity[]> {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.city_id) query.append('city_id', String(params.city_id));
    if (params?.type) query.append('type', params.type);
    if (params?.max_cost !== undefined) query.append('max_cost', String(params.max_cost));
    if (params?.sort) query.append('sort', params.sort);

    const queryString = query.toString() ? `?${query.toString()}` : '';

    let results = [...MOCK_ACTIVITIES];
    if (params?.q) {
      const searchLower = params.q.toLowerCase();
      results = results.filter(
        (a) => a.name.toLowerCase().includes(searchLower) || a.description.toLowerCase().includes(searchLower)
      );
    }
    if (params?.city_id) {
      results = results.filter((a) => a.city_id === params.city_id);
    }
    if (params?.type) {
      results = results.filter((a) => a.type === params.type);
    }
    if (params?.max_cost !== undefined) {
      results = results.filter((a) => a.cost <= params.max_cost!);
    }

    return apiClient<Activity[]>(`/activities${queryString}`, {
      method: 'GET',
      fallbackData: results,
    });
  },

  async getActivity(id: number | string): Promise<Activity> {
    const act = MOCK_ACTIVITIES.find((a) => a.id === Number(id)) || MOCK_ACTIVITIES[0];
    return apiClient<Activity>(`/activities/${id}`, {
      method: 'GET',
      fallbackData: act,
    });
  },
};

