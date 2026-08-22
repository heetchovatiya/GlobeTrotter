import { apiClient } from './client';
import { mapSharedTrip } from './mappers';
import { SharedTrip, Trip, ExpenseCategory } from '../types';
import { tripsApi } from './trips';

export const sharingApi = {
  async shareTrip(tripId: number | string): Promise<{ public_slug: string; share_url: string }> {
    const res = await apiClient<{ trip_id: number; public_slug: string }>(
      `/trips/${tripId}/share`,
      { method: 'POST' }
    );
    return {
      public_slug: res.public_slug,
      share_url: `${window.location.origin}/t/${res.public_slug}`,
    };
  },

  async getPublicTrip(slug: string): Promise<SharedTrip> {
    const [itinerary, budgetRaw] = await Promise.all([
      apiClient<{
        trip_id: number;
        name: string;
        start_date: string;
        end_date: string;
        status: Trip['status'];
        days: [];
      }>(`/public/${slug}`, { method: 'GET' }),
      apiClient<{
        trip_id: number;
        by_category: { category: ExpenseCategory; total: number }[];
        by_day: { date: string; estimated: number; actual: number }[];
        overbudget_days: string[];
      }>(`/public/${slug}/budget`, { method: 'GET' }),
    ]);

    return mapSharedTrip(slug, itinerary, budgetRaw);
  },

  async copyPublicTrip(slug: string): Promise<{ new_trip_id: number; trip: Trip }> {
    const res = await apiClient<{ trip_id: number }>(`/public/${slug}/copy`, {
      method: 'POST',
    });
    const trip = await tripsApi.getTrip(res.trip_id);
    return { new_trip_id: res.trip_id, trip };
  },
};
