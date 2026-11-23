import { myanmarDay, myanmarToday } from './myanmarTime';

/**
 * Plan §9 and §4: an Owner's shop subscription and a paid Shop Page template
 * subscription follow the same lifecycle — active, then a grace period after
 * `periodEnd`, then expired. §16B.7 runs the two moves hourly and the 7/3/1-day
 * reminders daily, so both rules live here as pure functions and the jobs only
 * read the clock and write the result.
 */

export type SubscriptionKind = 'owner' | 'template';
export type SubscriptionStatus = 'active' | 'grace' | 'expired';

export interface OwnerSubscription {
  id: string;
  kind: SubscriptionKind;
  shopId: string;
  shopName: string;
  /**
   * The owner account name. The feed scopes a reminder by `author`, which is
   * how guide earnings already reach their author, so one owner never reads
   * another's billing.
   */
  ownerName: string;
  amountMmk: number;
  periodStart: string;
  periodEnd: string;
  status: SubscriptionStatus;
  /** §4 decides 7 days; §9 leaves the owner plan to Admin, so it is a column. */
  graceDays: number;
  /** Reminder keys already sent for this period, so a second run is silent. */
  remindedKeys: string[];
  updatedAt: string;
}

/** §4: the reminders arrive 7, 3 and 1 days before `periodEnd`. */
export const RENEWAL_REMINDER_DAYS = [7, 3, 1] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

function parse(value: string): number {
  return new Date(value).getTime();
}

/**
 * Where the subscription stands at `now`. An unreadable `periodEnd` is treated
 * as expired rather than active: a broken row must not grant a shop free
 * service forever.
 */
export function deriveStatus(sub: OwnerSubscription, now = new Date()): SubscriptionStatus {
  const end = parse(sub.periodEnd);
  if (Number.isNaN(end)) return 'expired';
  const graceMs = Math.max(0, sub.graceDays) * DAY_MS;
  if (now.getTime() < end) return 'active';
  if (now.getTime() < end + graceMs) return 'grace';
  return 'expired';
}

/**
 * Whole Myanmar calendar days between today and `periodEnd`. Counted on the
 * calendar, not on hours, so "3 days left" reads the same at 09:00 and at 23:00
 * of the day the reminder runs.
 */
export function daysUntilEnd(sub: OwnerSubscription, now = new Date()): number | null {
  const end = parse(sub.periodEnd);
  if (Number.isNaN(end)) return null;
  const today = Date.parse(`${myanmarToday(now)}T12:00:00Z`);
  const endDay = Date.parse(`${myanmarDay(sub.periodEnd)}T12:00:00Z`);
  return Math.round((endDay - today) / DAY_MS);
}

/** One reminder per threshold per period, so renewing resets the count. */
export function reminderKey(sub: OwnerSubscription, daysLeft: number): string {
  return `${sub.id}:${sub.periodEnd}:${daysLeft}`;
}

export type DueReminder = { subscription: OwnerSubscription; daysLeft: number };

/**
 * §16B.3 "subscription ending (7, 3, 1 days)". A reminder is due when the
 * calendar distance matches a threshold and that threshold has not been sent
 * for this period; an expired subscription is silent, because the reminder has
 * become a recovery task for Admin.
 */
export function dueReminders(
  subscriptions: OwnerSubscription[],
  now = new Date(),
  thresholds: readonly number[] = RENEWAL_REMINDER_DAYS,
): DueReminder[] {
  const due: DueReminder[] = [];
  for (const subscription of subscriptions) {
    if (deriveStatus(subscription, now) === 'expired') continue;
    const daysLeft = daysUntilEnd(subscription, now);
    if (daysLeft === null || !thresholds.includes(daysLeft)) continue;
    if (subscription.remindedKeys.includes(reminderKey(subscription, daysLeft))) continue;
    due.push({ subscription, daysLeft });
  }
  return due;
}

/** Records a reminder as sent, so the next run in the same day finds nothing. */
export function markReminded(sub: OwnerSubscription, daysLeft: number, now = new Date()): OwnerSubscription {
  const key = reminderKey(sub, daysLeft);
  if (sub.remindedKeys.includes(key)) return sub;
  return { ...sub, remindedKeys: [...sub.remindedKeys, key], updatedAt: now.toISOString() };
}

export type ExpiryResult = { rows: OwnerSubscription[]; moved: number };

/**
 * §16B.7 "Active to grace to expired". Only rows whose derived status differs
 * from the stored one are rewritten, so an hourly run over settled rows changes
 * nothing and the job is safe to repeat.
 */
export function applyExpiry(subscriptions: OwnerSubscription[], now = new Date()): ExpiryResult {
  let moved = 0;
  const rows = subscriptions.map((sub) => {
    const next = deriveStatus(sub, now);
    if (next === sub.status) return sub;
    moved += 1;
    return { ...sub, status: next, updatedAt: now.toISOString() };
  });
  return { rows, moved };
}

/**
 * §9: an expired Owner's listing stays visible, but booking and contact are
 * blocked. The public shop page is not built yet, so this is the rule the
 * dashboard and the future page both read rather than a page-level check.
 */
export function blocksBooking(sub: OwnerSubscription, now = new Date()): boolean {
  return deriveStatus(sub, now) === 'expired';
}

/** Days remaining in the grace period, for the owner's reminder copy. */
export function graceDaysLeft(sub: OwnerSubscription, now = new Date()): number {
  const end = parse(sub.periodEnd);
  if (Number.isNaN(end)) return 0;
  const graceEnd = end + Math.max(0, sub.graceDays) * DAY_MS;
  return Math.max(0, Math.ceil((graceEnd - now.getTime()) / DAY_MS));
}

/** The row a shop page or dashboard shows: newest period wins. */
export function latestSubscription(
  subscriptions: OwnerSubscription[],
  shopId: string,
  kind: SubscriptionKind,
): OwnerSubscription | undefined {
  return subscriptions
    .filter((sub) => sub.shopId === shopId && sub.kind === kind)
    .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))[0];
}

/**
 * The one row an owner may read. §9 bills each Owner for their own shop, so a
 * viewer with no row of their own reads nothing — falling back to another
 * shop's row would show one owner another owner's fee and period.
 */
export function subscriptionForOwner(
  subscriptions: OwnerSubscription[],
  ownerName: string | undefined,
  kind: SubscriptionKind = 'owner',
): OwnerSubscription | undefined {
  const mine = (ownerName ?? '').trim().toLowerCase();
  if (!mine) return undefined;
  return subscriptions
    .filter((sub) => sub.kind === kind && sub.ownerName.trim().toLowerCase() === mine)
    .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))[0];
}
