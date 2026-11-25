import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Currency } from '../types';
import { formatMoney } from './moneyFormat';
import {
  EXCHANGE_RATES_EVENT,
  FALLBACK_MMK_PER_USD,
  appendExchangeRate,
  effectiveMmkPerUsd,
  readExchangeRates,
} from './exchangeRates';
import { appendRemoteRate, readRemoteRate } from './exchangeRateApi';

interface CurrencyContextValue {
  currency: Currency;
  toggleCurrency: () => void;
  exchangeRate: number;
  /** Plan §16B.5: setting a rate appends a row, so the old rate stays on record. */
  setExchangeRate: (rate: number, options?: { setBy?: string; note?: string }) => void;
  shopBaseCurrency: Currency;
  setShopBaseCurrency: (currency: Currency) => void;
  /** Formats a USD base price as a display string in the current currency. */
  formatPrice: (usd: number) => string;
  /** Formats a USD base price in an explicitly selected currency. */
  formatCurrencyAmount: (usd: number, currency: Currency) => string;
}

const CURRENCY_STORAGE_KEY = 'mh-travel-currency';
const RATE_STORAGE_KEY = 'mh-travel-mmk-per-usd';
const SHOP_BASE_CURRENCY_STORAGE_KEY = 'mh-travel-shop-base-currency';

function getStoredCurrency(key: string, fallback: Currency): Currency {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(key);
  return stored === 'MMK' || stored === 'USD' ? stored : fallback;
}

function getInitialRate(): number {
  if (typeof window === 'undefined') return FALLBACK_MMK_PER_USD;
  const fromRows = effectiveMmkPerUsd(readExchangeRates());
  if (fromRows !== FALLBACK_MMK_PER_USD) return fromRows;
  const stored = Number(window.localStorage.getItem(RATE_STORAGE_KEY));
  return Number.isFinite(stored) && stored > 0 ? stored : FALLBACK_MMK_PER_USD;
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
    function syncRateRows() {
      setExchangeRateState(effectiveMmkPerUsd(readExchangeRates()));
    }
    window.addEventListener('storage', syncCurrencySettings);
    window.addEventListener(EXCHANGE_RATES_EVENT, syncRateRows);
    return () => {
      window.removeEventListener('storage', syncCurrencySettings);
      window.removeEventListener(EXCHANGE_RATES_EVENT, syncRateRows);
    };
  }, []);

  // §16B.5 and O-02: the table is the authority once it has a row. A failed or
  // empty read leaves the browser rate alone, so an unreachable server cannot
  // reprice the whole site.
  useEffect(() => {
    let active = true;
    void readRemoteRate().then((rate) => {
      if (active && rate !== null) setExchangeRateState(rate);
    });
    return () => { active = false; };
  }, []);

  const toggleCurrency = () => setCurrency((current) => (current === 'MMK' ? 'USD' : 'MMK'));
  const setExchangeRate = (rate: number, options?: { setBy?: string; note?: string }) => {
    if (!Number.isFinite(rate) || rate <= 0) return;
    // §16B.5: the browser row is appended first so the screen updates at once,
    // then the table gets the same row. The server's policy decides who may
    // write; a refusal leaves the browser row, which is the preview's job.
    appendExchangeRate({ mmkPerUsd: rate, setBy: options?.setBy ?? 'Super Admin', note: options?.note });
    void appendRemoteRate({ mmkPerUsd: rate, note: options?.note });
    setExchangeRateState(Math.round(rate * 100) / 100);
  };
  const formatCurrencyAmount = (usd: number, targetCurrency: Currency) => formatMoney(usd, targetCurrency, exchangeRate);
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
