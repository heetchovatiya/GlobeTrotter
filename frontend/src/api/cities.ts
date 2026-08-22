import { apiClient } from './client';
import { mapCity } from './mappers';
import { City } from '../types';

export const citiesApi = {
  async getCities(params?: {
    q?: string;
    country?: string;
    sort?: string;
    limit?: number;
  }): Promise<City[]> {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.country) query.append('country', params.country);
    if (params?.sort) query.append('sort', params.sort);
    if (params?.limit) query.append('limit', String(params.limit));
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const cities = await apiClient<City[]>(`/cities${queryString}`, { method: 'GET' });
    return cities.map(mapCity);
  },
};
