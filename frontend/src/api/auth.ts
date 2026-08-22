import { apiClient, setAuthToken } from './client';
import { User } from '../types';
import { MOCK_CURRENT_USER } from './mockData';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const fallbackResponse: LoginResponse = {
      access_token: 'mock_jwt_token_' + Date.now(),
      token_type: 'bearer',
      user: {
        ...MOCK_CURRENT_USER,
        email: email || MOCK_CURRENT_USER.email,
        role: email.toLowerCase().includes('admin') ? 'admin' : 'user',
      },
    };

    const res = await apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      fallbackData: fallbackResponse,
    });

    if (res?.access_token) {
      setAuthToken(res.access_token);
    }
    return res;
  },

  async register(userData: Partial<User> & { password?: string }): Promise<LoginResponse> {
    const fallbackResponse: LoginResponse = {
      access_token: 'mock_jwt_token_' + Date.now(),
      token_type: 'bearer',
      user: {
        id: Math.floor(Math.random() * 1000) + 10,
        name: userData.name || 'New Explorer',
        email: userData.email || 'user@example.com',
        city: userData.city,
        country: userData.country,
        phone_number: userData.phone_number,
        additional_info: userData.additional_info,
        role: 'user',
        created_at: new Date().toISOString(),
      },
    };

    const res = await apiClient<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      fallbackData: fallbackResponse,
    });

    if (res?.access_token) {
      setAuthToken(res.access_token);
    }
    return res;
  },

  async getMe(): Promise<User> {
    return apiClient<User>('/users/me', {
      method: 'GET',
      fallbackData: MOCK_CURRENT_USER,
    });
  },

  async updateMe(data: Partial<User>): Promise<User> {
    return apiClient<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
      fallbackData: { ...MOCK_CURRENT_USER, ...data },
    });
  },

  logout() {
    setAuthToken(null);
  },
};

