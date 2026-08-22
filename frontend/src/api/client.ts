const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  token?: string;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

let activeToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  activeToken = token;
  if (token) {
    sessionStorage.setItem('globetrotter_token', token);
  } else {
    sessionStorage.removeItem('globetrotter_token');
  }
};

export const getAuthToken = (): string | null => {
  if (activeToken) return activeToken;
  const stored = sessionStorage.getItem('globetrotter_token');
  if (stored) {
    activeToken = stored;
  }
  return activeToken;
};

function parseErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: string }).msg);
        }
        return JSON.stringify(item);
      })
      .join(', ');
  }
  return fallback;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...restOptions } = options;
  const currentToken = token || getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (currentToken) {
    headers.Authorization = `Bearer ${currentToken}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...restOptions,
    headers,
  });

  if (response.status === 401) {
    setAuthToken(null);
  }

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: response.statusText };
    }
    throw new ApiError(
      response.status,
      parseErrorMessage(errorData, 'API request failed'),
      errorData
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}
