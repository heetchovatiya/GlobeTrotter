import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { Stop } from '../types';

export function sortedStopsByOrder(stops: Stop[]): Stop[] {
  return [...stops].sort((a, b) => a.order_index - b.order_index);
}

export function stayDayCount(arrival: string, departure: string): number {
  if (!arrival || !departure || departure < arrival) return 1;
  return differenceInCalendarDays(parseISO(departure), parseISO(arrival)) + 1;
}

/** Default dates when appending a new stop after existing ones. */
export function defaultDatesForNewStop(
  existingStops: Stop[],
  tripStart: string,
  tripEnd: string
): { arrival_date: string; departure_date: string } {
  const sorted = sortedStopsByOrder(existingStops);
  if (sorted.length === 0) {
    return { arrival_date: tripStart, departure_date: tripEnd };
  }

  const last = sorted[sorted.length - 1];
  const arrival_date = last.departure_date || tripStart;
  const safeArrival = arrival_date > tripEnd ? tripEnd : arrival_date < tripStart ? tripStart : arrival_date;

  return {
    arrival_date: safeArrival,
    departure_date: safeArrival > tripEnd ? tripEnd : tripEnd,
  };
}

/** Ensure each stop starts when the previous one ends; preserve stay length where possible. */
export function normalizeStopDatesForSequence(
  stops: Stop[],
  tripStart: string,
  tripEnd: string
): Stop[] {
  const sorted = sortedStopsByOrder(stops).map((s) => ({ ...s }));
  if (sorted.length === 0) return sorted;

  for (let i = 0; i < sorted.length; i++) {
    const stop = sorted[i];
    const nights = stayDayCount(stop.arrival_date, stop.departure_date);

    if (i === 0) {
      if (!stop.arrival_date || stop.arrival_date < tripStart) {
        stop.arrival_date = tripStart;
      }
    } else {
      stop.arrival_date = sorted[i - 1].departure_date;
    }

    let departure = format(addDays(parseISO(stop.arrival_date), nights - 1), 'yyyy-MM-dd');
    if (departure > tripEnd) departure = tripEnd;
    if (departure < stop.arrival_date) departure = stop.arrival_date;
    stop.departure_date = departure;
  }

  return sorted;
}

export function validateStopSequence(
  stops: Stop[],
  tripStart?: string,
  tripEnd?: string
): string | null {
  const sorted = sortedStopsByOrder(stops);

  for (let i = 0; i < sorted.length; i++) {
    const stop = sorted[i];
    const label = `Stop ${i + 1}`;

    if (!stop.arrival_date || !stop.departure_date) {
      return `${label}: arrival and departure dates are required.`;
    }
    if (stop.departure_date < stop.arrival_date) {
      return `${label}: departure must be on or after arrival.`;
    }
    if (tripStart && stop.arrival_date < tripStart) {
      return `${label}: arrival cannot be before the trip start (${tripStart}).`;
    }
    if (tripEnd && stop.departure_date > tripEnd) {
      return `${label}: departure cannot be after the trip end (${tripEnd}).`;
    }

    if (i > 0) {
      const prev = sorted[i - 1];
      if (stop.arrival_date < prev.departure_date) {
        return `Stop ${i + 1} arrives before Stop ${i} ends — dates clash. Adjust dates or reorder.`;
      }
    }
  }

  return null;
}
