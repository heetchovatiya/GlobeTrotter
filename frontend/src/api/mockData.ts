import { City, Activity, Trip, ItineraryResponse, CommunityPost, AdminAnalytics, AdminUser, User } from '../types';

export const MOCK_CURRENT_USER: User = {
  id: 1,
  name: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  profile_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  language_pref: 'en',
  phone_number: '+1 (555) 234-5678',
  city: 'San Francisco',
  country: 'United States',
  additional_info: 'Passionate globetrotter, photographer, and foodie exploring cultures around the world.',
  role: 'admin', // Demo as admin for full access to Screen 12
  created_at: '2024-01-15T08:00:00Z',
};

export const MOCK_CITIES: City[] = [
  {
    id: 1,
    name: 'Kyoto',
    country: 'Japan',
    cost_index: 3,
    popularity_score: 98,
    image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80',
    description: 'Ancient temples, sublime bamboo groves, and tranquil Zen rock gardens.',
  },
  {
    id: 2,
    name: 'Interlaken & Swiss Alps',
    country: 'Switzerland',
    cost_index: 5,
    popularity_score: 96,
    image_url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&auto=format&fit=crop&q=80',
    description: 'Spectacular alpine peaks, crystalline glacier lakes, and outdoor adrenaline.',
  },
  {
    id: 3,
    name: 'Barcelona',
    country: 'Spain',
    cost_index: 3,
    popularity_score: 95,
    image_url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&auto=format&fit=crop&q=80',
    description: 'Gothic quarters, surreal Gaudí architecture, tapas bars, and Mediterranean beaches.',
  },
  {
    id: 4,
    name: 'Rome',
    country: 'Italy',
    cost_index: 3,
    popularity_score: 97,
    image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80',
    description: 'The Eternal City with thousands of years of art, ruins, and world-class cuisine.',
  },
  {
    id: 5,
    name: 'Bali',
    country: 'Indonesia',
    cost_index: 2,
    popularity_score: 94,
    image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80',
    description: 'Lush terraced rice paddies, sacred water temples, and world-class surfing beaches.',
  },
  {
    id: 6,
    name: 'Paris',
    country: 'France',
    cost_index: 4,
    popularity_score: 99,
    image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
    description: 'City of light, haute cuisine, iconic art museums, and bohemian street cafes.',
  },
  {
    id: 7,
    name: 'Cape Town',
    country: 'South Africa',
    cost_index: 2,
    popularity_score: 91,
    image_url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&auto=format&fit=crop&q=80',
    description: 'Majestic Table Mountain, penguin colonies, scenic coastal drives, and vineyards.',
  },
  {
    id: 8,
    name: 'Reykjavik',
    country: 'Iceland',
    cost_index: 4,
    popularity_score: 93,
    image_url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&auto=format&fit=crop&q=80',
    description: 'Land of northern lights, geothermal lagoons, black sand beaches, and erupting geysers.',
  },
];

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 101,
    city_id: 1,
    name: 'Fushimi Inari Shrine Sunset Hike',
    type: 'sightseeing',
    cost: 0,
    duration_mins: 150,
    description: 'Walk through thousands of vibrant vermilion torii gates winding up Mount Inari.',
    image_url: 'https://images.unsplash.com/photo-1478436127897-769e00d7c583?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 102,
    city_id: 1,
    name: 'Traditional Tea Ceremony & Matcha Workshop',
    type: 'culture',
    cost: 45,
    duration_mins: 90,
    description: 'Experience authentic Japanese tea etiquette with a master in a centuries-old tea house.',
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 103,
    city_id: 2,
    name: 'Tandem Paragliding over Jungfrau Peaks',
    type: 'adventure',
    cost: 190,
    duration_mins: 120,
    description: 'Glide high over turquoise lakes and dramatic Swiss Alpine peaks with certified pilots.',
    image_url: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 104,
    city_id: 2,
    name: 'Lauterbrunnen Valley Waterfall E-Bike Tour',
    type: 'adventure',
    cost: 65,
    duration_mins: 180,
    description: 'Cycle through the valley of 72 waterfalls with breathtaking glacial backdrops.',
    image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 105,
    city_id: 3,
    name: 'Sagrada Familia Fast-Track Guided Tour',
    type: 'sightseeing',
    cost: 38,
    duration_mins: 120,
    description: 'Marvel at Antoni Gaudí’s uncompleted masterpiece with audio commentary and tower access.',
    image_url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 106,
    city_id: 3,
    name: 'El Born Tapas & Catalan Wine Tasting Crawl',
    type: 'food',
    cost: 75,
    duration_mins: 210,
    description: 'Sample authentic jamón ibérico, patatas bravas, and natural cava with a local culinary guide.',
    image_url: 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 107,
    city_id: 4,
    name: 'Colosseum & Roman Forum VIP Access',
    type: 'sightseeing',
    cost: 55,
    duration_mins: 180,
    description: 'Walk on the gladiator arena floor and discover Roman history without the long lines.',
    image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 108,
    city_id: 5,
    name: 'Mount Batur Sunrise Volcano Trek & Hot Springs',
    type: 'adventure',
    cost: 50,
    duration_mins: 360,
    description: 'Hike to the crater of an active volcano for sunrise followed by thermal hot spring soak.',
    image_url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&auto=format&fit=crop&q=80',
  },
];

export const MOCK_TRIPS: Trip[] = [
  {
    id: 1,
    user_id: 1,
    name: 'Autumn Blossoms & Alpine Peaks',
    start_date: '2026-09-10',
    end_date: '2026-09-22',
    description: 'A 12-day multi-country adventure covering tranquil Japanese shrines and Swiss mountaineering.',
    cover_photo_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80',
    status: 'upcoming',
    is_public: true,
    total_budget: 3500,
    estimated_cost: 3240,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-15T12:00:00Z',
  },
  {
    id: 2,
    user_id: 1,
    name: 'Mediterranean Summer & Tapas Tour',
    start_date: '2026-08-18',
    end_date: '2026-08-28',
    description: 'Sun-soaked coastal beaches, Catalan architecture, and culinary delights in Barcelona.',
    cover_photo_url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&auto=format&fit=crop&q=80',
    status: 'ongoing',
    is_public: true,
    total_budget: 2200,
    estimated_cost: 2150,
    created_at: '2026-07-15T14:30:00Z',
    updated_at: '2026-08-19T09:00:00Z',
  },
  {
    id: 3,
    user_id: 1,
    name: 'Roman Holiday & Eternal Wonders',
    start_date: '2026-05-01',
    end_date: '2026-05-10',
    description: 'Exploring ancient ruins, Vatican museums, and hidden trattorias.',
    cover_photo_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&auto=format&fit=crop&q=80',
    status: 'completed',
    is_public: true,
    total_budget: 1800,
    estimated_cost: 1750,
    created_at: '2026-04-10T11:00:00Z',
    updated_at: '2026-05-11T16:00:00Z',
  },
  {
    id: 4,
    user_id: 1,
    name: 'Tropical Bali Escapade',
    start_date: '2026-02-10',
    end_date: '2026-02-20',
    description: 'Rice terrace walks, temple blessings, and beachfront sunsets in Ubud and Canggu.',
    cover_photo_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&auto=format&fit=crop&q=80',
    status: 'completed',
    is_public: false,
    total_budget: 1600,
    estimated_cost: 1540,
    created_at: '2026-01-05T09:00:00Z',
    updated_at: '2026-02-21T10:00:00Z',
  },
];

export const MOCK_ITINERARY_1: ItineraryResponse = {
  trip: MOCK_TRIPS[0],
  days: [
    {
      date: '2026-09-10',
      day_number: 1,
      city_name: 'Kyoto, Japan',
      total_cost: 320,
      sections: [
        {
          id: 1,
          stop_id: 1,
          title: 'Section 1: Arrive & High-Speed Shinkansen Transfer',
          type: 'travel',
          date_range_start: '2026-09-10',
          date_range_end: '2026-09-10',
          budget: 140,
          notes: 'Take the Haruka Express from Kansai International Airport directly to Kyoto Central Station.',
          order_index: 1,
          activities: [
            {
              id: 1,
              section_id: 1,
              scheduled_date: '2026-09-10',
              scheduled_time: '14:30',
              cost_override: 140,
              custom_label: 'JR Haruka Express Train Ticket',
            }
          ]
        },
        {
          id: 2,
          stop_id: 1,
          title: 'Section 2: Check-in at Machiya Ryokan',
          type: 'stay',
          date_range_start: '2026-09-10',
          date_range_end: '2026-09-13',
          budget: 180,
          notes: 'Traditional wooden townhouse in Gion with tatami mats and hot cedar bath.',
          order_index: 2,
        }
      ]
    },
    {
      date: '2026-09-11',
      day_number: 2,
      city_name: 'Kyoto, Japan',
      total_cost: 160,
      sections: [
        {
          id: 3,
          stop_id: 1,
          title: 'Section 3: Spiritual Kyoto Discovery',
          type: 'activity',
          date_range_start: '2026-09-11',
          date_range_end: '2026-09-11',
          budget: 160,
          notes: 'Visit early morning to avoid crowds at Fushimi Inari and Arashiyama Bamboo Grove.',
          order_index: 3,
          activities: [
            {
              id: 2,
              section_id: 3,
              activity_id: 101,
              scheduled_date: '2026-09-11',
              scheduled_time: '07:30',
              cost_override: 0,
              custom_label: 'Fushimi Inari Torii Gate Sunrise Walk',
              activity: MOCK_ACTIVITIES[0],
            },
            {
              id: 3,
              section_id: 3,
              activity_id: 102,
              scheduled_date: '2026-09-11',
              scheduled_time: '15:00',
              cost_override: 45,
              custom_label: 'Uji Matcha Tea Masterclass',
              activity: MOCK_ACTIVITIES[1],
            }
          ]
        }
      ]
    },
    {
      date: '2026-09-12',
      day_number: 3,
      city_name: 'Kyoto, Japan',
      total_cost: 110,
      sections: [
        {
          id: 4,
          stop_id: 1,
          title: 'Section 4: Nishiki Food Market Tasting & Gion Night Walk',
          type: 'activity',
          date_range_start: '2026-09-12',
          date_range_end: '2026-09-12',
          budget: 110,
          notes: 'Sample skewered wagyu, grilled octopus, and fresh dango mochi.',
          order_index: 4,
        }
      ]
    },
    {
      date: '2026-09-15',
      day_number: 6,
      city_name: 'Interlaken, Switzerland',
      total_cost: 450,
      sections: [
        {
          id: 5,
          stop_id: 2,
          title: 'Section 5: Alpine Paragliding & Glacier Heights',
          type: 'activity',
          date_range_start: '2026-09-15',
          date_range_end: '2026-09-15',
          budget: 450,
          notes: 'High mountain excursion with Jungfraujoch train and tandem flight.',
          order_index: 5,
          activities: [
            {
              id: 4,
              section_id: 5,
              activity_id: 103,
              scheduled_date: '2026-09-15',
              scheduled_time: '10:00',
              cost_override: 190,
              custom_label: 'Tandem Paragliding over Jungfrau Peaks',
              activity: MOCK_ACTIVITIES[2],
            }
          ]
        }
      ]
    }
  ],
  budget: {
    total_budget: 3500,
    total_spent: 3240,
    remaining_budget: 260,
    itinerary_stay: 1250,
    itinerary_transport: 890,
    itinerary_activities: 620,
    itinerary_total: 2760,
    general_spent: 740,
    grand_total: 3500,
    by_category: [
      { category: 'stay', amount: 1250, percentage: 38.5, color: '#0d9488' },
      { category: 'transport', amount: 890, percentage: 27.5, color: '#3b82f6' },
      { category: 'activities', amount: 620, percentage: 19.1, color: '#f59e0b' },
      { category: 'meals', amount: 380, percentage: 11.7, color: '#ec4899' },
      { category: 'other', amount: 100, percentage: 3.2, color: '#8b5cf6' },
    ],
    by_day: [
      { date: '2026-09-10', day_label: 'Day 1', budget: 300, actual: 320, is_overbudget: true },
      { date: '2026-09-11', day_label: 'Day 2', budget: 200, actual: 160, is_overbudget: false },
      { date: '2026-09-12', day_label: 'Day 3', budget: 150, actual: 110, is_overbudget: false },
      { date: '2026-09-13', day_label: 'Day 4', budget: 250, actual: 230, is_overbudget: false },
      { date: '2026-09-14', day_label: 'Day 5', budget: 350, actual: 340, is_overbudget: false },
      { date: '2026-09-15', day_label: 'Day 6', budget: 400, actual: 450, is_overbudget: true },
    ],
    overbudget_days: ['2026-09-10', '2026-09-15'],
  }
};

export const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 1,
    user_id: 2,
    content: 'Just returned from an unforgettable 10 days traversing Switzerland! If you go to Lauterbrunnen, do not miss the e-bike trail down the waterfall valley — magical morning light.',
    image_url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1000&auto=format&fit=crop&q=80',
    created_at: '2026-08-20T14:20:00Z',
    likes_count: 42,
    is_liked: false,
    user: {
      id: 2,
      name: 'Elena Rostova',
      city: 'Prague',
      country: 'Czech Republic',
      profile_photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    },
    trip: {
      id: 101,
      name: 'Swiss Alpine Expedition',
      start_date: '2026-08-05',
      end_date: '2026-08-15',
      status: 'completed',
      cover_photo_url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&auto=format&fit=crop&q=80',
    },
    comments: [
      {
        id: 1,
        post_id: 1,
        user_id: 1,
        content: 'Looks breathtaking! Adding this to my upcoming September trip.',
        created_at: '2026-08-20T16:00:00Z',
        user: {
          id: 1,
          name: 'Alex Morgan',
          profile_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        }
      }
    ]
  },
  {
    id: 2,
    user_id: 3,
    content: 'Sunset over Fushimi Inari Shrine in Kyoto. Hiking all the way up the mountain after 5 PM means zero tour buses and total serenity.',
    image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&auto=format&fit=crop&q=80',
    created_at: '2026-08-18T09:15:00Z',
    likes_count: 89,
    is_liked: true,
    user: {
      id: 3,
      name: 'Kenji Sato',
      city: 'Tokyo',
      country: 'Japan',
      profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    },
    comments: []
  }
];

export const MOCK_ADMIN_ANALYTICS: AdminAnalytics = {
  total_users: 1420,
  active_users: 890,
  total_trips: 3480,
  total_destinations: 45,
  total_spend: 1854000,
  popular_cities: [
    { id: 1, name: 'Kyoto', country: 'Japan', trips_count: 520, popularity_score: 98, image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&auto=format&fit=crop&q=80' },
    { id: 2, name: 'Interlaken', country: 'Switzerland', trips_count: 480, popularity_score: 96, image_url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=400&auto=format&fit=crop&q=80' },
    { id: 4, name: 'Rome', country: 'Italy', trips_count: 440, popularity_score: 97, image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&auto=format&fit=crop&q=80' },
    { id: 3, name: 'Barcelona', country: 'Spain', trips_count: 410, popularity_score: 95, image_url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&auto=format&fit=crop&q=80' },
    { id: 6, name: 'Paris', country: 'France', trips_count: 390, popularity_score: 99, image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&auto=format&fit=crop&q=80' },
  ],
  popular_activities: [
    { id: 103, name: 'Tandem Paragliding over Jungfrau', type: 'adventure', bookings_count: 310, city_name: 'Interlaken' },
    { id: 101, name: 'Fushimi Inari Shrine Hike', type: 'sightseeing', bookings_count: 295, city_name: 'Kyoto' },
    { id: 105, name: 'Sagrada Familia Guided Tour', type: 'sightseeing', bookings_count: 270, city_name: 'Barcelona' },
    { id: 107, name: 'Colosseum VIP Arena Access', type: 'sightseeing', bookings_count: 260, city_name: 'Rome' },
    { id: 106, name: 'Tapas & Catalan Wine Tasting', type: 'food', bookings_count: 210, city_name: 'Barcelona' },
  ],
  trip_trends: [
    { month: 'Mar', trips: 180, users: 420 },
    { month: 'Apr', trips: 240, users: 510 },
    { month: 'May', trips: 310, users: 650 },
    { month: 'Jun', trips: 420, users: 780 },
    { month: 'Jul', trips: 580, users: 890 },
    { month: 'Aug', trips: 640, users: 950 },
  ]
};

export const MOCK_ADMIN_USERS: AdminUser[] = [
  { ...MOCK_CURRENT_USER, trips_count: 4, is_active: true },
  {
    id: 2,
    name: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    profile_photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    city: 'Prague',
    country: 'Czech Republic',
    role: 'user',
    trips_count: 6,
    is_active: true,
    created_at: '2024-02-10T10:00:00Z',
  },
  {
    id: 3,
    name: 'Kenji Sato',
    email: 'kenji.sato@example.com',
    profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    city: 'Tokyo',
    country: 'Japan',
    role: 'user',
    trips_count: 3,
    is_active: true,
    created_at: '2024-03-01T15:00:00Z',
  },
  {
    id: 4,
    name: 'Marcus Vance',
    email: 'marcus.vance@example.com',
    profile_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    city: 'London',
    country: 'United Kingdom',
    role: 'user',
    trips_count: 2,
    is_active: false,
    created_at: '2024-04-12T08:30:00Z',
  },
];

