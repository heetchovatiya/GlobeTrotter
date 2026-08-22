import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

export interface StopDateSegment {
  arrival_date: string;
  departure_date: string;
}

export function splitTripDatesForStops(
  startDate: string,
  endDate: string,
  stopCount: number
): StopDateSegment[] {
  if (stopCount <= 1) {
    return [{ arrival_date: startDate, departure_date: endDate }];
  }

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const totalDays = differenceInCalendarDays(end, start) + 1;
  const daysPerCity = defaultDaysEvenSplit(totalDays, stopCount);
  let cursor = start;

  const segments: StopDateSegment[] = [];
  for (let i = 0; i < stopCount; i++) {
    const segDays = daysPerCity[i] ?? 1;
    const segEnd = addDays(cursor, segDays - 1);
    const departure = segEnd > end ? end : segEnd;
    segments.push({
      arrival_date: format(cursor, 'yyyy-MM-dd'),
      departure_date: format(departure, 'yyyy-MM-dd'),
    });
    cursor = addDays(departure, 1);
  }

  return segments;
}

function defaultDaysEvenSplit(totalDays: number, cityCount: number): number[] {
  if (cityCount <= 0) return [];
  const base = Math.floor(totalDays / cityCount);
  const remainder = totalDays % cityCount;
  return Array.from({ length: cityCount }, (_, i) => Math.max(base + (i < remainder ? 1 : 0), 1));
}
