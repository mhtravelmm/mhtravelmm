import { myanmarDay } from './myanmarTime';

/**
 * Plan §16A.4 `ad_events` and `ad_stats_daily`, and §16A.5's counting rules:
 * an impression is one per creative per session per page view once at least
 * half the ad has been visible for a second; a click counts once. Raw events
 * are kept 90 days, and the nightly roll-up groups them by Myanmar Time day.
 */

export type AdEventKind = 'impression' | 'click';

export type AdEvent = {
  id: string;
  placementKey: string;
  campaignId: string;
  creativeId: string;
  kind: AdEventKind;
  /** UTC instant. */
  at: string;
  /** One per page view, so a refresh counts again but a scroll does not. */
  sessionHash: string;
  userId: string | null;
};

export type AdStatsRow = {
  day: string;
  placementKey: string;
  campaignId: string;
  impressions: number;
  clicks: number;
};

export const AD_EVENT_RETENTION_DAYS = 90;

/** §16A.5: at least half the ad visible for one second. */
export const IMPRESSION_VISIBLE_RATIO = 0.5;
export const IMPRESSION_VISIBLE_MS = 1000;

/**
 * Basic bot user agents are ignored, because a crawler that renders the page
 * would otherwise inflate every impression.
 */
const BOT_PATTERN = /bot|crawler|spider|crawling|headless|phantom|slurp|bingpreview|facebookexternalhit|preview/i;

export function isBotUserAgent(userAgent: string): boolean {
  return BOT_PATTERN.test(userAgent);
}

/** One id per page view, so the same creative is not counted twice on it. */
export function newSessionHash(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * The counting key. A second impression of the same creative in the same
 * session on the same page view is dropped, which is what "once per creative
 * per session per page view" means in practice.
 */
export function eventKey(event: Pick<AdEvent, 'placementKey' | 'creativeId' | 'kind' | 'sessionHash'>): string {
  return `${event.sessionHash}:${event.placementKey}:${event.creativeId}:${event.kind}`;
}

/** Appends an event unless this page view already recorded that exact one. */
export function appendEvent(events: AdEvent[], event: AdEvent): AdEvent[] {
  const key = eventKey(event);
  if (events.some((row) => eventKey(row) === key)) return events;
  return [event, ...events];
}

/** §16A.5: the roll-up counts Myanmar Time days, not UTC days. */
export function rollUp(events: AdEvent[], sinceDay?: string): AdStatsRow[] {
  const totals = new Map<string, AdStatsRow>();
  for (const event of events) {
    const day = myanmarDay(event.at);
    if (sinceDay && day < sinceDay) continue;
    const key = `${day}:${event.placementKey}:${event.campaignId}`;
    const row = totals.get(key) ?? { day, placementKey: event.placementKey, campaignId: event.campaignId, impressions: 0, clicks: 0 };
    if (event.kind === 'impression') row.impressions += 1;
    else row.clicks += 1;
    totals.set(key, row);
  }
  return Array.from(totals.values()).sort((a, b) => (a.day === b.day ? a.placementKey.localeCompare(b.placementKey) : b.day.localeCompare(a.day)));
}

/** A day's rows replaced by a fresh roll-up, so running the job twice is safe. */
export function mergeRollUp(existing: AdStatsRow[], fresh: AdStatsRow[]): AdStatsRow[] {
  const days = new Set(fresh.map((row) => row.day));
  return [...fresh, ...existing.filter((row) => !days.has(row.day))];
}

/** §16A.7 reports: clicks ÷ impressions, as a percentage with one decimal. */
export function clickThroughRate(impressions: number, clicks: number): number {
  if (impressions <= 0) return 0;
  return Math.round((clicks / impressions) * 1000) / 10;
}

export type AdTotals = { impressions: number; clicks: number; ctr: number };

export function totals(rows: AdStatsRow[]): AdTotals {
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  return { impressions, clicks, ctr: clickThroughRate(impressions, clicks) };
}

/** §16A.7: the fill rate is the share of served requests that an Admin ad filled. */
export function fillRate(filled: number, requested: number): number {
  if (requested <= 0) return 0;
  return Math.round((filled / requested) * 1000) / 10;
}

/**
 * §16A.7 Pages and placements: the 24-hour fill rate counts a placement as
 * filled when it served at least one impression on that day, so a slot that is
 * switched on but never seen does not inflate the number.
 */
export function filledPlacementKeys(rows: AdStatsRow[], day: string): string[] {
  return Array.from(new Set(rows.filter((row) => row.day === day && row.impressions > 0).map((row) => row.placementKey)));
}

/** The purge keeps 90 days of raw events and nothing older. */
export function purgeBefore(events: AdEvent[], now: Date, days = AD_EVENT_RETENTION_DAYS): { kept: AdEvent[]; purged: number } {
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  const kept = events.filter((event) => new Date(event.at).getTime() >= cutoff);
  return { kept, purged: events.length - kept.length };
}
