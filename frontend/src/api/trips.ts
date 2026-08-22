import { apiClient } from './client';
import { mapTrip } from './mappers';
import { Trip, TripStatus } from '../types';

export interface CreateTripDTO {
  name: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  cover_photo_url?: string;
  is_public?: boolean;
  save_as_draft?: boolean;
}

export const tripsApi = {
  async getTrips(params?: {
    status?: TripStatus | 'upcoming';
    sort?: string;
    limit?: number;
  }): Promise<Trip[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.sort) {
      const sortMap: Record<string, string> = {
        recent: 'start_date_desc',
        start_date_desc: 'start_date_desc',
        name: 'name',
        created_at: 'created_at',
      };
      query.append('sort', sortMap[params.sort] || params.sort);
    }
    if (params?.limit) query.append('limit', String(params.limit));
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const trips = await apiClient<Trip[]>(`/trips${queryString}`, { method: 'GET' });
    return trips.map(mapTrip);
  },

  async getTrip(id: number | string): Promise<Trip> {
    const trip = await apiClient<Trip>(`/trips/${id}`, { method: 'GET' });
    return mapTrip(trip);
  },

  async createTrip(data: CreateTripDTO): Promise<Trip> {
    const trip = await apiClient<Trip>('/trips', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapTrip(trip);
  },

  async updateTrip(
    id: number | string,
    data: Partial<CreateTripDTO> & { status?: TripStatus }
  ): Promise<Trip> {
    const trip = await apiClient<Trip>(`/trips/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return mapTrip(trip);
  },

  async deleteTrip(id: number | string): Promise<void> {
    return apiClient<void>(`/trips/${id}`, { method: 'DELETE' });
  },

  async duplicateTrip(id: number | string): Promise<{ trip_id: number }> {
    return apiClient<{ trip_id: number }>(`/trips/${id}/duplicate`, { method: 'POST' });
  },
};
