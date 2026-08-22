import { apiClient } from './client';
import { City } from '../types';
import { MOCK_CITIES } from './mockData';

export const citiesApi = {
  async getCities(params?: { q?: string; country?: string; sort?: string; limit?: number }): Promise<City[]> {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.country) query.append('country', params.country);
    if (params?.sort) query.append('sort', params.sort);
    if (params?.limit) query.append('limit', String(params.limit));

    const queryString = query.toString() ? `?${query.toString()}` : '';

    let results = [...MOCK_CITIES];
    if (params?.q) {
      const searchLower = params.q.toLowerCase();
      results = results.filter(
        (c) => c.name.toLowerCase().includes(searchLower) || c.country.toLowerCase().includes(searchLower)
      );
    }
    if (params?.country) {
      results = results.filter((c) => c.country.toLowerCase() === params.country?.toLowerCase());
    }
    if (params?.sort === 'popularity') {
      results.sort((a, b) => b.popularity_score - a.popularity_score);
    }
    if (params?.limit) {
      results = results.slice(0, params.limit);
    }

    return apiClient<City[]>(`/cities${queryString}`, {
      method: 'GET',
      fallbackData: results,
    });
  },

  async getCity(id: number | string): Promise<City> {
    const city = MOCK_CITIES.find((c) => c.id === Number(id)) || MOCK_CITIES[0];
    return apiClient<City>(`/cities/${id}`, {
      method: 'GET',
      fallbackData: city,
    });
  },
};

