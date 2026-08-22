import { apiClient } from './client';
import { Stop } from '../types';

export const stopsApi = {
  async getStops(tripId: number | string): Promise<Stop[]> {
    return apiClient<Stop[]>(`/trips/${tripId}/stops`, { method: 'GET' });
  },

  async createStop(
    tripId: number | string,
    data: {
      city_id: number;
      arrival_date: string;
      departure_date: string;
      order_index?: number;
    }
  ): Promise<Stop> {
    return apiClient<Stop>(`/trips/${tripId}/stops`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateStop(
    tripId: number | string,
    stopId: number | string,
    data: Partial<Stop>
  ): Promise<Stop> {
    return apiClient<Stop>(`/trips/${tripId}/stops/${stopId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteStop(tripId: number | string, stopId: number | string): Promise<void> {
    return apiClient<void>(`/trips/${tripId}/stops/${stopId}`, { method: 'DELETE' });
  },
};
