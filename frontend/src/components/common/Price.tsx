import React from 'react';
import { useCurrencyStore } from '../../store/currencyStore';
import { formatAmount } from '../../utils/currency';

interface PriceProps {
  /** Amount stored as USD-equivalent in the backend. */
  amount: number;
  className?: string;
  suffix?: string;
}

export const Price: React.FC<PriceProps> = ({ amount, className, suffix }) => {
  const currency = useCurrencyStore((s) => s.currency);
  const formatted =
    amount === 0 && suffix === undefined
      ? currency === 'INR'
        ? 'Free'
        : 'Free'
      : formatAmount(amount, currency);

  return (
    <span className={className}>
      {formatted}
      {suffix ? suffix : ''}
    </span>
  );
};

/** Hook for components that need formatted strings outside JSX. */
export function useFormatPrice() {
  const currency = useCurrencyStore((s) => s.currency);
  return (amount: number) => formatAmount(amount, currency);
}
