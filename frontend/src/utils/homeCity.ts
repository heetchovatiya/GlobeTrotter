import { User, City } from '../types';

/** Resolve the user's home city id from profile (home_city_id or legacy city name). */
export function resolveUserHomeCityId(user: User | null, cities: City[]): number | undefined {
  if (!user) return undefined;

  if (user.home_city_id && cities.some((c) => c.id === user.home_city_id)) {
    return user.home_city_id;
  }

  if (user.city) {
    const normalized = user.city.trim().toLowerCase();
    const match = cities.find((c) => c.name.trim().toLowerCase() === normalized);
    if (match) return match.id;
  }

  return undefined;
}

/** Pick a destination city for the route picker (not already in the route). */
export function defaultDestinationPickerId(cities: City[], routeCityIds: number[]): number {
  const inRoute = new Set(routeCityIds);
  const next = cities.find((c) => !inRoute.has(c.id));
  return next?.id ?? cities[0]?.id ?? 0;
}
