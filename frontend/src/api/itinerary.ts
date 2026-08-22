import { apiClient } from './client';
import { ItineraryResponse } from '../types';
import { MOCK_ITINERARY_1 } from './mockData';

export const itineraryApi = {
  async getItinerary(tripId: number | string): Promise<ItineraryResponse> {
    return apiClient<ItineraryResponse>(`/trips/${tripId}/itinerary`, {
      method: 'GET',
      fallbackData: MOCK_ITINERARY_1,
    });
  },

  async reorderActivities(
    tripId: number | string,
    updates: { section_id: number; order_index: number }[]
  ): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/trips/${tripId}/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ updates }),
      fallbackData: { success: true },
    });
  },
};

