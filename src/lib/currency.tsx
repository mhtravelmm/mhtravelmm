import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Currency } from '../types';

interface CurrencyContextValue {
  currency: Currency;
  toggleCurrency: () => void;
  /** Formats a USD base price as a display string in the current currency */
  formatPrice: (usd: number) => string;
}

/**
 * USD -> MMK exchange rate. Per the confirmed spec this is set by
 * Admin/Super Admin and can change over time; this constant is a
 * placeholder until it's served from Supabase.
 */
const MMK_PER_USD = 4500;

function formatPriceFor(usd: number, currency: Currency): string {
  if (currency === 'USD') {
    return `$ ${usd.toLocaleString('en-US')}`;
  }
  const mmk = Math.round(usd * MMK_PER_USD);
  return `${mmk.toLocaleString('en-US')} Ks`;
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
  const formatPrice = (usd: number) => formatPriceFor(usd, currency);

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}
