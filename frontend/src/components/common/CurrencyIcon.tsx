import React from 'react';
import { DollarSign, IndianRupee } from 'lucide-react';
import { useCurrencyStore } from '../../store/currencyStore';

interface CurrencyIconProps {
  className?: string;
}

export const CurrencyIcon: React.FC<CurrencyIconProps> = ({ className = 'h-4 w-4' }) => {
  const currency = useCurrencyStore((s) => s.currency);
  return currency === 'INR' ? (
    <IndianRupee className={className} />
  ) : (
    <DollarSign className={className} />
  );
};
