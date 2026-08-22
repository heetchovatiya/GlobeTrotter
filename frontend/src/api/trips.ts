import { apiClient } from './client';
import { Trip, TripStatus } from '../types';
import { MOCK_TRIPS } from './mockData';

export interface CreateTripDTO {
  name: string;
  start_date: string;
  end_date: string;
  description?: string;
  cover_photo_url?: string;
  is_public?: boolean;
}

export const tripsApi = {
  async getTrips(params?: { status?: TripStatus; sort?: string }): Promise<Trip[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.sort) query.append('sort', params.sort);
    const queryString = query.toString() ? `?${query.toString()}` : '';

    let filteredMocks = [...MOCK_TRIPS];
    if (params?.status) {
      filteredMocks = filteredMocks.filter((t) => t.status === params.status);
    }

    return apiClient<Trip[]>(`/trips${queryString}`, {
      method: 'GET',
      fallbackData: filteredMocks,
    });
  },

  async getTrip(id: number | string): Promise<Trip> {
    const found = MOCK_TRIPS.find((t) => t.id === Number(id)) || MOCK_TRIPS[0];
    return apiClient<Trip>(`/trips/${id}`, {
      method: 'GET',
      fallbackData: found,
    });
  },

  async createTrip(data: CreateTripDTO): Promise<Trip> {
    const newMockTrip: Trip = {
      id: Math.floor(Math.random() * 9000) + 100,
      user_id: 1,
      name: data.name,
      start_date: data.start_date,
      end_date: data.end_date,
      description: data.description,
      cover_photo_url: data.cover_photo_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&auto=format&fit=crop&q=80',
      status: 'planning',
      is_public: data.is_public ?? false,
      total_budget: 0,
      estimated_cost: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    MOCK_TRIPS.unshift(newMockTrip);

    return apiClient<Trip>('/trips', {
      method: 'POST',
      body: JSON.stringify(data),
      fallbackData: newMockTrip,
    });
  },

  async updateTrip(id: number | string, data: Partial<CreateTripDTO> & { status?: TripStatus }): Promise<Trip> {
    const foundIndex = MOCK_TRIPS.findIndex((t) => t.id === Number(id));
    let updatedTrip = { ...MOCK_TRIPS[0], ...data };
    if (foundIndex >= 0) {
      MOCK_TRIPS[foundIndex] = { ...MOCK_TRIPS[foundIndex], ...data, updated_at: new Date().toISOString() };
      updatedTrip = MOCK_TRIPS[foundIndex];
    }

    return apiClient<Trip>(`/trips/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      fallbackData: updatedTrip,
    });
  },

  async deleteTrip(id: number | string): Promise<void> {
    const index = MOCK_TRIPS.findIndex((t) => t.id === Number(id));
    if (index >= 0) {
      MOCK_TRIPS.splice(index, 1);
    }
    return apiClient<void>(`/trips/${id}`, {
      method: 'DELETE',
      fallbackData: undefined,
    });
  },
};

