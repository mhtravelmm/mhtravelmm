/**
 * Plan §16B.5: the rate lives in `exchange_rates` as append-only rows
 * (`mmk_per_usd`, `effective_from`, `set_by`, `note`), and the current rate is
 * the latest row whose `effective_from` has passed. Rows are never edited, so a
 * past order can always be explained by the row that was live on its day.
 */
export interface ExchangeRateRow {
  id: string;
  mmkPerUsd: number;
  /** ISO timestamp in UTC. */
  effectiveFrom: string;
  setBy: string;
  note: string;
}

/** Plan §16B.5: the hard-coded 4,500 stays as the fallback until a row exists. */
export const FALLBACK_MMK_PER_USD = 4500;

const STORAGE_KEY = 'mh-travel-exchange-rates';
const CHANGED_EVENT = 'mh-travel-exchange-rates-changed';
const MAX_ROWS = 200;

function isRow(value: unknown): value is ExchangeRateRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<ExchangeRateRow>;
  return typeof row.id === 'string' && typeof row.effectiveFrom === 'string' && typeof row.mmkPerUsd === 'number' && row.mmkPerUsd > 0;
}

export function readExchangeRates(): ExchangeRateRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(isRow) : [];
  } catch {
    return [];
  }
}

export function writeExchangeRates(rows: ExchangeRateRow[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, MAX_ROWS)));
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

/** Appends one row. A rate already set for this instant is not written twice. */
export function appendExchangeRate(
  input: { mmkPerUsd: number; setBy: string; note?: string },
  at = new Date(),
): ExchangeRateRow | null {
  if (!Number.isFinite(input.mmkPerUsd) || input.mmkPerUsd <= 0) return null;
  const rows = readExchangeRates();
  const latest = currentExchangeRate(rows, at);
  if (latest !== null && latest === input.mmkPerUsd) return null;
  const row: ExchangeRateRow = {
    id: `rate-${at.getTime()}`,
    mmkPerUsd: Math.round(input.mmkPerUsd * 100) / 100,
    effectiveFrom: at.toISOString(),
    setBy: input.setBy,
    note: input.note ?? '',
  };
  writeExchangeRates([row, ...rows]);
  return row;
}

/** The rate in force at an instant, or `null` when no row has taken effect yet. */
export function currentExchangeRate(rows: ExchangeRateRow[], now = new Date()): number | null {
  const due = rows.filter((row) => new Date(row.effectiveFrom).getTime() <= now.getTime());
  if (due.length === 0) return null;
  return due.reduce((latest, row) => (
    new Date(row.effectiveFrom).getTime() > new Date(latest.effectiveFrom).getTime() ? row : latest
  )).mmkPerUsd;
}

/** What the UI should show: the live row, else the plan's fallback. */
export function effectiveMmkPerUsd(rows: ExchangeRateRow[], now = new Date()): number {
  return currentExchangeRate(rows, now) ?? FALLBACK_MMK_PER_USD;
}

export const EXCHANGE_RATES_EVENT = CHANGED_EVENT;
