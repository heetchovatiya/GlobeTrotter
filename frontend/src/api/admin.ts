import { apiClient } from './client';
import { mapAdminAnalytics, mapAdminUser } from './mappers';
import { AdminAnalytics, AdminUser, Activity, City, User, ActivityType, UserRole } from '../types';

export interface Paginated<T> {
  items: T[];
  total: number;
}

export interface BulkUploadResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export interface AdminUserCreatePayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone_number?: string;
  city?: string;
  country?: string;
}

export interface AdminUserUpdatePayload {
  name?: string;
  email?: string;
  role?: UserRole;
  is_suspended?: boolean;
  phone_number?: string;
  city?: string;
  country?: string;
}

export interface CityPayload {
  name: string;
  country: string;
  cost_index?: number;
  popularity_score?: number;
  image_url?: string;
}

export interface ActivityPayload {
  city_id: number;
  name: string;
  type: ActivityType;
  cost?: number;
  duration_mins?: number;
  description?: string;
  image_url?: string;
}

export const adminApi = {
  async getAnalytics(): Promise<AdminAnalytics> {
    const [trends, cities, activities] = await Promise.all([
      apiClient<{
        trips_over_time: { date: string; trips_created: number }[];
        active_users: number;
        total_trips: number;
        total_users: number;
        total_spend: number;
        total_destinations: number;
      }>('/admin/analytics/trends', { method: 'GET' }),
      apiClient<{ city_id: number; name: string; country: string; trip_count: number }[]>(
        '/admin/analytics/cities?limit=10',
        { method: 'GET' }
      ),
      apiClient<{ activity_id: number; name: string; city_id: number; booking_count: number }[]>(
        '/admin/analytics/activities?limit=10',
        { method: 'GET' }
      ),
    ]);
    return mapAdminAnalytics(trends, cities, activities);
  },

  async getUsers(q?: string): Promise<AdminUser[]> {
    const qs = q ? `?q=${encodeURIComponent(q)}` : '';
    const users = await apiClient<(User & { is_suspended?: boolean; trips_count?: number })[]>(
      `/admin/users${qs}`,
      { method: 'GET' }
    );
    return users.map(mapAdminUser);
  },

  async createUser(payload: AdminUserCreatePayload): Promise<AdminUser> {
    const user = await apiClient<User & { is_suspended?: boolean }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapAdminUser(user);
  },

  async updateUser(userId: number, payload: AdminUserUpdatePayload): Promise<AdminUser> {
    const user = await apiClient<User & { is_suspended?: boolean }>(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapAdminUser(user);
  },

  async toggleUserStatus(userId: number, suspended: boolean): Promise<AdminUser> {
    const user = await apiClient<User & { is_suspended?: boolean }>(
      `/admin/users/${userId}/suspend`,
      {
        method: 'POST',
        body: JSON.stringify({ suspended }),
      }
    );
    return mapAdminUser(user);
  },

  async deleteUser(userId: number): Promise<void> {
    await apiClient<void>(`/admin/users/${userId}`, { method: 'DELETE' });
  },

  async getCities(q?: string): Promise<Paginated<City>> {
    const params = new URLSearchParams({ limit: '200' });
    if (q) params.set('q', q);
    return apiClient<Paginated<City>>(`/admin/cities?${params}`, { method: 'GET' });
  },

  async createCity(payload: CityPayload): Promise<City> {
    return apiClient<City>('/admin/cities', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCity(cityId: number, payload: Partial<CityPayload>): Promise<City> {
    return apiClient<City>(`/admin/cities/${cityId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteCity(cityId: number): Promise<void> {
    await apiClient<void>(`/admin/cities/${cityId}`, { method: 'DELETE' });
  },

  async bulkUploadCities(json: unknown): Promise<BulkUploadResult> {
    return apiClient<BulkUploadResult>('/admin/cities/bulk', {
      method: 'POST',
      body: JSON.stringify(json),
    });
  },

  async getActivities(q?: string, cityId?: number): Promise<Paginated<Activity>> {
    const params = new URLSearchParams({ limit: '200' });
    if (q) params.set('q', q);
    if (cityId) params.set('city_id', String(cityId));
    return apiClient<Paginated<Activity>>(`/admin/activities?${params}`, { method: 'GET' });
  },

  async createActivity(payload: ActivityPayload): Promise<Activity> {
    return apiClient<Activity>('/admin/activities', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateActivity(activityId: number, payload: Partial<ActivityPayload>): Promise<Activity> {
    return apiClient<Activity>(`/admin/activities/${activityId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteActivity(activityId: number): Promise<void> {
    await apiClient<void>(`/admin/activities/${activityId}`, { method: 'DELETE' });
  },

  async bulkUploadActivities(json: unknown): Promise<BulkUploadResult> {
    return apiClient<BulkUploadResult>('/admin/activities/bulk', {
      method: 'POST',
      body: JSON.stringify(json),
    });
  },

  async getCommunityPosts(q?: string, includeHidden = true): Promise<AdminCommunityPost[]> {
    const params = new URLSearchParams({ include_hidden: String(includeHidden), limit: '200' });
    if (q) params.set('q', q);
    const rows = await apiClient<AdminCommunityPostRaw[]>(`/admin/community/posts?${params}`, {
      method: 'GET',
    });
    return rows.map(mapAdminCommunityPost);
  },

  async moderateCommunityPost(postId: number, isHidden: boolean): Promise<AdminCommunityPost> {
    const row = await apiClient<AdminCommunityPostRaw>(
      `/admin/community/posts/${postId}/moderate`,
      {
        method: 'PATCH',
        body: JSON.stringify({ is_hidden: isHidden }),
      }
    );
    return mapAdminCommunityPost(row);
  },

  async deleteCommunityPost(postId: number): Promise<void> {
    await apiClient<void>(`/admin/community/posts/${postId}`, { method: 'DELETE' });
  },

  async getTemplates(q?: string, includeInactive = true): Promise<AdminTripTemplate[]> {
    const params = new URLSearchParams({ include_inactive: String(includeInactive) });
    if (q) params.set('q', q);
    const rows = await apiClient<AdminTripTemplateRaw[]>(`/admin/templates?${params}`, {
      method: 'GET',
    });
    return rows.map(mapAdminTripTemplate);
  },

  async createTemplate(payload: AdminTemplateCreatePayload): Promise<AdminTripTemplate> {
    const row = await apiClient<AdminTripTemplateRaw>('/admin/templates', {
      method: 'POST',
      body: JSON.stringify({
        id: payload.id,
        name: payload.name,
        description: payload.description ?? '',
        duration_days: payload.durationDays,
        city_names: payload.cityNames,
        sections: payload.sections,
      }),
    });
    return mapAdminTripTemplate(row);
  },

  async updateTemplate(
    templateId: string,
    payload: AdminTemplateUpdatePayload
  ): Promise<AdminTripTemplate> {
    const body: Record<string, unknown> = {};
    if (payload.name !== undefined) body.name = payload.name;
    if (payload.description !== undefined) body.description = payload.description;
    if (payload.durationDays !== undefined) body.duration_days = payload.durationDays;
    if (payload.cityNames !== undefined) body.city_names = payload.cityNames;
    if (payload.sections !== undefined) body.sections = payload.sections;
    if (payload.isActive !== undefined) body.is_active = payload.isActive;
    const row = await apiClient<AdminTripTemplateRaw>(`/admin/templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return mapAdminTripTemplate(row);
  },

  async deleteTemplate(templateId: string): Promise<void> {
    await apiClient<void>(`/admin/templates/${templateId}`, { method: 'DELETE' });
  },

  async createTemplateFromTrip(
    tripId: number,
    name?: string,
    templateId?: string
  ): Promise<AdminTripTemplate> {
    const row = await apiClient<AdminTripTemplateRaw>(`/admin/templates/from-trip/${tripId}`, {
      method: 'POST',
      body: JSON.stringify({ name, template_id: templateId }),
    });
    return mapAdminTripTemplate(row);
  },

  async createTemplateFromPost(postId: number, name?: string): Promise<AdminTripTemplate> {
    const row = await apiClient<AdminTripTemplateRaw>(`/admin/templates/from-post/${postId}`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return mapAdminTripTemplate(row);
  },
};

interface AdminCommunityPostRaw {
  id: number;
  user_id: number;
  trip_id: number | null;
  content: string;
  image_url: string | null;
  created_at: string;
  comment_count: number;
  is_hidden: boolean;
  author_name: string;
  author_email: string;
  trip: {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    cover_photo_url: string | null;
    status: string;
    public_slug: string | null;
    total_budget: number | null;
  } | null;
}

export interface AdminCommunityPost {
  id: number;
  userId: number;
  tripId: number | null;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  commentCount: number;
  isHidden: boolean;
  authorName: string;
  authorEmail: string;
  trip: AdminCommunityPostRaw['trip'];
}

function mapAdminCommunityPost(row: AdminCommunityPostRaw): AdminCommunityPost {
  return {
    id: row.id,
    userId: row.user_id,
    tripId: row.trip_id,
    content: row.content,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    commentCount: row.comment_count,
    isHidden: row.is_hidden,
    authorName: row.author_name,
    authorEmail: row.author_email,
    trip: row.trip,
  };
}

export interface AdminTemplateSection {
  title: string;
  type: 'travel' | 'stay' | 'activity' | 'other';
  day_offset: number;
  budget: number;
  notes?: string | null;
}

interface AdminTripTemplateRaw {
  id: string;
  name: string;
  description: string;
  duration_days: number;
  city_names: string[];
  sections: AdminTemplateSection[];
  source_trip_id: number | null;
  source_post_id: number | null;
  is_active: boolean;
  created_at: string;
}

export interface AdminTripTemplate {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  cityNames: string[];
  sections: AdminTemplateSection[];
  sourceTripId: number | null;
  sourcePostId: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface AdminTemplateCreatePayload {
  id?: string;
  name: string;
  description?: string;
  durationDays: number;
  cityNames: string[];
  sections: AdminTemplateSection[];
}

export interface AdminTemplateUpdatePayload {
  name?: string;
  description?: string;
  durationDays?: number;
  cityNames?: string[];
  sections?: AdminTemplateSection[];
  isActive?: boolean;
}

function mapAdminTripTemplate(row: AdminTripTemplateRaw): AdminTripTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    durationDays: row.duration_days,
    cityNames: row.city_names,
    sections: row.sections,
    sourceTripId: row.source_trip_id,
    sourcePostId: row.source_post_id,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}
