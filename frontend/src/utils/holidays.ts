import {
  addDays,
  eachDayOfInterval,
  format,
  getDay,
  isSaturday,
  isSunday,
  isBefore,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns';

export interface Holiday {
  date: string;
  name: string;
  type: 'national' | 'regional';
}

export interface LongWeekend {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  leaveDaysRequired: number;
  holidayNames: string[];
  title: string;
}

/** Major India public holidays — fixed dates + commonly observed festival dates. */
const INDIAN_HOLIDAYS: Holiday[] = [
  // 2025
  { date: '2025-01-26', name: 'Republic Day', type: 'national' },
  { date: '2025-03-14', name: 'Holi', type: 'national' },
  { date: '2025-03-31', name: 'Eid ul-Fitr', type: 'national' },
  { date: '2025-04-14', name: 'Ambedkar Jayanti', type: 'national' },
  { date: '2025-04-18', name: 'Good Friday', type: 'national' },
  { date: '2025-05-01', name: 'May Day', type: 'national' },
  { date: '2025-08-15', name: 'Independence Day', type: 'national' },
  { date: '2025-10-02', name: 'Gandhi Jayanti', type: 'national' },
  { date: '2025-10-21', name: 'Dussehra', type: 'national' },
  { date: '2025-10-31', name: 'Diwali', type: 'national' },
  { date: '2025-11-01', name: 'Diwali (Day 2)', type: 'national' },
  { date: '2025-12-25', name: 'Christmas', type: 'national' },
  // 2026
  { date: '2026-01-26', name: 'Republic Day', type: 'national' },
  { date: '2026-03-03', name: 'Holi', type: 'national' },
  { date: '2026-03-21', name: 'Eid ul-Fitr', type: 'national' },
  { date: '2026-04-03', name: 'Good Friday', type: 'national' },
  { date: '2026-04-14', name: 'Ambedkar Jayanti', type: 'national' },
  { date: '2026-05-01', name: 'May Day', type: 'national' },
  { date: '2026-08-15', name: 'Independence Day', type: 'national' },
  { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'national' },
  { date: '2026-10-20', name: 'Dussehra', type: 'national' },
  { date: '2026-11-08', name: 'Diwali', type: 'national' },
  { date: '2026-12-25', name: 'Christmas', type: 'national' },
];

function isWeekendDay(date: Date): boolean {
  return isSaturday(date) || isSunday(date);
}

function holidayMapForYears(years: number[]): Map<string, Holiday> {
  const map = new Map<string, Holiday>();
  for (const h of INDIAN_HOLIDAYS) {
    const year = parseInt(h.date.slice(0, 4), 10);
    if (years.includes(year)) {
      map.set(h.date, h);
    }
  }
  return map;
}

export function getHolidaysForYear(year: number): Holiday[] {
  return INDIAN_HOLIDAYS.filter((h) => h.date.startsWith(String(year)));
}

export function getHolidayOnDate(dateStr: string, years?: number[]): Holiday | undefined {
  const y = years ?? [parseInt(dateStr.slice(0, 4), 10)];
  const map = holidayMapForYears(y);
  return map.get(dateStr);
}

export function getHolidaysInMonth(year: number, month: number): Holiday[] {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return INDIAN_HOLIDAYS.filter((h) => h.date.startsWith(prefix));
}

function countLeaveDays(start: Date, end: Date, holidaySet: Map<string, Holiday>): number {
  return eachDayOfInterval({ start, end }).filter((d) => {
    const key = format(d, 'yyyy-MM-dd');
    return !isWeekendDay(d) && !holidaySet.has(key);
  }).length;
}

function holidaysInRange(start: Date, end: Date, holidaySet: Map<string, Holiday>): string[] {
  const names: string[] = [];
  for (const d of eachDayOfInterval({ start, end })) {
    const h = holidaySet.get(format(d, 'yyyy-MM-dd'));
    if (h) names.push(h.name);
  }
  return names;
}

function expandCluster(
  anchorDate: string,
  holidaySet: Map<string, Holiday>
): { start: Date; end: Date } {
  let start = parseISO(anchorDate);
  let end = parseISO(anchorDate);

  let prev = subDays(start, 1);
  while (isWeekendDay(prev) || holidaySet.has(format(prev, 'yyyy-MM-dd'))) {
    start = prev;
    prev = subDays(prev, 1);
  }

  let next = addDays(end, 1);
  while (isWeekendDay(next) || holidaySet.has(format(next, 'yyyy-MM-dd'))) {
    end = next;
    next = addDays(next, 1);
  }

  if (!isWeekendDay(prev) && !holidaySet.has(format(prev, 'yyyy-MM-dd'))) {
    const trialStart = prev;
    const leave = countLeaveDays(trialStart, end, holidaySet);
    const total = eachDayOfInterval({ start: trialStart, end }).length;
    if (total >= 3 && leave <= 1) start = trialStart;
  }

  if (!isWeekendDay(next) && !holidaySet.has(format(next, 'yyyy-MM-dd'))) {
    const trialEnd = next;
    const leave = countLeaveDays(start, trialEnd, holidaySet);
    const total = eachDayOfInterval({ start, end: trialEnd }).length;
    if (total >= 3 && leave <= 1) end = trialEnd;
  }

  return { start, end };
}

export function getLongWeekends(year: number): LongWeekend[] {
  const holidaySet = holidayMapForYears([year]);
  const holidays = getHolidaysForYear(year);
  const seen = new Set<string>();
  const results: LongWeekend[] = [];

  for (const holiday of holidays) {
    const { start, end } = expandCluster(holiday.date, holidaySet);
    const startDate = format(start, 'yyyy-MM-dd');
    const endDate = format(end, 'yyyy-MM-dd');
    const key = `${startDate}_${endDate}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const totalDays = eachDayOfInterval({ start, end }).length;
    const leaveDaysRequired = countLeaveDays(start, end, holidaySet);
    const holidayNames = holidaysInRange(start, end, holidaySet);

    if (totalDays < 3) continue;

    const primaryName = holidayNames[0] ?? holiday.name;
    const title =
      leaveDaysRequired === 0
        ? `${primaryName} — ${totalDays}-day break`
        : `${primaryName} — ${totalDays} days (${leaveDaysRequired} leave day${leaveDaysRequired === 1 ? '' : 's'})`;

    results.push({
      id: key,
      startDate,
      endDate,
      totalDays,
      leaveDaysRequired,
      holidayNames,
      title,
    });
  }

  return results.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function getUpcomingLongWeekends(limit = 6, fromDate = new Date()): LongWeekend[] {
  const today = format(startOfDay(fromDate), 'yyyy-MM-dd');
  const years = [fromDate.getFullYear(), fromDate.getFullYear() + 1];
  const all = years.flatMap((y) => getLongWeekends(y));
  return all.filter((lw) => lw.endDate >= today).slice(0, limit);
}

export function isLongWeekendDate(dateStr: string, year?: number): LongWeekend | undefined {
  const y = year ?? parseInt(dateStr.slice(0, 4), 10);
  return getLongWeekends(y).find((lw) => dateStr >= lw.startDate && dateStr <= lw.endDate);
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (startDate === endDate) {
    return start.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  if (sameMonth) {
    return `${start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export function isDateInPast(dateStr: string): boolean {
  return isBefore(parseISO(dateStr), startOfDay(new Date()));
}

/** Day-of-week label for calendar headers. */
export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function buildMonthGrid(year: number, month: number): (number | null)[] {
  const firstDayIndex = getDay(new Date(year, month, 1));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

export function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
