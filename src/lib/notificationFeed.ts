import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NotificationItem } from '../data/notifications';
import type { AdminRole } from './adminRoles';
import type { LocalizedTextLike } from './translationCache';
import { readScoped, writeScoped } from './userScope';

/**
 * Plan §16B.3: one service, a shared `notification_feed` and per-user read
 * state. A row names its recipients, so a Rental Admin sees rental events and
 * never an ad approval; the reader filters instead of the writer copying.
 * Rows expire after 90 days.
 */

export type FeedEventId =
  | 'blog_published'
  | 'guide_published'
  | 'rental_requested'
  | 'rental_status'
  | 'rental_rescheduled'
  | 'ad_pending_approval'
  | 'campaign_ending'
  | 'campaign_ended'
  | 'guide_earning'
  | 'subscription_ending'
  | 'owner_payout'
  | 'owner_application'
  | 'job_failed'
  | 'listing_status';

/** Who a row is for. `everyone` is the signed-in traveler feed. */
export type FeedRecipient =
  | { kind: 'role'; value: AdminRole }
  | { kind: 'user'; value: string }
  | { kind: 'author'; value: string }
  | { kind: 'everyone' };

export type FeedEventDefinition = {
  id: FeedEventId;
  /** Default recipients, before the caller narrows them for one occurrence. */
  recipients: FeedRecipient[];
  /** Link template; `{code}`, `{slug}` and `{id}` are filled by the caller. */
  href: string;
};

const SUPER_ADMIN: FeedRecipient = { kind: 'role', value: 'Super Admin' };
const ADMIN: FeedRecipient = { kind: 'role', value: 'Admin' };
const RENTAL_ADMIN: FeedRecipient = { kind: 'role', value: 'Rental Admin' };
const ADS_ADMIN: FeedRecipient = { kind: 'role', value: 'Ads Admin' };

/** The Plan §16B.3 table, one entry per event. */
export const FEED_EVENTS: Record<FeedEventId, FeedEventDefinition> = {
  blog_published: { id: 'blog_published', recipients: [{ kind: 'everyone' }], href: '/blogs/{slug}' },
  guide_published: { id: 'guide_published', recipients: [{ kind: 'everyone' }], href: '/travel-guide/{slug}' },
  rental_requested: { id: 'rental_requested', recipients: [RENTAL_ADMIN], href: '/super-admin' },
  rental_status: { id: 'rental_status', recipients: [], href: '/account/bookings/{code}' },
  rental_rescheduled: { id: 'rental_rescheduled', recipients: [RENTAL_ADMIN], href: '/super-admin' },
  ad_pending_approval: { id: 'ad_pending_approval', recipients: [SUPER_ADMIN], href: '/super-admin' },
  campaign_ending: { id: 'campaign_ending', recipients: [ADS_ADMIN], href: '/super-admin' },
  campaign_ended: { id: 'campaign_ended', recipients: [ADS_ADMIN], href: '/super-admin' },
  guide_earning: { id: 'guide_earning', recipients: [], href: '/super-admin' },
  subscription_ending: { id: 'subscription_ending', recipients: [], href: '/shop-owner' },
  owner_payout: { id: 'owner_payout', recipients: [], href: '/shop-owner' },
  owner_application: { id: 'owner_application', recipients: [ADMIN, SUPER_ADMIN], href: '/super-admin' },
  job_failed: { id: 'job_failed', recipients: [SUPER_ADMIN], href: '/super-admin' },
  // The owner is named on the row, so the definition lists no default recipient.
  listing_status: { id: 'listing_status', recipients: [], href: '/shop-owner' },
};

export const FEED_RETENTION_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;
const FEED_KEY = 'mh-travel-notification-feed';
const READ_BASE = 'notification-feed-read';
const CHANGED_EVENT = 'mh-travel-notification-feed-changed';

export type FeedRow = {
  id: string;
  event: FeedEventId;
  title: LocalizedTextLike;
  message: LocalizedTextLike;
  href: string;
  recipients: FeedRecipient[];
  createdAt: string;
};

/** The signed-in reader: a role, an account, an author name, or all three. */
export type FeedViewer = { role?: AdminRole; userId?: string | null; name?: string };

function normalise(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

/** A row is visible to a viewer named by at least one of its recipients. */
export function canSee(row: FeedRow, viewer: FeedViewer): boolean {
  return row.recipients.some((recipient) => {
    switch (recipient.kind) {
      case 'role':
        return recipient.value === viewer.role;
      case 'user':
        return Boolean(viewer.userId) && recipient.value === viewer.userId;
      case 'author':
        return Boolean(normalise(viewer.name)) && normalise(recipient.value) === normalise(viewer.name);
      case 'everyone':
        return true;
    }
  });
}

export function fillTemplate(template: string, values: Record<string, string | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/**
 * Plan §16B.4: a row a traveler reads is written in both languages. A caller
 * that only has one string (the admin bell, a system job) passes it as a
 * string and it is stored in both, so no reader ever gets a blank.
 */
function asLocalized(value: LocalizedTextLike | string): LocalizedTextLike {
  return typeof value === 'string' ? { mm: value, en: value } : value;
}

/** Everything a caller can override for one occurrence of an event. */
export type FeedInput = {
  /**
   * The id of the record this row describes. Passing it lets a second source
   * for the same event (the traveler's rental notice) collapse into this row
   * instead of showing beside it.
   */
  id?: string;
  title: LocalizedTextLike | string;
  message: LocalizedTextLike | string;
  /** Replaces the event's default recipients when given. */
  recipients?: FeedRecipient[];
  /** Values for the event's href template. */
  link?: Record<string, string | undefined>;
  /** Overrides the template entirely, for a link only the caller knows. */
  href?: string;
  at?: Date;
};

/** Rows past the 90-day window are dropped on read, so storage cannot grow. */
export function pruneFeed(rows: FeedRow[], now: Date): FeedRow[] {
  const cutoff = now.getTime() - FEED_RETENTION_DAYS * DAY_MS;
  return rows.filter((row) => new Date(row.createdAt).getTime() > cutoff);
}

export function readFeed(): FeedRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(FEED_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (row): row is FeedRow =>
          Boolean(row) && typeof (row as FeedRow).id === 'string' && Array.isArray((row as FeedRow).recipients),
      )
      // Rows written before §16B.4 hold one string; lift them so every read
      // path sees the same shape.
      .map((row) => ({ ...row, title: asLocalized(row.title), message: asLocalized(row.message) }));
  } catch {
    return [];
  }
}

function writeFeed(rows: FeedRow[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(FEED_KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

/** Builds the row one occurrence of an event produces. */
export function buildFeedRow(event: FeedEventId, input: FeedInput, now = new Date()): FeedRow {
  const definition = FEED_EVENTS[event];
  const href = input.href ?? fillTemplate(definition.href, input.link ?? {});
  return {
    id: input.id ?? `feed-${event}-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    event,
    title: asLocalized(input.title),
    message: asLocalized(input.message),
    href,
    recipients: input.recipients ?? definition.recipients,
    createdAt: now.toISOString(),
  };
}

export function pushFeedEvent(event: FeedEventId, input: FeedInput): FeedRow {
  const row = buildFeedRow(event, input, input.at ?? new Date());
  // An event with no resolvable recipient is a wiring mistake, not a broadcast,
  // so it writes nothing rather than leaking to every bell.
  if (row.recipients.length === 0) return row;
  writeFeed(pruneFeed([row, ...readFeed()], input.at ?? new Date()));
  return row;
}

type ReadMap = Record<string, boolean>;

function viewerKey(viewer: FeedViewer): string {
  if (viewer.userId) return `user:${viewer.userId}`;
  if (viewer.role) return `role:${viewer.role}`;
  return `author:${normalise(viewer.name) || 'guest'}`;
}

/** The rows one viewer may see, newest first, after the retention cut. */
export function feedFor(rows: FeedRow[], viewer: FeedViewer, now = new Date()): FeedRow[] {
  return pruneFeed(rows, now)
    .filter((row) => canSee(row, viewer))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type FeedRowWithRead = FeedRow & { read: boolean };

export function useFeedRows(viewer: FeedViewer): {
  rows: FeedRowWithRead[];
  unread: number;
  markAllRead: () => void;
} {
  const key = viewerKey(viewer);
  const [rows, setRows] = useState<FeedRow[]>(readFeed);
  const [readMap, setReadMap] = useState<ReadMap>(() => readScoped<ReadMap>(READ_BASE, key, {}));

  useEffect(() => {
    setRows(readFeed());
    setReadMap(readScoped<ReadMap>(READ_BASE, key, {}));
    const sync = () => setRows(readFeed());
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [key]);

  const visible = useMemo(() => feedFor(rows, viewer), [rows, viewer]);
  const unread = visible.filter((row) => !readMap[row.id]).length;

  const markAllRead = useCallback(() => {
    const next: ReadMap = { ...readMap };
    for (const row of visible) next[row.id] = true;
    writeScoped(READ_BASE, key, next);
    setReadMap(next);
  }, [key, readMap, visible]);

  return {
    rows: visible.map((row) => ({ ...row, read: Boolean(readMap[row.id]) })),
    unread,
    markAllRead,
  };
}

/** Feed rows as traveler bell items, so one page can show both sources. */
export function useFeedItems(viewer: FeedViewer): NotificationItem[] {
  const { rows } = useFeedRows(viewer);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    thumbnailFrom: '#1d6fa5',
    thumbnailTo: '#0b2b45',
    createdAt: row.createdAt,
    isRead: row.read,
    href: row.href,
  }));
}
