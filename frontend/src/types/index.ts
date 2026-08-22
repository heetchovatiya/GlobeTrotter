export type UserRole = 'user' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  profile_photo_url?: string;
  language_pref?: string;
  phone_number?: string;
  city?: string;
  country?: string;
  additional_info?: string;
  role: UserRole;
  created_at: string;
}

export type TripStatus = 'planning' | 'ongoing' | 'upcoming' | 'completed';

export interface City {
  id: number;
  name: string;
  country: string;
  cost_index: number; // 1-5 scale or monetary index
  popularity_score: number; // 1-100
  image_url: string;
  description?: string;
}

export type ActivityType = 'sightseeing' | 'food' | 'adventure' | 'culture' | 'nightlife';

export interface Activity {
  id: number;
  city_id: number;
  name: string;
  type: ActivityType;
  cost: number;
  duration_mins: number;
  description: string;
  image_url: string;
  city?: City;
}

export type SectionType = 'travel' | 'stay' | 'activity' | 'other';

export interface TripActivity {
  id: number;
  section_id: number;
  activity_id?: number;
  scheduled_date: string;
  scheduled_time?: string;
  cost_override?: number;
  custom_label?: string;
  activity?: Activity;
}

export interface TripSection {
  id: number;
  stop_id: number;
  title: string;
  type: SectionType;
  date_range_start: string;
  date_range_end: string;
  budget: number;
  notes?: string;
  order_index: number;
  activities?: TripActivity[];
}

export interface Stop {
  id: number;
  trip_id: number;
  city_id: number;
  order_index: number;
  arrival_date: string;
  departure_date: string;
  city?: City;
  sections?: TripSection[];
}

export interface Trip {
  id: number;
  user_id: number;
  name: string;
  start_date: string;
  end_date: string;
  description?: string;
  cover_photo_url?: string;
  status: TripStatus;
  is_public: boolean;
  total_budget?: number;
  estimated_cost?: number;
  created_at: string;
  updated_at: string;
  stops?: Stop[];
}

export type ExpenseCategory = 'transport' | 'stay' | 'activities' | 'meals' | 'other';

export interface Expense {
  id: number;
  trip_id: number;
  category: ExpenseCategory;
  amount: number;
  section_id?: number;
  date?: string;
  note?: string;
}

export interface CategoryExpense {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  color?: string;
}

export interface DayBudget {
  date: string;
  day_label: string;
  budget: number;
  actual: number;
  is_overbudget: boolean;
}

export interface BudgetSummary {
  total_budget: number;
  total_spent: number;
  remaining_budget: number;
  by_category: CategoryExpense[];
  by_day: DayBudget[];
  overbudget_days: string[];
}

export interface ItineraryDay {
  date: string;
  day_number: number;
  city_name?: string;
  sections: TripSection[];
  total_cost: number;
}

export interface ItineraryResponse {
  trip: Trip;
  days: ItineraryDay[];
  budget: BudgetSummary;
}

export interface CommunityComment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    profile_photo_url?: string;
  };
}

export interface CommunityPost {
  id: number;
  user_id: number;
  trip_id?: number;
  content: string;
  image_url?: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    city?: string;
    country?: string;
    profile_photo_url?: string;
  };
  trip?: {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    cover_photo_url?: string;
    status: TripStatus;
  };
  likes_count: number;
  is_liked?: boolean;
  comments: CommunityComment[];
}

export interface SharedTrip {
  id: number;
  trip_id: number;
  public_slug: string;
  created_at: string;
  trip: Trip;
  days: ItineraryDay[];
  budget: BudgetSummary;
}

export interface AdminAnalytics {
  total_users: number;
  active_users: number;
  total_trips: number;
  total_destinations: number;
  total_spend: number;
  popular_cities: {
    id: number;
    name: string;
    country: string;
    trips_count: number;
    popularity_score: number;
    image_url: string;
  }[];
  popular_activities: {
    id: number;
    name: string;
    type: ActivityType;
    bookings_count: number;
    city_name: string;
  }[];
  trip_trends: {
    month: string;
    trips: number;
    users: number;
  }[];
}

export interface AdminUser extends User {
  trips_count: number;
  is_active: boolean;
}

