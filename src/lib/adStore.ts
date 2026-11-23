import { useCallback, useEffect, useState } from 'react';
import {
  AD_PLACEMENTS,
  normalizePlacements,
  setPlacementActive,
  setPlacementFallback,
  type AdPlacement,
} from './adPlacements';
import {
  normalizedPlacementKeys,
  serveAd,
  type AdCampaign,
  type AdCreativeRow,
  type ServedAd,
} from './adCampaigns';
import {
  AD_EVENT_RETENTION_DAYS,
  appendEvent,
  isBotUserAgent,
  mergeRollUp,
  purgeBefore,
  rollUp,
  type AdEvent,
  type AdEventKind,
  type AdStatsRow,
} from './adStats';

/**
 * Plan §16A.4: `ad_advertisers`, `ad_campaigns`, `ad_creatives`,
 * `ad_placements`, `ad_assignments`, `ad_events` and `ad_stats_daily`. This is
 * the browser stand-in with the same shapes, so the Adsboard, the pages and the
 * jobs read one seam; the tables replace it without moving a call site.
 *
 * The seeded campaigns exist so the site is not empty on a fresh browser: one
 * Live campaign per placement family, all approved, all inside a window that
 * starts before today and ends far enough out that a demo does not go dark.
 */

const PLACEMENT_KEY = 'mh-travel-ad-placements';
const ADVERTISER_KEY = 'mh-travel-ad-advertisers';
const CAMPAIGN_KEY = 'mh-travel-ad-campaigns';
const CREATIVE_KEY = 'mh-travel-ad-creatives';
const EVENT_KEY = 'mh-travel-ad-events';
const STATS_KEY = 'mh-travel-ad-stats';
const SETTINGS_KEY = 'mh-travel-ad-settings';

const changedEvent = (key: string) => `${key}-changed`;

function emit(key: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(changedEvent(key)));
}

function readJson<T>(key: string): T[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) || 'null');
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, rows: T[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(rows));
  emit(key);
}

/**
 * §16A.4 `ad_advertisers`: contact details for the company behind a campaign.
 * The campaign also carries `advertiser` as a plain name, so a merged or
 * renamed advertiser row cannot change what a served ad says.
 */
export type Advertiser = {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  billingRef: string;
  notes: string;
};

function seedAdvertisers(campaigns: AdCampaign[]): Advertiser[] {
  return Array.from(new Set(campaigns.map((campaign) => campaign.advertiser))).map((name, index) => ({
    id: `adv-${index + 1}`,
    name,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    billingRef: '',
    notes: '',
  }));
}

export function readAdvertisers(): Advertiser[] {
  const stored = readJson<Advertiser>(ADVERTISER_KEY);
  if (!stored) return seedAdvertisers(readCampaigns());
  return stored.filter((row): row is Advertiser => Boolean(row) && typeof row.name === 'string');
}

export function writeAdvertisers(rows: Advertiser[]): void {
  writeJson(ADVERTISER_KEY, rows);
}

export function useAdvertisers() {
  return useStored(ADVERTISER_KEY, readAdvertisers, writeAdvertisers);
}

/** §16A.7 Settings: the AdSense ids stay empty until the founder supplies them. */
export type AdSettings = {
  adsenseClient: string;
  adsenseSlotHome: string;
  /** §16A.8 creative limits, so the form and the Worker agree. */
  imageMaxKb: number;
  videoMaxKb: number;
  videoMaxSeconds: number;
  /** A domain block list for click URLs. */
  blockedDomains: string[];
};

export const DEFAULT_AD_SETTINGS: AdSettings = {
  adsenseClient: '',
  adsenseSlotHome: '',
  imageMaxKb: 300,
  videoMaxKb: 3 * 1024,
  videoMaxSeconds: 15,
  blockedDomains: [],
};

/** A campaign window that is open now and closes in a year, for the seeds. */
function openWindow(now: Date): { startAt: string; endAt: string } {
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  return { startAt: start.toISOString(), endAt: end.toISOString() };
}

function seedCampaigns(now: Date): { campaigns: AdCampaign[]; creatives: AdCreativeRow[] } {
  const { startAt, endAt } = openWindow(now);
  const seeds: { id: string; advertiser: string; name: string; keys: string[]; creative: AdCreativeRow }[] = [
    {
      id: 'camp-home-hero',
      advertiser: 'MH Travel',
      name: 'Explore Myanmar',
      keys: ['home_hero'],
      creative: {
        id: 'cr-home-hero',
        campaignId: 'camp-home-hero',
        type: 'image',
        mediaUrl: '/images/blog/shwedagon-evening.webp',
        clickUrl: '/travel-plans',
        altMm: 'ရွှေတိဂုံဘုရား ညနေခင်း — ခရီးစဉ်များ ကြည့်ရန်',
        altEn: 'Shwedagon at dusk — see travel plans',
        approval: 'approved',
        rejectedReason: '',
        bytes: 0,
      },
    },
    {
      id: 'camp-home-sections',
      advertiser: 'MH Travel Hotels',
      name: 'Stay closer to what matters',
      keys: ['home_after_travel_plans', 'home_after_hotels', 'home_after_blogs', 'home_after_reviews', 'home_after_partners'],
      creative: {
        id: 'cr-home-sections',
        campaignId: 'camp-home-sections',
        type: 'image',
        mediaUrl: '/images/blog/inle-stilt-houses.webp',
        clickUrl: '/hotels',
        altMm: 'အင်းလေး ရေပေါ်အိမ်များ — ဟိုတယ်များ ကြည့်ရန်',
        altEn: 'Inle stilt houses — see hotels',
        approval: 'approved',
        rejectedReason: '',
        bytes: 0,
      },
    },
    {
      id: 'camp-blog-inline',
      advertiser: 'MH Travel Plans',
      name: 'A better way to travel Myanmar',
      keys: ['blog_post_top', 'blog_inline', 'blog_post_bottom'],
      creative: {
        id: 'cr-blog-inline',
        campaignId: 'camp-blog-inline',
        type: 'image',
        mediaUrl: '/images/blog/bagan-sunrise.webp',
        clickUrl: '/travel-plans',
        altMm: 'ပုဂံ အရုဏ်ဦး — ခရီးစဉ် စီစဉ်ရန်',
        altEn: 'Bagan at sunrise — plan a trip',
        approval: 'approved',
        rejectedReason: '',
        bytes: 0,
      },
    },
    {
      id: 'camp-rentals-top',
      advertiser: 'MH Ride',
      name: 'Book a ride anywhere in Yangon',
      keys: ['rentals_top'],
      creative: {
        id: 'cr-rentals-top',
        campaignId: 'camp-rentals-top',
        type: 'image',
        mediaUrl: '/images/blog/shwedagon-evening.webp',
        clickUrl: '/rentals',
        altMm: 'ရွှေတိဂုံဘုရား — ယာဉ် ငှားရမ်းရန်',
        altEn: 'Shwedagon Pagoda — rent a vehicle',
        approval: 'approved',
        rejectedReason: '',
        bytes: 0,
      },
    },
    {
      id: 'camp-city-sections',
      advertiser: 'Yangon Food Week',
      name: 'Yangon Food Week',
      keys: ['cities_top', 'city_after_cities', 'city_after_attractions', 'city_after_shopping', 'city_detail_after_restaurants'],
      creative: {
        id: 'cr-city-sections',
        campaignId: 'camp-city-sections',
        type: 'image',
        mediaUrl: '/images/blog/myanmar-food.webp',
        clickUrl: '/restaurants',
        altMm: 'ရန်ကုန် အစားအသောက် ပွဲတော် — စားသောက်ဆိုင်များ',
        altEn: 'Yangon Food Week — restaurants',
        approval: 'approved',
        rejectedReason: '',
        bytes: 0,
      },
    },
    {
      id: 'camp-plans',
      advertiser: 'MH Travel',
      name: 'Plan your next escape',
      keys: ['travel_plans_top', 'travel_plan_detail_inline'],
      creative: {
        id: 'cr-plans',
        campaignId: 'camp-plans',
        type: 'image',
        mediaUrl: '/images/blog/inle-stilt-houses.webp',
        clickUrl: '/travel-plans',
        altMm: 'အင်းလေး ကန် — ခရီးစဉ်များ',
        altEn: 'Inle Lake — travel plans',
        approval: 'approved',
        rejectedReason: '',
        bytes: 0,
      },
    },
    {
      id: 'camp-nearby',
      advertiser: 'MH Travel Discoveries',
      name: 'Keep exploring',
      keys: ['nearby_top', 'account_top'],
      creative: {
        id: 'cr-nearby',
        campaignId: 'camp-nearby',
        type: 'image',
        mediaUrl: '/images/blog/ubein-evening.webp',
        clickUrl: '/nearby',
        altMm: 'ဦးပိန် တံတား — အနီးအနား ရှာရန်',
        altEn: 'U Bein Bridge — find places nearby',
        approval: 'approved',
        rejectedReason: '',
        bytes: 0,
      },
    },
  ];

  const campaigns: AdCampaign[] = seeds.map((seed) => ({
    id: seed.id,
    advertiser: seed.advertiser,
    name: seed.name,
    status: 'Live',
    startAt,
    endAt,
    priority: 10,
    weight: 1,
    agreedFeeMmk: 0,
    invoiced: false,
    paid: false,
    placementKeys: seed.keys,
    createdBy: 'MH Travel',
    approvedBy: 'MH Travel',
    approvedAt: startAt,
    updatedAt: startAt,
  }));

  return { campaigns, creatives: seeds.map((seed) => seed.creative) };
}

function isCampaign(value: unknown): value is AdCampaign {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<AdCampaign>;
  return typeof row.id === 'string' && typeof row.name === 'string' && Array.isArray(row.placementKeys);
}

/** A campaign saved before the commercial fields existed keeps a working row. */
function normalizeCampaign(row: AdCampaign): AdCampaign {
  return {
    ...row,
    status: row.status ?? 'Draft',
    priority: row.priority ?? 10,
    weight: row.weight ?? 1,
    agreedFeeMmk: row.agreedFeeMmk ?? 0,
    invoiced: row.invoiced ?? false,
    paid: row.paid ?? false,
    placementKeys: Array.isArray(row.placementKeys) ? row.placementKeys : [],
    approvedBy: row.approvedBy ?? '',
    approvedAt: row.approvedAt ?? null,
    updatedAt: row.updatedAt ?? row.startAt ?? new Date(0).toISOString(),
  };
}

function isCreative(value: unknown): value is AdCreativeRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<AdCreativeRow>;
  return typeof row.id === 'string' && typeof row.campaignId === 'string';
}

function normalizeCreative(row: AdCreativeRow): AdCreativeRow {
  return {
    ...row,
    type: row.type === 'video' ? 'video' : 'image',
    mediaUrl: row.mediaUrl ?? '',
    clickUrl: row.clickUrl ?? '',
    altMm: row.altMm ?? '',
    altEn: row.altEn ?? '',
    approval: row.approval ?? 'draft',
    rejectedReason: row.rejectedReason ?? '',
    bytes: row.bytes ?? 0,
  };
}

export function readPlacements(): AdPlacement[] {
  const stored = readJson<AdPlacement>(PLACEMENT_KEY);
  if (!stored) return AD_PLACEMENTS;
  return normalizePlacements(stored);
}

export function writePlacements(placements: AdPlacement[]): void {
  writeJson(PLACEMENT_KEY, placements);
}

export function readCampaigns(): AdCampaign[] {
  const stored = readJson<AdCampaign>(CAMPAIGN_KEY);
  if (!stored) return seedCampaigns(new Date()).campaigns;
  return stored.filter(isCampaign).map(normalizeCampaign);
}

export function writeCampaigns(campaigns: AdCampaign[]): void {
  writeJson(CAMPAIGN_KEY, campaigns);
}

export function readCreatives(): AdCreativeRow[] {
  const stored = readJson<AdCreativeRow>(CREATIVE_KEY);
  if (!stored) return seedCampaigns(new Date()).creatives;
  return stored.filter(isCreative).map(normalizeCreative);
}

export function writeCreatives(creatives: AdCreativeRow[]): void {
  writeJson(CREATIVE_KEY, creatives);
}

export function readAdEvents(): AdEvent[] {
  return (readJson<AdEvent>(EVENT_KEY) ?? []).filter(
    (row): row is AdEvent => Boolean(row) && typeof row.placementKey === 'string' && typeof row.kind === 'string',
  );
}

export function writeAdEvents(events: AdEvent[]): void {
  writeJson(EVENT_KEY, events);
}

export function readAdStats(): AdStatsRow[] {
  return (readJson<AdStatsRow>(STATS_KEY) ?? []).filter(
    (row): row is AdStatsRow => Boolean(row) && typeof row.day === 'string',
  );
}

export function writeAdStats(rows: AdStatsRow[]): void {
  writeJson(STATS_KEY, rows);
}

export function readAdSettings(): AdSettings {
  if (typeof window === 'undefined') return DEFAULT_AD_SETTINGS;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') return DEFAULT_AD_SETTINGS;
    const row = parsed as Partial<AdSettings>;
    return {
      adsenseClient: row.adsenseClient ?? '',
      adsenseSlotHome: row.adsenseSlotHome ?? '',
      imageMaxKb: row.imageMaxKb ?? DEFAULT_AD_SETTINGS.imageMaxKb,
      videoMaxKb: row.videoMaxKb ?? DEFAULT_AD_SETTINGS.videoMaxKb,
      videoMaxSeconds: row.videoMaxSeconds ?? DEFAULT_AD_SETTINGS.videoMaxSeconds,
      blockedDomains: Array.isArray(row.blockedDomains) ? row.blockedDomains : [],
    };
  } catch {
    return DEFAULT_AD_SETTINGS;
  }
}

export function writeAdSettings(settings: AdSettings): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  emit(SETTINGS_KEY);
}

/**
 * The page-facing serving call. Reads the same rows the Adsboard writes, so a
 * campaign paused in the console leaves the next page load without an ad.
 */
export function serveAdNow(placementKey: string, now = new Date()): ServedAd | null {
  return serveAd(placementKey, readCampaigns(), readCreatives(), readPlacements(), now);
}

/**
 * Records one impression or click. §16A.5 says a bot is ignored and the same
 * creative counts once per session per page view, so both refusals answer
 * `false` and the caller does not have to know why.
 */
export function recordAdEvent(input: {
  placementKey: string;
  campaignId: string;
  creativeId: string;
  kind: AdEventKind;
  sessionHash: string;
  userId?: string | null;
  now?: Date;
}): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof navigator !== 'undefined' && isBotUserAgent(navigator.userAgent)) return false;
  const now = input.now ?? new Date();
  const event: AdEvent = {
    id: `ad-event-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    placementKey: input.placementKey,
    campaignId: input.campaignId,
    creativeId: input.creativeId,
    kind: input.kind,
    at: now.toISOString(),
    sessionHash: input.sessionHash,
    userId: input.userId ?? null,
  };
  const current = readAdEvents();
  const next = appendEvent(current, event);
  if (next === current) return false;
  writeAdEvents(next);
  return true;
}

/** §16B.7 `ad_stats_rollup`: replaces every day it recomputes, so a rerun is safe. */
export function rollUpAdStats(): number {
  const fresh = rollUp(readAdEvents());
  writeAdStats(mergeRollUp(readAdStats(), fresh));
  return fresh.length;
}

/** §16B.7 `ad_events_purge`: keeps 90 days of raw events. */
export function purgeAdEvents(now = new Date()): number {
  const { kept, purged } = purgeBefore(readAdEvents(), now, AD_EVENT_RETENTION_DAYS);
  if (purged > 0) writeAdEvents(kept);
  return purged;
}

/** The campaign's placements as the report shows them, blog slots folded. */
export function reportPlacementKeys(campaign: AdCampaign, placements: AdPlacement[] = readPlacements()): string[] {
  return normalizedPlacementKeys(campaign.placementKeys, placements);
}

function useStored<T>(key: string, read: () => T, write: (value: T) => void) {
  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    const sync = () => setValue(read());
    window.addEventListener(changedEvent(key), sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(changedEvent(key), sync);
      window.removeEventListener('storage', sync);
    };
  }, [key, read]);

  const save = useCallback((next: T | ((current: T) => T)) => {
    setValue((current) => {
      const resolved = typeof next === 'function' ? (next as (current: T) => T)(current) : next;
      write(resolved);
      return resolved;
    });
  }, [write]);

  return [value, save] as const;
}

export function useAdPlacements() {
  return useStored(PLACEMENT_KEY, readPlacements, writePlacements);
}

export function useAdCampaigns() {
  return useStored(CAMPAIGN_KEY, readCampaigns, writeCampaigns);
}

export function useAdCreatives() {
  return useStored(CREATIVE_KEY, readCreatives, writeCreatives);
}

export function useAdEvents() {
  return useStored(EVENT_KEY, readAdEvents, writeAdEvents);
}

export function useAdStats() {
  return useStored(STATS_KEY, readAdStats, writeAdStats);
}

export function useAdSettings() {
  return useStored(SETTINGS_KEY, readAdSettings, writeAdSettings);
}

export { setPlacementActive, setPlacementFallback };
