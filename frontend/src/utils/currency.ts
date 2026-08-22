export type Currency = 'USD' | 'INR';

/** Display conversion rate — base amounts in the app are stored as USD-equivalent. */
export const USD_TO_INR = 83;

export function currencySymbol(currency: Currency): string {
  return currency === 'INR' ? '₹' : '$';
}

export function currencyLabel(currency: Currency): string {
  return currency === 'INR' ? 'INR (₹)' : 'USD ($)';
}

export function convertAmount(amountUsd: number, currency: Currency): number {
  if (currency === 'INR') return amountUsd * USD_TO_INR;
  return amountUsd;
}

export function convertToUsd(amount: number, currency: Currency): number {
  if (currency === 'INR') return amount / USD_TO_INR;
  return amount;
}

/** Format a value already expressed in the selected display currency. */
export function formatDisplayAmount(value: number, currency: Currency): string {
  if (value === 0) return currency === 'INR' ? '₹0' : '$0';

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

export function formatAmount(amountUsd: number, currency: Currency): string {
  return formatDisplayAmount(convertAmount(amountUsd, currency), currency);
}

/** Compact formatter for chart axis ticks. */
export function formatAxisAmount(amountUsd: number, currency: Currency): string {
  const value = convertAmount(amountUsd, currency);
  if (currency === 'INR') {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${Math.round(value / 1000)}k`;
    return `₹${Math.round(value)}`;
  }
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
}

export function formatAmountCompact(amountUsd: number, currency: Currency): string {
  return formatAmount(amountUsd, currency);
}

/** Map backend cost index (0–100) or legacy 1–5 tier to a 1–5 affordability tier. */
export function costIndexToTier(costIndex: number): number {
  const value = Number(costIndex);
  if (!Number.isFinite(value) || value <= 0) return 1;
  if (value <= 5) return Math.round(value);
  return Math.min(5, Math.max(1, Math.ceil(value / 20)));
}

const COST_TIER_LABELS = ['', 'Budget', 'Affordable', 'Moderate', 'Pricey', 'Premium'] as const;

export function formatCostTier(costIndex: number, currency: Currency): string {
  const tier = costIndexToTier(costIndex);
  const symbol = currency === 'INR' ? '₹' : '$';
  return symbol.repeat(tier);
}

/** Map cost index (0–100) to a 1–10 expense score for display. Higher = pricier. */
export function displayCostScore(costIndex: number): number {
  const value = Number(costIndex);
  if (!Number.isFinite(value) || value <= 0) return 5;
  if (value <= 5) return Math.min(10, Math.max(1, Math.round(value * 2)));
  return Math.min(10, Math.max(1, Math.round(value / 10)));
}

export function costTierLabel(costIndex: number): string {
  const tier = costIndexToTier(costIndex);
  return COST_TIER_LABELS[tier] ?? 'Moderate';
}

/** Seed stores cost_index (24–100) as popularity — show as 1–10 rating. */
export function displayPopularityScore(score: number): number {
  const value = Number(score);
  if (!Number.isFinite(value)) return 7;
  if (value <= 10) return Math.min(10, Math.max(1, Math.round(value)));
  return Math.min(10, Math.max(5, Math.round(value / 10)));
}
