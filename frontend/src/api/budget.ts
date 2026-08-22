import { apiClient } from './client';
import { BudgetSummary, Expense } from '../types';
import { MOCK_ITINERARY_1 } from './mockData';

export const budgetApi = {
  async getBudget(tripId: number | string): Promise<BudgetSummary> {
    return apiClient<BudgetSummary>(`/trips/${tripId}/budget`, {
      method: 'GET',
      fallbackData: MOCK_ITINERARY_1.budget,
    });
  },

  async addExpense(
    tripId: number | string,
    data: Omit<Expense, 'id' | 'trip_id'>
  ): Promise<Expense> {
    const mockExpense: Expense = {
      id: Math.floor(Math.random() * 9000) + 100,
      trip_id: Number(tripId),
      category: data.category,
      amount: data.amount,
      section_id: data.section_id,
      date: data.date || new Date().toISOString().split('T')[0],
      note: data.note,
    };

    return apiClient<Expense>(`/trips/${tripId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
      fallbackData: mockExpense,
    });
  },
};

