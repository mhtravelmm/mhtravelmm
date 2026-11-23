import type { Language } from '../types';
import type { ServedAd } from './adCampaigns';
import { serveAdNow } from './adStore';
import { isSupabaseConfigured, supabase } from './supabase';

/**
 * Plan §16A.5: the page calls `serve_ad(placement_key, language)`, and the
 * response may be cached at the edge for 60 seconds. This module is that call
 * from the browser side: it asks the RPC when Supabase is configured and reads
 * the browser stand-in otherwise, so a page keeps rendering while the
 * migration is unapplied.
 *
 * The 60-second window is kept here as well as at the edge because the RPC is
 * reached directly until a Worker front door exists; without it every slot on
 * every page view would be a round trip.
 */
export const AD_SERVE_CACHE_MS = 60_000;

export type ServeRow = {
  creative_id: string;
  campaign_id: string;
  kind: string;
  media_url: string;
  click_url: string;
  alt_mm: string;
  alt_en: string;
  alt_text: string;
  advertiser_name: string;
};

/** §16A.4 row shape → the shape `AdSlot` renders. */
export function toServedAd(row: ServeRow, placementKey: string): ServedAd {
  return {
    id: row.creative_id,
    campaignId: row.campaign_id,
    placementKey,
    type: row.kind === 'video' ? 'video' : 'image',
    mediaUrl: row.media_url ?? '',
    clickThroughUrl: row.click_url ?? '',
    advertiser: row.advertiser_name ?? '',
    altMm: row.alt_mm ?? '',
    altEn: row.alt_en ?? '',
  };
}

const cache = new Map<string, { at: number; ad: ServedAd | null }>();

export function clearAdServeCache(): void {
  cache.clear();
}

/**
 * `undefined` means "the RPC could not answer" and the caller falls back;
 * `null` means the RPC answered and there is nothing to serve, which is what
 * makes the slot collapse.
 */
export type RemoteServe = (placementKey: string, language: Language) => Promise<ServedAd | null | undefined>;

async function readRemoteAd(placementKey: string, language: Language): Promise<ServedAd | null | undefined> {
  if (!isSupabaseConfigured || !supabase) return undefined;
  try {
    const { data, error } = await supabase.rpc('serve_ad', {
      p_placement_key: placementKey,
      p_language: language,
    });
    if (error) return undefined;
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    const row = rows[0] as ServeRow | undefined;
    return row ? toServedAd(row, placementKey) : null;
  } catch {
    return undefined;
  }
}

export async function serveAdFor(
  placementKey: string,
  language: Language,
  now = new Date(),
  fetchRemote: RemoteServe = readRemoteAd,
): Promise<ServedAd | null> {
  const key = `${placementKey}:${language}`;
  const hit = cache.get(key);
  if (hit && now.getTime() - hit.at < AD_SERVE_CACHE_MS) return hit.ad;

  const remote = await fetchRemote(placementKey, language);
  const ad = remote === undefined ? serveAdNow(placementKey, now) : remote;
  cache.set(key, { at: now.getTime(), ad });
  return ad;
}
