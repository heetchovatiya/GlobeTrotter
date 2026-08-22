import React from 'react';
import { useCurrencyStore } from '../../store/currencyStore';
import { formatAmount } from '../../utils/currency';

interface PriceProps {
  /** Amount stored as USD-equivalent in the backend. */
  amount: number;
  className?: string;
  suffix?: string;
  /** When false, zero amounts render as currency 0 instead of "Free". */
  zeroAsFree?: boolean;
}

export const Price: React.FC<PriceProps> = ({
  amount,
  className,
  suffix,
  zeroAsFree = true,
}) => {
  const currency = useCurrencyStore((s) => s.currency);
  const formatted =
    amount === 0 && zeroAsFree && suffix === undefined
      ? 'Free'
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
