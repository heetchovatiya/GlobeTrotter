/** Build Search page URLs with activities tab + city filter. */
export function cityActivitiesUrl(cityId: number | string): string {
  const params = new URLSearchParams({
    tab: 'activities',
    city_id: String(cityId),
  });
  return `/search?${params.toString()}`;
}

export function parseSearchPageParams(searchParams: URLSearchParams) {
  const cityId = searchParams.get('city_id') || 'all';
  const tabParam = searchParams.get('tab');
  const activeTab =
    cityId !== 'all' ? 'activities' : tabParam === 'cities' ? 'cities' : 'activities';

  return {
    cityId,
    activeTab: activeTab as 'activities' | 'cities',
    query: searchParams.get('q') || '',
    type: searchParams.get('type') || 'all',
  };
}

export function buildSearchParams(input: {
  tab?: 'activities' | 'cities';
  cityId?: string;
  q?: string;
  type?: string;
}) {
  const params = new URLSearchParams();
  if (input.tab) params.set('tab', input.tab);
  if (input.cityId && input.cityId !== 'all') params.set('city_id', input.cityId);
  if (input.q) params.set('q', input.q);
  if (input.type && input.type !== 'all') params.set('type', input.type);
  return params;
}
