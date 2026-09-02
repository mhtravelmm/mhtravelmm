import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Currency } from '../types';

interface CurrencyContextValue {
  currency: Currency;
  toggleCurrency: () => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = 'mh-travel-currency';

function getInitialCurrency(): Currency {
  if (typeof window === 'undefined') return 'MMK';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'MMK' || stored === 'USD') return stored;
  return 'MMK';
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(getInitialCurrency);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, currency);
  }, [currency]);

  const toggleCurrency = () => setCurrency((c) => (c === 'MMK' ? 'USD' : 'MMK'));

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}
