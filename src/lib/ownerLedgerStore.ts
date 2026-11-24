import { useCallback, useEffect, useState } from 'react';
import { addDaysToDay, myanmarToday } from './myanmarTime';
import {
  commissionFor,
  createPayoutRun,
  createSaleRow,
  duePayouts,
  markRowsPaid,
  setCommission,
  type CommissionSetting,
  type LedgerRow,
  type PayoutPlan,
  type PayoutRun,
} from './ownerLedger';

/**
 * Plan §9: the browser stand-in for `owner_ledger_rows`, `owner_payout_runs`
 * and `owner_commission_settings`. The callers only see this module, so the
 * swap to Supabase does not reach the panels.
 */
const ROWS_KEY = 'mh-travel-owner-ledger';
const RUNS_KEY = 'mh-travel-owner-payout-runs';
const SETTINGS_KEY = 'mh-travel-owner-commission';
const CHANGED_EVENT = 'mh-travel-owner-ledger-changed';

/** The two shops the Super Admin owner panel already seeds. */
const SEEDED_SHOPS = [
  { shopId: 'rangoon_house', shopName: 'The Rangoon House', ownerName: 'The Rangoon House', commissionPercent: 10 },
  { shopId: 'mandalay_booknook', shopName: 'Mandalay Book Nook', ownerName: 'Mandalay Book Nook', commissionPercent: 0 },
];

/** Each sale is a closed window rather than a moving one, so a run finds one. */
const SEEDED_SALES = [
  { shopId: 'rangoon_house', bookingRef: 'BKG-9101', offsetDays: -38, grossMmk: 180000 },
  { shopId: 'rangoon_house', bookingRef: 'BKG-9102', offsetDays: -36, grossMmk: 240000 },
  { shopId: 'rangoon_house', bookingRef: 'BKG-9103', offsetDays: -22, grossMmk: 95000 },
  { shopId: 'rangoon_house', bookingRef: 'BKG-9104', offsetDays: -20, grossMmk: 310000 },
  { shopId: 'rangoon_house', bookingRef: 'BKG-9105', offsetDays: -6, grossMmk: 130000 },
  { shopId: 'mandalay_booknook', bookingRef: 'BKG-9201', offsetDays: -34, grossMmk: 48000 },
  { shopId: 'mandalay_booknook', bookingRef: 'BKG-9202', offsetDays: -5, grossMmk: 32000 },
];

function seedRows(now = new Date()): LedgerRow[] {
  const rows: LedgerRow[] = [];
  for (const sale of SEEDED_SALES) {
    const shop = SEEDED_SHOPS.find((candidate) => candidate.shopId === sale.shopId);
    if (!shop) continue;
    const row = createSaleRow(
      rows,
      {
        bookingRef: sale.bookingRef,
        shopId: shop.shopId,
        shopName: shop.shopName,
        ownerName: shop.ownerName,
        paidDay: addDaysToDay(myanmarToday(now), sale.offsetDays),
        grossMmk: sale.grossMmk,
        commissionPercent: commissionFor(seedSettings(now), shop.shopId),
      },
      now,
    );
    if (row) rows.push(row);
  }
  return rows;
}

function seedSettings(now = new Date()): CommissionSetting[] {
  return SEEDED_SHOPS.map((shop) => ({
    shopId: shop.shopId,
    percent: shop.commissionPercent,
    updatedAt: now.toISOString(),
    updatedBy: 'system',
  }));
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readLedgerRows(now = new Date()): LedgerRow[] {
  const rows = readJson<LedgerRow[] | null>(ROWS_KEY, null);
  if (!rows) return seedRows(now);
  return Array.isArray(rows) ? rows.filter((row) => typeof row.id === 'string' && typeof row.shopId === 'string') : seedRows(now);
}

export function readPayoutRuns(): PayoutRun[] {
  const runs = readJson<PayoutRun[]>(RUNS_KEY, []);
  return Array.isArray(runs) ? runs.filter((run) => typeof run.id === 'string' && typeof run.shopId === 'string') : [];
}

export function readCommissionSettings(now = new Date()): CommissionSetting[] {
  const settings = readJson<CommissionSetting[] | null>(SETTINGS_KEY, null);
  if (!settings) return seedSettings(now);
  return Array.isArray(settings) ? settings : seedSettings(now);
}

function changed(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function writeLedgerRows(rows: LedgerRow[]): void {
  writeJson(ROWS_KEY, rows);
  changed();
}

/**
 * §16B.1: Payment Admin records the payment, so the row is written at the
 * payment site. The commission comes from the shop's setting and is frozen
 * here, which is why a later rate change never moves an existing row.
 */
export function recordSale(input: {
  bookingRef: string;
  shopId: string;
  shopName: string;
  ownerName: string;
  paidDay: string;
  grossMmk: number;
  kind?: 'sale' | 'refund';
}, now = new Date()): LedgerRow | null {
  const rows = readLedgerRows(now);
  const row = createSaleRow(rows, { ...input, commissionPercent: commissionFor(readCommissionSettings(now), input.shopId) }, now);
  if (!row) return null;
  writeLedgerRows([...rows, row]);
  return row;
}

export function saveCommission(shopId: string, percent: number, actor: string, now = new Date()): CommissionSetting[] {
  const next = setCommission(readCommissionSettings(now), shopId, percent, actor, now);
  writeJson(SETTINGS_KEY, next);
  changed();
  return next;
}

/**
 * Runs the payouts that are due. A run under the minimum returns null from
 * `createPayoutRun`, so the shop's rows stay unpaid and carry over — no partial
 * payment is ever written.
 */
export function runDuePayouts(actor: string, now = new Date()): { plans: PayoutPlan[]; runs: PayoutRun[]; skipped: PayoutPlan[] } {
  const plans = duePayouts(readLedgerRows(now), now);
  const rows = readLedgerRows(now);
  const runs = readPayoutRuns();
  const written: PayoutRun[] = [];
  const skipped: PayoutPlan[] = [];
  let nextRows = rows;
  for (const plan of plans) {
    const run = createPayoutRun(plan, actor, now);
    if (!run) {
      skipped.push(plan);
      continue;
    }
    if (runs.some((existing) => existing.id === run.id)) continue;
    nextRows = markRowsPaid(nextRows, run);
    written.push(run);
  }
  if (written.length > 0) {
    // The runs are written before the event fires, so a listener that re-reads
    // on `changed()` sees the settlement and the runs together.
    writeJson(RUNS_KEY, [...runs, ...written]);
    writeLedgerRows(nextRows);
  }
  return { plans, runs: written, skipped };
}

function useStored<T>(read: () => T): T {
  const [value, setValue] = useState<T>(read);
  const sync = useCallback(() => setValue(read()), [read]);
  useEffect(() => {
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [sync]);
  return value;
}

export function useLedgerRows(): LedgerRow[] {
  return useStored(readLedgerRows);
}

export function usePayoutRuns(): PayoutRun[] {
  return useStored(readPayoutRuns);
}

export function useCommissionSettings(): CommissionSetting[] {
  return useStored(readCommissionSettings);
}
