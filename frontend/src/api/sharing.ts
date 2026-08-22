import { apiClient } from './client';
import { SharedTrip, Trip } from '../types';
import { MOCK_ITINERARY_1, MOCK_TRIPS } from './mockData';

export const sharingApi = {
  async shareTrip(tripId: number | string): Promise<{ public_slug: string; share_url: string }> {
    const slug = `trip-share-${tripId}-${Math.random().toString(36).substring(2, 7)}`;
    return apiClient<{ public_slug: string; share_url: string }>(`/trips/${tripId}/share`, {
      method: 'POST',
      fallbackData: {
        public_slug: slug,
        share_url: `${window.location.origin}/t/${slug}`,
      },
    });
  },

  async getPublicTrip(slug: string): Promise<SharedTrip> {
    const mockShared: SharedTrip = {
      id: 1,
      trip_id: MOCK_TRIPS[0].id,
      public_slug: slug,
      created_at: new Date().toISOString(),
      trip: MOCK_TRIPS[0],
      days: MOCK_ITINERARY_1.days,
      budget: MOCK_ITINERARY_1.budget,
    };

    return apiClient<SharedTrip>(`/public/${slug}`, {
      method: 'GET',
      fallbackData: mockShared,
    });
  },

  async copyPublicTrip(slug: string): Promise<{ new_trip_id: number; trip: Trip }> {
    const clonedTrip: Trip = {
      ...MOCK_TRIPS[0],
      id: Math.floor(Math.random() * 9000) + 500,
      name: `${MOCK_TRIPS[0].name} (Cloned)`,
      status: 'planning',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    MOCK_TRIPS.unshift(clonedTrip);

    return apiClient<{ new_trip_id: number; trip: Trip }>(`/public/${slug}/copy`, {
      method: 'POST',
      fallbackData: {
        new_trip_id: clonedTrip.id,
        trip: clonedTrip,
      },
    });
  },
};

