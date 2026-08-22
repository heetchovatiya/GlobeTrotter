import { apiClient } from './client';
import { Stop } from '../types';

export const stopsApi = {
  async getStops(tripId: number | string): Promise<Stop[]> {
    return apiClient<Stop[]>(`/trips/${tripId}/stops`, {
      method: 'GET',
      fallbackData: [],
    });
  },

  async createStop(tripId: number | string, data: { city_id: number; arrival_date: string; departure_date: string; order_index?: number }): Promise<Stop> {
    const mockStop: Stop = {
      id: Math.floor(Math.random() * 9000) + 100,
      trip_id: Number(tripId),
      city_id: data.city_id,
      order_index: data.order_index ?? 1,
      arrival_date: data.arrival_date,
      departure_date: data.departure_date,
    };

    return apiClient<Stop>(`/trips/${tripId}/stops`, {
      method: 'POST',
      body: JSON.stringify(data),
      fallbackData: mockStop,
    });
  },

  async updateStop(stopId: number | string, data: Partial<Stop>): Promise<Stop> {
    return apiClient<Stop>(`/stops/${stopId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      fallbackData: { id: Number(stopId), ...data } as Stop,
    });
  },

  async deleteStop(stopId: number | string): Promise<void> {
    return apiClient<void>(`/stops/${stopId}`, {
      method: 'DELETE',
      fallbackData: undefined,
    });
  },
};

