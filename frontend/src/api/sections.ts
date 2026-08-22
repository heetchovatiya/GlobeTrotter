import { apiClient } from './client';
import { TripSection, SectionType } from '../types';

export interface CreateSectionDTO {
  title: string;
  type: SectionType;
  date_range_start: string;
  date_range_end: string;
  budget: number;
  budget_allocation?: string;
  notes?: string;
  order_index?: number;
}

export const sectionsApi = {
  async createSection(
    tripId: number | string,
    stopId: number | string,
    data: CreateSectionDTO
  ): Promise<TripSection> {
    return apiClient<TripSection>(`/trips/${tripId}/stops/${stopId}/sections`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSection(id: number | string, data: Partial<CreateSectionDTO>): Promise<TripSection> {
    return apiClient<TripSection>(`/sections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteSection(id: number | string): Promise<void> {
    return apiClient<void>(`/sections/${id}`, { method: 'DELETE' });
  },
};
