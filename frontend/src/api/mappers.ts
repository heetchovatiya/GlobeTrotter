import {
  Activity,
  AdminAnalytics,
  AdminUser,
  BudgetSummary,
  CategoryExpense,
  City,
  CommunityComment,
  CommunityPost,
  DayBudget,
  ExpenseCategory,
  ItineraryDay,
  ItineraryResponse,
  SharedTrip,
  Trip,
  TripSection,
  TripStatus,
  User,
} from '../types';

const DEFAULT_CITY_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80';
const DEFAULT_ACTIVITY_IMAGE =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80';
const DEFAULT_COVER_IMAGE =
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80';

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  transport: '#3b82f6',
  stay: '#8b5cf6',
  activities: '#10b981',
  meals: '#f59e0b',
  other: '#64748b',
};

type BackendTrip = {
  id: number;
  user_id: number;
  name: string;
  start_date: string;
  end_date: string;
  description?: string | null;
  cover_photo_url?: string | null;
  status: TripStatus;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
};

type BackendItinerary = {
  trip_id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: TripStatus;
  days: {
    date: string;
    sections: Array<{
      id: number;
      stop_id: number;
      city_id: number;
      city_name?: string | null;
      title: string;
      type: TripSection['type'];
      date_range_start?: string | null;
      date_range_end?: string | null;
      budget?: number | null;
      notes?: string | null;
      order_index: number;
      activities?: TripSection['activities'];
    }>;
  }[];
};

type BackendBudget = {
  trip_id: number;
  by_category: { category: ExpenseCategory; total: number }[];
  by_day: { date: string; estimated: number; actual: number }[];
  overbudget_days: string[];
};

type BackendCommunityPost = {
  id: number;
  user_id: number;
  trip_id?: number | null;
  content: string;
  image_url?: string | null;
  created_at: string;
  comment_count?: number;
  comments?: {
    id: number;
    post_id: number;
    user_id: number;
    content: string;
    created_at: string;
  }[];
};

export function mapCity(raw: Partial<City>): City {
  return {
    id: raw.id!,
    name: raw.name!,
    country: raw.country!,
    cost_index: Number(raw.cost_index ?? 0),
    popularity_score: Number(raw.popularity_score ?? 0),
    image_url: raw.image_url || DEFAULT_CITY_IMAGE,
    description: raw.description,
  };
}

export function mapActivity(raw: Partial<Activity>): Activity {
  return {
    id: raw.id!,
    city_id: raw.city_id!,
    name: raw.name!,
    type: raw.type!,
    cost: Number(raw.cost ?? 0),
    duration_mins: Number(raw.duration_mins ?? 60),
    description: raw.description || '',
    image_url: raw.image_url || DEFAULT_ACTIVITY_IMAGE,
    city: raw.city ? mapCity(raw.city) : undefined,
  };
}

export function mapTrip(raw: BackendTrip): Trip {
  return {
    id: raw.id,
    user_id: raw.user_id,
    name: raw.name,
    start_date: raw.start_date,
    end_date: raw.end_date,
    description: raw.description ?? undefined,
    cover_photo_url: raw.cover_photo_url || DEFAULT_COVER_IMAGE,
    status: raw.status,
    is_public: raw.is_public,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || raw.created_at || new Date().toISOString(),
  };
}

export function mapUser(raw: Partial<User>): User {
  return {
    id: raw.id!,
    name: raw.name!,
    email: raw.email!,
    profile_photo_url: raw.profile_photo_url ?? undefined,
    language_pref: raw.language_pref ?? undefined,
    phone_number: raw.phone_number ?? undefined,
    city: raw.city ?? undefined,
    country: raw.country ?? undefined,
    role: raw.role || 'user',
    created_at: raw.created_at || new Date().toISOString(),
  };
}

export function mapBudget(raw: BackendBudget): BudgetSummary {
  const totalSpent = raw.by_category.reduce((sum, row) => sum + row.total, 0);
  const totalBudget = raw.by_day.reduce((sum, row) => sum + row.estimated, 0);
  const byCategory: CategoryExpense[] = raw.by_category.map((row) => ({
    category: row.category,
    amount: row.total,
    percentage: totalSpent > 0 ? Math.round((row.total / totalSpent) * 100) : 0,
    color: CATEGORY_COLORS[row.category],
  }));
  const byDay: DayBudget[] = raw.by_day.map((row) => ({
    date: row.date,
    day_label: new Date(row.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    budget: row.estimated,
    actual: row.actual,
    is_overbudget: row.actual > row.estimated,
  }));
  return {
    total_budget: totalBudget,
    total_spent: totalSpent,
    remaining_budget: Math.max(totalBudget - totalSpent, 0),
    by_category: byCategory,
    by_day: byDay,
    overbudget_days: raw.overbudget_days,
  };
}

export function mapItineraryDays(raw: BackendItinerary['days']): ItineraryDay[] {
  return raw.map((day, index) => {
    const sections: TripSection[] = day.sections.map((section) => ({
      id: section.id,
      stop_id: section.stop_id,
      title: section.title,
      type: section.type,
      date_range_start: section.date_range_start || day.date,
      date_range_end: section.date_range_end || section.date_range_start || day.date,
      budget: Number(section.budget ?? 0),
      notes: section.notes ?? undefined,
      order_index: section.order_index,
      activities: section.activities,
    }));
    const totalCost = sections.reduce((sum, s) => sum + (Number(s.budget) || 0), 0);
    return {
      date: day.date,
      day_number: index + 1,
      city_name: day.sections[0]?.city_name ?? undefined,
      sections,
      total_cost: totalCost,
    };
  });
}

export function flattenSections(days: ItineraryDay[]): TripSection[] {
  const seen = new Map<number, TripSection>();
  for (const day of days) {
    for (const section of day.sections) {
      if (!seen.has(section.id)) {
        seen.set(section.id, section);
      }
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.order_index - b.order_index);
}

export function mapItineraryResponse(
  itinerary: BackendItinerary,
  budget: BackendBudget,
  tripMeta?: Partial<Trip>
): ItineraryResponse {
  const days = mapItineraryDays(itinerary.days);
  const trip = mapTrip({
    id: itinerary.trip_id,
    user_id: tripMeta?.user_id ?? 0,
    name: itinerary.name,
    start_date: itinerary.start_date,
    end_date: itinerary.end_date,
    status: itinerary.status,
    is_public: tripMeta?.is_public ?? false,
    description: tripMeta?.description,
    cover_photo_url: tripMeta?.cover_photo_url,
    created_at: tripMeta?.created_at,
    updated_at: tripMeta?.updated_at,
  });
  return {
    trip,
    days,
    budget: mapBudget(budget),
  };
}

export function mapSharedTrip(
  slug: string,
  itinerary: BackendItinerary,
  budget: BackendBudget
): SharedTrip {
  const mapped = mapItineraryResponse(itinerary, budget);
  return {
    id: itinerary.trip_id,
    trip_id: itinerary.trip_id,
    public_slug: slug,
    created_at: new Date().toISOString(),
    trip: mapped.trip,
    days: mapped.days,
    budget: mapped.budget,
  };
}

function displayUser(userId: number, knownUsers?: Map<number, User>): CommunityPost['user'] {
  const known = knownUsers?.get(userId);
  return {
    id: userId,
    name: known?.name || `Traveler #${userId}`,
    city: known?.city,
    country: known?.country,
    profile_photo_url: known?.profile_photo_url,
  };
}

export function mapCommunityPost(
  raw: BackendCommunityPost,
  knownUsers?: Map<number, User>,
  linkedTrip?: Trip
): CommunityPost {
  const comments: CommunityComment[] = (raw.comments || []).map((comment) => ({
    id: comment.id,
    post_id: comment.post_id,
    user_id: comment.user_id,
    content: comment.content,
    created_at: comment.created_at,
    user: displayUser(comment.user_id, knownUsers),
  }));
  return {
    id: raw.id,
    user_id: raw.user_id,
    trip_id: raw.trip_id ?? undefined,
    content: raw.content,
    image_url: raw.image_url ?? undefined,
    created_at: raw.created_at,
    user: displayUser(raw.user_id, knownUsers),
    trip: linkedTrip
      ? {
          id: linkedTrip.id,
          name: linkedTrip.name,
          start_date: linkedTrip.start_date,
          end_date: linkedTrip.end_date,
          cover_photo_url: linkedTrip.cover_photo_url,
          status: linkedTrip.status,
        }
      : undefined,
    likes_count: raw.comment_count ?? comments.length,
    is_liked: false,
    comments,
  };
}

export function mapAdminUser(raw: User & { is_suspended?: boolean }): AdminUser {
  return {
    ...mapUser(raw),
    trips_count: 0,
    is_active: !raw.is_suspended,
  };
}

export function mapAdminAnalytics(
  trends: {
    trips_over_time: { date: string; trips_created: number }[];
    active_users: number;
    total_trips: number;
    total_users: number;
  },
  cities: { city_id: number; name: string; country: string; trip_count: number }[],
  activities: { activity_id: number; name: string; city_id: number; booking_count: number }[]
): AdminAnalytics {
  return {
    total_users: trends.total_users,
    active_users: trends.active_users,
    total_trips: trends.total_trips,
    total_destinations: cities.length,
    total_spend: 0,
    popular_cities: cities.map((city) => ({
      id: city.city_id,
      name: city.name,
      country: city.country,
      trips_count: city.trip_count,
      popularity_score: city.trip_count,
      image_url: DEFAULT_CITY_IMAGE,
    })),
    popular_activities: activities.map((activity) => ({
      id: activity.activity_id,
      name: activity.name,
      type: 'sightseeing',
      bookings_count: activity.booking_count,
      city_name: `City #${activity.city_id}`,
    })),
    trip_trends: trends.trips_over_time.map((point) => ({
      month: point.date.slice(0, 7),
      trips: point.trips_created,
      users: trends.active_users,
    })),
  };
}
