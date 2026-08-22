import { create } from 'zustand';
import { Currency } from '../utils/currency';

const STORAGE_KEY = 'globetrotter_currency';

function readStoredCurrency(): Currency {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'INR' || stored === 'USD') return stored;
  } catch {
    // ignore
  }
  return 'USD';
}

interface CurrencyState {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: readStoredCurrency(),
  setCurrency: (currency) => {
    localStorage.setItem(STORAGE_KEY, currency);
    set({ currency });
  },
}));
