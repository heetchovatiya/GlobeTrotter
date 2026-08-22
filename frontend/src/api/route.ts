import { apiClient } from './client';
import { TripRoute } from '../types';

export const routeApi = {
  async getTripRoute(tripId: number | string): Promise<TripRoute> {
    return apiClient<TripRoute>(`/trips/${tripId}/route`, { method: 'GET' });
  },
};
