import { BudgetAllocation, TripSection, Stop } from '../types';

export const ALLOCATION_LABELS: Record<BudgetAllocation, string> = {
  lump_sum: 'Single day (full amount on one date)',
  spread_dates: 'Split evenly across selected dates',
  per_day: 'Per day rate (× number of days)',
  city_total: 'Total for this city — split across its days',
  trip_total: 'Total for full trip — split day-wise',
};

/** Inclusive day count between ISO date strings (minimum 1). */
export function countDaysInclusive(start: string, end: string): number {
  if (!start) return 1;
  const endDate = end || start;
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return 1;
  return Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
}

/** Resolve the date span used for per-day multiplication and distribution. */
export function sectionDateSpan(
  section: Pick<TripSection, 'date_range_start' | 'date_range_end' | 'budget_allocation'>,
  options?: { tripStart?: string; tripEnd?: string; stop?: Stop }
): { start: string; end: string } {
  const allocation = section.budget_allocation || 'spread_dates';
  const tripStart = options?.tripStart || section.date_range_start || '';
  const tripEnd = options?.tripEnd || section.date_range_end || tripStart;

  if (allocation === 'trip_total') {
    return { start: tripStart, end: tripEnd };
  }
  if (allocation === 'city_total' && options?.stop) {
    return {
      start: options.stop.arrival_date || tripStart,
      end: options.stop.departure_date || options.stop.arrival_date || tripEnd,
    };
  }
  return {
    start: section.date_range_start || tripStart,
    end: section.date_range_end || section.date_range_start || tripEnd,
  };
}

/** Mirror backend section_effective_total — per_day budget is multiplied by day count. */
export function sectionEffectiveTotal(
  section: Pick<TripSection, 'budget' | 'budget_allocation' | 'date_range_start' | 'date_range_end'>,
  options?: { tripStart?: string; tripEnd?: string; stop?: Stop }
): number {
  const budget = section.budget || 0;
  const allocation = section.budget_allocation || 'spread_dates';

  if (allocation === 'per_day') {
    const { start, end } = sectionDateSpan(section, options);
    return budget * countDaysInclusive(start, end);
  }
  return budget;
}

export function resolveAllocation(
  scope: 'city' | 'trip' | 'dates',
  mode: 'total' | 'per_day' | 'single_day'
): BudgetAllocation {
  if (mode === 'single_day') return 'lump_sum';
  if (mode === 'per_day') return 'per_day';
  if (scope === 'trip') return 'trip_total';
  if (scope === 'city') return 'city_total';
  return 'spread_dates';
}

export function inferScopeAndMode(allocation: BudgetAllocation | undefined): {
  scope: 'city' | 'trip' | 'dates';
  mode: 'total' | 'per_day' | 'single_day';
} {
  switch (allocation) {
    case 'trip_total':
      return { scope: 'trip', mode: 'total' };
    case 'city_total':
      return { scope: 'city', mode: 'total' };
    case 'per_day':
      return { scope: 'city', mode: 'per_day' };
    case 'lump_sum':
      return { scope: 'city', mode: 'single_day' };
    default:
      return { scope: 'dates', mode: 'total' };
  }
}
