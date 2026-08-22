import { addDays, eachDayOfInterval, format, parseISO } from 'date-fns';
import { Activity } from '../types';

const MAX_MINUTES_PER_DAY = 420;
const BUFFER_MINUTES = 30;
const DAY_START_HOUR = 9;

export interface CityStopWindow {
  cityId: number;
  arrivalDate: string;
  departureDate: string;
}

export interface ScheduledActivity {
  date: string;
  cityId: number;
  activity: Activity;
  startTime: string;
  orderIndex: number;
}

function enumerateDates(start: string, end: string): string[] {
  return eachDayOfInterval({
    start: parseISO(start),
    end: parseISO(end),
  }).map((d) => format(d, 'yyyy-MM-dd'));
}

function formatTimeFromMinutes(minutesFromStart: number): string {
  const total = DAY_START_HOUR * 60 + minutesFromStart;
  const hours = Math.floor(total / 60) % 24;
  const mins = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/** Pick activities that fit within the city's day budget. */
export function suggestActivitiesForCity(activities: Activity[], numDays: number): Activity[] {
  if (numDays <= 0 || activities.length === 0) return [];

  const sorted = [...activities].sort((a, b) => a.duration_mins - b.duration_mins);
  const picked: Activity[] = [];
  let dayIndex = 0;
  let minutesUsed = 0;

  for (const activity of sorted) {
    if (dayIndex >= numDays) break;
    if (minutesUsed + activity.duration_mins > MAX_MINUTES_PER_DAY) {
      dayIndex += 1;
      minutesUsed = 0;
      if (dayIndex >= numDays) break;
    }
    picked.push(activity);
    minutesUsed += activity.duration_mins + BUFFER_MINUTES;
  }

  return picked;
}

/** Allocate selected/suggested activities across daily time slots per city stop. */
export function buildActivitySchedule(
  stops: CityStopWindow[],
  activitiesByCity: Map<number, Activity[]>
): ScheduledActivity[] {
  const schedule: ScheduledActivity[] = [];
  let orderIndex = 1;

  for (const stop of stops) {
    const cityDays = enumerateDates(stop.arrivalDate, stop.departureDate);
    const activities = activitiesByCity.get(stop.cityId) || [];
    let dayIndex = 0;
    let minutesUsed = 0;

    for (const activity of activities) {
      if (dayIndex >= cityDays.length) break;

      if (minutesUsed + activity.duration_mins > MAX_MINUTES_PER_DAY) {
        dayIndex += 1;
        minutesUsed = 0;
        if (dayIndex >= cityDays.length) break;
      }

      schedule.push({
        date: cityDays[dayIndex],
        cityId: stop.cityId,
        activity,
        startTime: formatTimeFromMinutes(minutesUsed),
        orderIndex: orderIndex++,
      });

      minutesUsed += activity.duration_mins + BUFFER_MINUTES;
    }
  }

  return schedule;
}

/** Evenly split total trip days across cities (minimum 1 day each). */
export function defaultDaysPerCity(totalDays: number, cityCount: number): number[] {
  if (cityCount <= 0) return [];
  if (totalDays <= cityCount) {
    return Array.from({ length: cityCount }, (_, i) => (i < totalDays ? 1 : 0));
  }

  const base = Math.floor(totalDays / cityCount);
  const remainder = totalDays % cityCount;
  return Array.from({ length: cityCount }, (_, i) => base + (i < remainder ? 1 : 0));
}

export function buildCityDaysMap(cityIds: number[], totalDays: number): Record<number, number> {
  const distributed = defaultDaysPerCity(totalDays, cityIds.length);
  const next: Record<number, number> = {};
  cityIds.forEach((id, index) => {
    next[id] = distributed[index] ?? 0;
  });
  return next;
}

export function cityDaysMapsEqual(
  current: Record<number, number>,
  cityIds: number[],
  next: Record<number, number>
): boolean {
  return cityIds.every((id) => (current[id] || 0) === (next[id] || 0));
}

export function splitTripDatesByCityDays(
  startDate: string,
  daysPerCity: number[]
): { arrival_date: string; departure_date: string }[] {
  let cursor = parseISO(startDate);
  return daysPerCity.map((days) => {
    const safeDays = Math.max(days, 1);
    const arrival = cursor;
    const departure = addDays(arrival, safeDays - 1);
    cursor = addDays(departure, 1);
    return {
      arrival_date: format(arrival, 'yyyy-MM-dd'),
      departure_date: format(departure, 'yyyy-MM-dd'),
    };
  });
}
