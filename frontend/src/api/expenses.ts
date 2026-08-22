import { apiClient } from './client';
import { Expense, ExpenseCategory } from '../types';

export interface ExpenseCreatePayload {
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  note?: string;
  receipt_url?: string;
}

export const expensesApi = {
  async listExpenses(tripId: number | string): Promise<Expense[]> {
    return apiClient<Expense[]>(`/trips/${tripId}/expenses`, { method: 'GET' });
  },

  async createExpense(tripId: number | string, payload: ExpenseCreatePayload): Promise<Expense> {
    return apiClient<Expense>(`/trips/${tripId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteExpense(tripId: number | string, expenseId: number): Promise<void> {
    await apiClient<void>(`/trips/${tripId}/expenses/${expenseId}`, { method: 'DELETE' });
  },
};
