import React from 'react';
import { useCurrencyStore } from '../../store/currencyStore';
import { Currency } from '../../utils/currency';
import { Coins } from 'lucide-react';

const OPTIONS: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'INR', label: 'INR (₹)' },
];

export const CurrencySelector: React.FC = () => {
  const { currency, setCurrency } = useCurrencyStore();

  return (
    <div className="flex items-center gap-1.5">
      <Coins className="h-4 w-4 text-slate-400 hidden sm:block" />
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as Currency)}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        aria-label="Choose currency"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
