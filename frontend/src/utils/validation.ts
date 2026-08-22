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

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
