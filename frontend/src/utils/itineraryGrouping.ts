import { ItineraryDay, City, TripSection } from '../types';
import { DEFAULT_ACTIVITY_IMAGE, DEFAULT_CITY_IMAGE } from '../constants/images';

export interface ItineraryCityBlock {
  cityId?: number;
  cityName: string;
  cityImageUrl: string;
  country?: string;
  days: ItineraryDay[];
  totalCost: number;
}

export function groupDaysByCity(days: ItineraryDay[], cities: City[]): ItineraryCityBlock[] {
  const catalog = new Map(cities.map((c) => [c.id, c]));
  const blocks: ItineraryCityBlock[] = [];
  let current: ItineraryCityBlock | null = null;

  for (const day of days) {
    const city = day.city_id ? catalog.get(day.city_id) : undefined;
    const cityName = day.city_name || city?.name || 'Destination';
    const sameCity =
      current &&
      ((day.city_id && current.cityId === day.city_id) ||
        (!day.city_id && current.cityName === cityName));

    if (!sameCity) {
      current = {
        cityId: day.city_id ?? city?.id,
        cityName,
        cityImageUrl: city?.image_url || DEFAULT_CITY_IMAGE,
        country: city?.country,
        days: [],
        totalCost: 0,
      };
      blocks.push(current);
    }

    current!.days.push(day);
    current!.totalCost += day.total_cost;
  }

  return blocks;
}

export function resolveSectionImage(section: TripSection, cityImageUrl?: string): string {
  const linked = section.activities?.find((a) => a.activity?.image_url)?.activity?.image_url;
  if (linked) return linked;
  if (section.type === 'stay') return cityImageUrl || DEFAULT_CITY_IMAGE;
  return cityImageUrl || DEFAULT_ACTIVITY_IMAGE;
}

export function resolveDayHeroImage(day: ItineraryDay, cityImageUrl?: string): string {
  for (const section of day.sections) {
    const img = resolveSectionImage(section, cityImageUrl);
    if (img !== DEFAULT_ACTIVITY_IMAGE && img !== DEFAULT_CITY_IMAGE) return img;
  }
  if (day.sections.length > 0) {
    return resolveSectionImage(day.sections[0], cityImageUrl);
  }
  return cityImageUrl || DEFAULT_CITY_IMAGE;
}
