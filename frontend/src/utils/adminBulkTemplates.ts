/** Sample JSON templates for admin bulk upload. */
export const BULK_CITIES_TEMPLATE = {
  cities: [
    {
      name: 'Jaipur',
      country: 'India',
      cost_index: 45,
      popularity_score: 82,
      image_url: 'https://example.com/jaipur.jpg',
      activities: [
        {
          name: 'Amber Fort Tour',
          type: 'sightseeing',
          cost: 25,
          duration_mins: 180,
          description: 'Guided tour of the historic fort',
          image_url: 'https://example.com/amber-fort.jpg',
        },
      ],
    },
  ],
};

export const BULK_ACTIVITIES_TEMPLATE = {
  activities: [
    {
      city_id: 1,
      name: 'Sunset Boat Ride',
      type: 'sightseeing',
      cost: 35,
      duration_mins: 90,
      description: 'Evening cruise with city views',
      image_url: 'https://example.com/boat.jpg',
    },
    {
      city_name: 'Jaipur',
      country: 'India',
      name: 'Street Food Walk',
      type: 'food',
      cost: 20,
      duration_mins: 120,
      description: 'Local food tasting tour',
    },
  ],
};

export const ACTIVITY_TYPES = [
  'sightseeing',
  'food',
  'adventure',
  'culture',
  'nightlife',
] as const;

export const MANUAL_TEMPLATE_SAMPLE = {
  templates: [
    {
      id: 'rajasthan-heritage',
      name: 'Rajasthan Heritage',
      description: '5-day Jaipur and Udaipur palace circuit.',
      duration_days: 5,
      city_names: ['Jaipur', 'Udaipur'],
      sections: [
        {
          title: 'Jaipur arrival',
          type: 'travel',
          day_offset: 0,
          budget: 120,
          notes: 'Check in near City Palace',
        },
        {
          title: 'Amber Fort & bazaars',
          type: 'activity',
          day_offset: 1,
          budget: 75,
        },
        {
          title: 'Travel to Udaipur',
          type: 'travel',
          day_offset: 2,
          budget: 90,
        },
        {
          title: 'Lake Pichola & City Palace',
          type: 'activity',
          day_offset: 3,
          budget: 85,
        },
        {
          title: 'Departure',
          type: 'travel',
          day_offset: 4,
          budget: 60,
        },
      ],
    },
  ],
  sections: [
    {
      title: 'Arrival day',
      type: 'travel',
      day_offset: 0,
      budget: 100,
    },
    {
      title: 'City exploration',
      type: 'activity',
      day_offset: 1,
      budget: 80,
    },
  ],
};
