import { getAuthToken } from './client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function downloadFile(path: string, filename: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error('Download failed');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const exportsApi = {
  downloadBudgetCsv(tripId: number | string) {
    return downloadFile(`/trips/${tripId}/export/budget.csv`, `trip-${tripId}-budget.csv`);
  },
  downloadSummaryCsv(tripId: number | string) {
    return downloadFile(`/trips/${tripId}/export/summary.csv`, `trip-${tripId}-plan.csv`);
  },
  downloadAllTripsCsv() {
    return downloadFile('/trips/export.csv', 'globetrotter-trips.csv');
  },
  downloadAdminTripsCsv() {
    return downloadFile('/admin/export/trips.csv', 'admin-all-trips.csv');
  },
  downloadAdminUsersCsv() {
    return downloadFile('/admin/export/users.csv', 'admin-all-users.csv');
  },
};
