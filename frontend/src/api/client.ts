const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  token?: string;
  fallbackData?: any;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
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

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, fallbackData, headers: customHeaders, ...restOptions } = options;
  const currentToken = token || getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(customHeaders as Record<string, string> || {}),
  };

  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers,
    });

    if (response.status === 401) {
      setAuthToken(null);
      // Optional callback/event trigger
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }
      throw new ApiError(response.status, errorData.detail || 'API request failed', errorData);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error: any) {
    // If backend connection refused or errored in dev mode, use fallbackData if provided
    if (fallbackData !== undefined) {
      console.warn(`[GlobeTrotter API] Falling back to local data for ${endpoint}:`, error.message);
      return fallbackData as T;
    }
    throw error;
  }
}

