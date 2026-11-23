import { useCallback, useEffect, useState } from 'react';
import { addDaysToDay, myanmarToday } from './myanmarTime';
import { deriveStatus, type OwnerSubscription } from './ownerSubscriptions';

/**
 * Plan §9 and §4: the subscription rows the expiry job and the renewal
 * reminders read. `shop_subscriptions` and `shop_template_entitlements` are the
 * tables this store stands in for; the callers only ever see this module, so
 * the swap does not reach the panels.
 */

const STORAGE_KEY = 'mh-travel-owner-subscriptions';
const CHANGED_EVENT = 'mh-travel-owner-subscriptions-changed';

/**
 * The two shops the Super Admin owner panel already seeds. Their periods are
 * relative to today so a fresh browser shows a live reminder instead of a row
 * that expired before the build was written.
 */
function seedRows(now = new Date()): OwnerSubscription[] {
  const today = myanmarToday(now);
  const stamp = now.toISOString();
  const seed: Omit<OwnerSubscription, 'status'>[] = [
    {
      id: 'sub-rangoon-house',
      kind: 'owner',
      shopId: 'rangoon_house',
      shopName: 'The Rangoon House',
      ownerName: 'The Rangoon House',
      amountMmk: 3000,
      periodStart: `${addDaysToDay(today, -27)}T00:00:00.000Z`,
      // Three days left, so the §16B.3 3-day reminder has something to show.
      periodEnd: `${addDaysToDay(today, 3)}T00:00:00.000Z`,
      graceDays: 7,
      remindedKeys: [],
      updatedAt: stamp,
    },
    {
      id: 'sub-mandalay-book-nook',
      kind: 'owner',
      shopId: 'mandalay_booknook',
      shopName: 'Mandalay Book Nook',
      ownerName: 'Mandalay Book Nook',
      amountMmk: 1000,
      periodStart: `${addDaysToDay(today, -14)}T00:00:00.000Z`,
      periodEnd: `${addDaysToDay(today, 16)}T00:00:00.000Z`,
      graceDays: 7,
      remindedKeys: [],
      updatedAt: stamp,
    },
  ];
  return seed.map((row) => ({ ...row, status: deriveStatus({ ...row, status: 'active' }, now) }));
}

function isRow(value: unknown): value is OwnerSubscription {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<OwnerSubscription>;
  return typeof row.id === 'string' && typeof row.shopId === 'string' && typeof row.periodEnd === 'string';
}

export function readSubscriptions(now = new Date()): OwnerSubscription[] {
  if (typeof window === 'undefined') return seedRows(now);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return seedRows(now);
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isRow) : seedRows(now);
  } catch {
    return seedRows(now);
  }
}

export function writeSubscriptions(rows: OwnerSubscription[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

/** The job seam: read, change, write, and tell the panel it moved. */
export function updateSubscriptions(
  change: (rows: OwnerSubscription[]) => OwnerSubscription[],
  now = new Date(),
): OwnerSubscription[] {
  const next = change(readSubscriptions(now));
  writeSubscriptions(next);
  return next;
}

/**
 * The panel read. `readSubscriptions` returns the row as stored, so the expiry
 * job can still see the old status; a reader gets the status as of now, because
 * a stored status is up to an hour stale between two runs of the job.
 */
export function useSubscriptions(now?: Date): OwnerSubscription[] {
  const [rows, setRows] = useState<OwnerSubscription[]>(() => readSubscriptions());

  const sync = useCallback(() => setRows(readSubscriptions()), []);

  useEffect(() => {
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [sync]);

  const clock = now ?? new Date();
  return rows.map((row) => ({ ...row, status: deriveStatus(row, clock) }));
}
