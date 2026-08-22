import { apiClient, setAuthToken } from './client';
import { mapUser } from './mappers';
import { User } from '../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone_number?: string;
  city?: string;
  country?: string;
  language_pref?: string;
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await apiClient<{ access_token: string; token_type: string; user: User }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    setAuthToken(res.access_token);
    return { ...res, user: mapUser(res.user) };
  },

  async register(userData: RegisterPayload): Promise<LoginResponse> {
    const res = await apiClient<{ access_token: string; token_type: string; user: User }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );
    setAuthToken(res.access_token);
    return { ...res, user: mapUser(res.user) };
  },

  async getMe(): Promise<User> {
    const user = await apiClient<User>('/users/me', { method: 'GET' });
    return mapUser(user);
  },

  async updateMe(data: Partial<User>): Promise<User> {
    const payload = {
      name: data.name,
      phone_number: data.phone_number,
      city: data.city,
      country: data.country,
      language_pref: data.language_pref,
      profile_photo_url: data.profile_photo_url,
    };
    const user = await apiClient<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapUser(user);
  },

  logout() {
    setAuthToken(null);
  },
};
