import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Currency } from '../types';

interface CurrencyContextValue {
  currency: Currency;
  toggleCurrency: () => void;
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  shopBaseCurrency: Currency;
  setShopBaseCurrency: (currency: Currency) => void;
  /** Formats a USD base price as a display string in the current currency. */
  formatPrice: (usd: number) => string;
  /** Formats a USD base price in an explicitly selected currency. */
  formatCurrencyAmount: (usd: number, currency: Currency) => string;
}

const DEFAULT_MMK_PER_USD = 4500;
const CURRENCY_STORAGE_KEY = 'mh-travel-currency';
const RATE_STORAGE_KEY = 'mh-travel-mmk-per-usd';
const SHOP_BASE_CURRENCY_STORAGE_KEY = 'mh-travel-shop-base-currency';

function getStoredCurrency(key: string, fallback: Currency): Currency {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(key);
  return stored === 'MMK' || stored === 'USD' ? stored : fallback;
}

function getInitialRate(): number {
  if (typeof window === 'undefined') return DEFAULT_MMK_PER_USD;
  const stored = Number(window.localStorage.getItem(RATE_STORAGE_KEY));
  return Number.isFinite(stored) && stored > 0 ? stored : DEFAULT_MMK_PER_USD;
}

function formatPriceFor(usd: number, currency: Currency, exchangeRate: number): string {
  if (currency === 'USD') {
    return `$ ${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  const mmk = Math.round(usd * exchangeRate);
  return `${mmk.toLocaleString('en-US')} Ks`;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(() => getStoredCurrency(CURRENCY_STORAGE_KEY, 'MMK'));
  const [exchangeRate, setExchangeRateState] = useState<number>(getInitialRate);
  const [shopBaseCurrency, setShopBaseCurrencyState] = useState<Currency>(() => getStoredCurrency(SHOP_BASE_CURRENCY_STORAGE_KEY, 'MMK'));

  useEffect(() => {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  }, [currency]);

  useEffect(() => {
    window.localStorage.setItem(RATE_STORAGE_KEY, String(exchangeRate));
  }, [exchangeRate]);

  useEffect(() => {
    window.localStorage.setItem(SHOP_BASE_CURRENCY_STORAGE_KEY, shopBaseCurrency);
  }, [shopBaseCurrency]);

  useEffect(() => {
    function syncCurrencySettings(event: StorageEvent) {
      if (event.key === RATE_STORAGE_KEY) {
        const nextRate = Number(event.newValue);
        if (Number.isFinite(nextRate) && nextRate > 0) setExchangeRateState(nextRate);
      }
      if (event.key === CURRENCY_STORAGE_KEY && (event.newValue === 'MMK' || event.newValue === 'USD')) setCurrency(event.newValue);
      if (event.key === SHOP_BASE_CURRENCY_STORAGE_KEY && (event.newValue === 'MMK' || event.newValue === 'USD')) setShopBaseCurrencyState(event.newValue);
    }
    window.addEventListener('storage', syncCurrencySettings);
    return () => window.removeEventListener('storage', syncCurrencySettings);
  }, []);

  const toggleCurrency = () => setCurrency((current) => (current === 'MMK' ? 'USD' : 'MMK'));
  const setExchangeRate = (rate: number) => {
    if (Number.isFinite(rate) && rate > 0) setExchangeRateState(Math.round(rate * 100) / 100);
  };
  const formatCurrencyAmount = (usd: number, targetCurrency: Currency) => formatPriceFor(usd, targetCurrency, exchangeRate);
  const formatPrice = (usd: number) => formatCurrencyAmount(usd, currency);

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, exchangeRate, setExchangeRate, shopBaseCurrency, setShopBaseCurrency: setShopBaseCurrencyState, formatPrice, formatCurrencyAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}
