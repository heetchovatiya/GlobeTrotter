export type Currency = 'USD' | 'INR';

/** Display conversion rate — base amounts in the app are stored as USD-equivalent. */
export const USD_TO_INR = 83;

export function convertAmount(amountUsd: number, currency: Currency): number {
  if (currency === 'INR') return amountUsd * USD_TO_INR;
  return amountUsd;
}

export function formatAmount(amountUsd: number, currency: Currency): string {
  if (amountUsd === 0) return currency === 'INR' ? '₹0' : '$0';

  const value = convertAmount(amountUsd, currency);
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatAmountCompact(amountUsd: number, currency: Currency): string {
  return formatAmount(amountUsd, currency);
}
