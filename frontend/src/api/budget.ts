import { apiClient } from './client';
import { mapBudget } from './mappers';
import { BudgetSummary, ExpenseCategory } from '../types';

export const budgetApi = {
  async getBudget(tripId: number | string): Promise<BudgetSummary> {
    const budget = await apiClient<{
      trip_id: number;
      by_category: { category: ExpenseCategory; total: number }[];
      by_day: { date: string; estimated: number; actual: number }[];
      overbudget_days: string[];
    }>(`/trips/${tripId}/budget`, { method: 'GET' });
    return mapBudget(budget);
  },
};
