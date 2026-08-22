import { apiClient } from './client';
import { mapTrip } from './mappers';
import { Trip, TripTemplate } from '../types';

export const templatesApi = {
  async listTemplates(): Promise<TripTemplate[]> {
    return apiClient<TripTemplate[]>('/trips/templates', { method: 'GET' });
  },

  async instantiateTemplate(
    templateId: string,
    payload: { start_date: string; name?: string; description?: string }
  ): Promise<Trip> {
    const trip = await apiClient<Trip>(`/trips/templates/${templateId}/instantiate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapTrip(trip);
  },
};
