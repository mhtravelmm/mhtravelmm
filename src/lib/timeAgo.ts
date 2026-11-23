import type { Language } from '../types';
import { fill } from './fill';
import { myanmarDay, myanmarToday, addDaysToDay } from './myanmarTime';
import { translate } from './translations';

/**
 * Plan §16B.4: an age is reader-facing copy, so it is translated rather than
 * stored. `timeAgoSince` gives the rule as data, which is what the
 * Notifications page groups by; `timeAgoText` turns it into the reader's
 * language.
 */

export type TimeAgoUnit = 'just_now' | 'minute' | 'hour' | 'day';

export type TimeAgo = { unit: TimeAgoUnit; count: number };

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Minutes, then hours, then days — the shape the seeded feed already used. */
export function timeAgoSince(iso: string, now: Date): TimeAgo {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return { unit: 'just_now', count: 0 };
  const elapsed = Math.max(0, now.getTime() - then);
  if (elapsed < MINUTE_MS) return { unit: 'just_now', count: 0 };
  if (elapsed < HOUR_MS) return { unit: 'minute', count: Math.round(elapsed / MINUTE_MS) };
  if (elapsed < DAY_MS) return { unit: 'hour', count: Math.round(elapsed / HOUR_MS) };
  return { unit: 'day', count: Math.round(elapsed / DAY_MS) };
}

const KEYS: Record<Exclude<TimeAgoUnit, 'just_now'>, { one: string; many: string }> = {
  minute: { one: 'time_minute_ago', many: 'time_minutes_ago' },
  hour: { one: 'time_hour_ago', many: 'time_hours_ago' },
  day: { one: 'time_day_ago', many: 'time_days_ago' },
};

export function timeAgoText(ago: TimeAgo, language: Language): string {
  if (ago.unit === 'just_now') return translate('time_just_now', language) ?? 'just now';
  const pair = KEYS[ago.unit];
  const key = ago.count === 1 ? pair.one : pair.many;
  return fill(translate(key, language) ?? '', { count: ago.count });
}

/** The age of one instant, in the reader's language. */
export function timeAgoLabel(iso: string, now: Date, language: Language): string {
  return timeAgoText(timeAgoSince(iso, now), language);
}

export type AgeBucket = 'today' | 'yesterday' | 'earlier';

/**
 * The inbox groups by Myanmar calendar day, not by elapsed hours, so a row
 * written at 00:10 is Today even though it is five minutes old.
 */
export function ageBucket(iso: string, now: Date): AgeBucket {
  if (Number.isNaN(new Date(iso).getTime())) return 'earlier';
  const day = myanmarDay(iso);
  const today = myanmarToday(now);
  if (day === today) return 'today';
  return day === addDaysToDay(today, -1) ? 'yesterday' : 'earlier';
}
