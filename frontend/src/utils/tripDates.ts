import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

export interface StopDateSegment {
  arrival_date: string;
  departure_date: string;
}

/** Split a trip date range evenly across N stops. */
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
  const segmentDays = Math.max(1, Math.floor(totalDays / stopCount));

  const segments: StopDateSegment[] = [];
  let cursor = start;

  for (let i = 0; i < stopCount; i++) {
    const isLast = i === stopCount - 1;
    const segEnd = isLast ? end : addDays(cursor, segmentDays - 1);
    segments.push({
      arrival_date: format(cursor, 'yyyy-MM-dd'),
      departure_date: format(segEnd, 'yyyy-MM-dd'),
    });
    cursor = addDays(segEnd, 1);
  }

  return segments;
}
