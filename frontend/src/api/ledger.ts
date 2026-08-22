import { getAuthToken } from './client';
import { apiClient } from './client';
import { TravelLedger, TripStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface LedgerFilters {
  status?: TripStatus | 'all';
  start_from?: string;
  start_to?: string;
}

function buildQuery(filters: LedgerFilters): string {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.start_from) params.set('start_from', filters.start_from);
  if (filters.start_to) params.set('start_to', filters.start_to);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const ledgerApi = {
  async getLedger(filters: LedgerFilters = {}): Promise<TravelLedger> {
    return apiClient<TravelLedger>(`/users/me/travel-ledger${buildQuery(filters)}`, {
      method: 'GET',
    });
  },

  async downloadLedgerCsv(filters: LedgerFilters = {}): Promise<void> {
    const token = getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/users/me/travel-ledger/export.csv${buildQuery(filters)}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'travel-ledger.csv';
    link.click();
    URL.revokeObjectURL(url);
  },
};
