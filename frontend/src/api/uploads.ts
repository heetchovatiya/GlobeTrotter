import { getAuthToken } from './client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const uploadsApi = {
  async uploadCoverPhoto(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/uploads/cover`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      let detail = 'Failed to upload cover photo.';
      try {
        const data = await response.json();
        if (typeof data.detail === 'string') detail = data.detail;
      } catch {
        // ignore parse errors
      }
      throw new Error(detail);
    }

    const data = (await response.json()) as { url: string };
    return data.url.startsWith('http') ? data.url : `${API_BASE_URL}${data.url}`;
  },

  async uploadProfilePhoto(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/uploads/profile`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload profile photo.');
    }

    const data = (await response.json()) as { url: string };
    return data.url.startsWith('http') ? data.url : `${API_BASE_URL}${data.url}`;
  },
};
