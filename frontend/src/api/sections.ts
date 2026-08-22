import { apiClient } from './client';
import { TripSection, SectionType } from '../types';

export interface CreateSectionDTO {
  title: string;
  type: SectionType;
  date_range_start: string;
  date_range_end: string;
  budget: number;
  notes?: string;
  order_index?: number;
}

export const sectionsApi = {
  async createSection(stopId: number | string, data: CreateSectionDTO): Promise<TripSection> {
    const mockSection: TripSection = {
      id: Math.floor(Math.random() * 9000) + 100,
      stop_id: Number(stopId),
      title: data.title,
      type: data.type,
      date_range_start: data.date_range_start,
      date_range_end: data.date_range_end,
      budget: data.budget,
      notes: data.notes,
      order_index: data.order_index ?? 1,
      activities: [],
    };

    return apiClient<TripSection>(`/stops/${stopId}/sections`, {
      method: 'POST',
      body: JSON.stringify(data),
      fallbackData: mockSection,
    });
  },

  async updateSection(id: number | string, data: Partial<CreateSectionDTO>): Promise<TripSection> {
    return apiClient<TripSection>(`/sections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      fallbackData: { id: Number(id), ...data } as TripSection,
    });
  },

  async deleteSection(id: number | string): Promise<void> {
    return apiClient<void>(`/sections/${id}`, {
      method: 'DELETE',
      fallbackData: undefined,
    });
  },
};

