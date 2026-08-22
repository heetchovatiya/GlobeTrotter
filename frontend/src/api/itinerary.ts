import { apiClient } from './client';
import { mapBudget, mapItineraryResponse } from './mappers';
import { BudgetSummary, ItineraryResponse, Trip } from '../types';
import { tripsApi } from './trips';

export const itineraryApi = {
  async getItinerary(tripId: number | string): Promise<ItineraryResponse> {
    const [itinerary, budget, trip] = await Promise.all([
      apiClient<{
        trip_id: number;
        name: string;
        start_date: string;
        end_date: string;
        status: Trip['status'];
        days: [];
      }>(`/trips/${tripId}/itinerary`, { method: 'GET' }),
      apiClient<{
        trip_id: number;
        by_category: [];
        by_day: [];
        overbudget_days: string[];
      }>(`/trips/${tripId}/budget`, { method: 'GET' }),
      tripsApi.getTrip(tripId),
    ]);
    return mapItineraryResponse(itinerary, budget, trip);
  },

  async reorderActivities(
    tripId: number | string,
    updates: { section_id: number; order_index: number }[]
  ): Promise<{ success: boolean }> {
    await Promise.all(
      updates.map((update) =>
        apiClient(`/sections/${update.section_id}`, {
          method: 'PATCH',
          body: JSON.stringify({ order_index: update.order_index }),
        })
      )
    );
    return { success: true };
  },
};
