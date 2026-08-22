const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function validateLogin(email: string, password: string): string | null {
  if (!email.trim()) return 'Email is required.';
  if (!isValidEmail(email)) return 'Enter a valid email address.';
  if (!password) return 'Password is required.';
  return null;
}

export function validateRegister(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): string | null {
  if (!data.firstName.trim() || !data.lastName.trim()) {
    return 'First and last name are required.';
  }
  if (!data.email.trim()) return 'Email is required.';
  if (!isValidEmail(data.email)) return 'Enter a valid email address.';
  if (!data.password) return 'Password is required.';
  if (data.password.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

export function validateTripDates(startDate: string, endDate: string): string | null {
  if (!startDate || !endDate) return 'Start and end dates are required.';
  if (endDate < startDate) return 'End date must be on or after the start date.';
  return null;
}

/** Inclusive day count — same start & end = 1 day. */
export function tripDurationDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate || endDate < startDate) return 0;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

export function formatTripDuration(startDate: string, endDate: string): string {
  const days = tripDurationDays(startDate, endDate);
  if (days === 0) return '';
  if (days === 1) return '1 day (same-day trip)';
  return `${days} days`;
}

export function validateStopDates(
  arrival: string,
  departure: string,
  tripStart?: string,
  tripEnd?: string
): string | null {
  if (!arrival || !departure) return 'Arrival and departure dates are required.';
  if (departure < arrival) return 'Departure must be on or after arrival (same-day stays are allowed).';
  if (tripStart && arrival < tripStart) return `Arrival cannot be before the trip start (${tripStart}).`;
  if (tripEnd && departure > tripEnd) return `Departure cannot be after the trip end (${tripEnd}).`;
  return null;
}

export function validateSectionDates(
  start: string,
  end: string,
  tripStart?: string,
  tripEnd?: string
): string | null {
  if (!start || !end) return 'Section start and end dates are required.';
  if (end < start) return 'Section end must be on or after the start date.';
  if (tripStart && start < tripStart) return `Section cannot start before the trip (${tripStart}).`;
  if (tripEnd && end > tripEnd) return `Section cannot end after the trip (${tripEnd}).`;
  return null;
}

/** Keep end date valid when user moves start date forward. */
export function syncEndDateWithStart(startDate: string, endDate: string): string {
  if (!startDate) return endDate;
  if (!endDate || endDate < startDate) return startDate;
  return endDate;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
