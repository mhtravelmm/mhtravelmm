import { rpcOrLocal, type ErrorCode } from './backend';
import { distanceKm, type LatLng } from './location';
import { closesAt, isOpenAt } from './openingHours';
import { SEARCH_INDEX, type SearchHit, type SearchKind, type SearchRow } from './searchIndex';

/**
 * Plan §16G.3 and §16H.9, ticket O-51. `search_nearby()` is the function the
 * Nearby page calls. This module is its seam, in the same shape as
 * `searchApi.ts`: it turns the page's state into the function's arguments, maps
 * the answer into one row shape, and lets `rpcOrLocal('search', …)` decide
 * whether `search_nearby` or the preview answered.
 *
 * The preview reads the seeded index rather than the old `NEARBY_LISTINGS`
 * module, so the page's "18 places" and the search page's "18 results" count
 * the same objects.
 */

/** §16H.9: the radius the page offers, and the function's default. */
export const NEARBY_RADIUS_KM = 10;

/** The kinds the Nearby page's category row offers, in §12's reference order. */
export const NEARBY_KINDS: SearchKind[] = [
  'hotels', 'guesthouses', 'restaurants', 'cafes', 'bars', 'attractions', 'markets',
  'bookshops', 'rentals', 'transport', 'exchange', 'hospitals', 'clinics', 'gyms',
];

export interface NearbyRequest {
  lat: number;
  lng: number;
  radiusKm?: number;
  kinds?: SearchKind[];
  openNow?: boolean;
  limit?: number;
  offset?: number;
  /** The card's language; `title` and `subtitle` come back in it (§16H.7). */
  lang?: 'mm' | 'en';
}

/** One row as both the function and the preview return it (§16G.3). */
export interface NearbyItem {
  kind: string;
  ref_id: string;
  title: string;
  subtitle: string | null;
  /** The street address, which the SQL returns from the subtitle columns. */
  address: string | null;
  href: string;
  thumbnail_url: string | null;
  city_id: string | null;
  rating: number | null;
  /** The pin, so the Map view can draw it without a second lookup. */
  latitude: number | null;
  longitude: number | null;
  distance_km: number;
  open_now: boolean;
  closes_at: string | null;
}

export interface NearbyOutcome {
  items: NearbyItem[];
}

/** §16G.3's parameter names, so no call site spells one by hand. */
export function nearbyRpcArgs(request: NearbyRequest): Record<string, unknown> {
  return {
    p_lat: request.lat,
    p_lng: request.lng,
    p_radius_km: request.radiusKm ?? NEARBY_RADIUS_KM,
    p_kinds: request.kinds && request.kinds.length > 0 ? request.kinds : null,
    p_open_now: request.openNow ?? false,
    p_limit: request.limit ?? 20,
    p_offset: request.offset ?? 0,
    p_lang: request.lang ?? 'en',
  };
}

/**
 * A row as the page draws it. `open_now` comes from the clock rather than from
 * the seed, so a listing that closes at 17:00 stops saying "Open now" at 17:00
 * without a reload.
 */
export function toNearbyItem(row: SearchRow, from: LatLng, now: Date): NearbyItem {
  return {
    kind: row.kind,
    ref_id: row.id,
    title: row.title,
    subtitle: row.subtitle || null,
    address: row.address ?? row.subtitle ?? null,
    href: row.href,
    thumbnail_url: row.imageUrl ?? null,
    city_id: row.cityId,
    rating: row.rating,
    latitude: row.lat,
    longitude: row.lng,
    distance_km: distanceKm(from, { lat: row.lat, lng: row.lng }),
    open_now: isOpenAt(row.openTime, row.closeTime, now),
    closes_at: closesAt(row.closeTime),
  };
}

/** The preview's answer, in the envelope the function returns. */
export function previewNearby(request: NearbyRequest, index: SearchRow[] = SEARCH_INDEX, now = new Date()): NearbyOutcome {
  const radius = request.radiusKm ?? NEARBY_RADIUS_KM;
  const kinds = request.kinds && request.kinds.length > 0 ? new Set(request.kinds) : null;
  const from: LatLng = { lat: request.lat, lng: request.lng };
  const items = index
    .filter((row) => !kinds || kinds.has(row.kind))
    .map((row) => toNearbyItem(row, from, now))
    .filter((item) => item.distance_km <= radius)
    .filter((item) => !request.openNow || item.open_now)
    .sort((a, b) => a.distance_km - b.distance_km || (b.rating ?? 0) - (a.rating ?? 0));
  const offset = request.offset ?? 0;
  const limit = request.limit ?? 20;
  return { items: items.slice(offset, offset + limit) };
}

/**
 * The page's one call. With `VITE_BACKEND_SEARCH` off — or Supabase unset — the
 * preview answers, which is the same function the tests drive.
 */
export async function runNearby(request: NearbyRequest): Promise<{ ok: true; result: NearbyOutcome } | { ok: false; code: ErrorCode }> {
  if (!Number.isFinite(request.lat) || !Number.isFinite(request.lng)) {
    return { ok: false, code: 'search_error_location_required' };
  }
  const outcome = await rpcOrLocal<NearbyOutcome>(
    'search',
    'search_nearby',
    nearbyRpcArgs(request),
    () => previewNearby(request),
  );
  if (!outcome.ok) return { ok: false, code: outcome.code };
  return { ok: true, result: { items: Array.isArray(outcome.data?.items) ? outcome.data.items : [] } };
}

/** A hit from the search page's shape, so one card renders both. */
export function nearbyAsHit(item: NearbyItem): SearchHit {
  return {
    id: item.ref_id,
    kind: item.kind as SearchKind,
    cityId: (item.city_id ?? 'other') as SearchRow['cityId'],
    title: item.title,
    subtitle: item.subtitle ?? '',
    normText: '',
    rating: item.rating ?? 0,
    views: 0,
    boostWeight: 0,
    href: item.href,
    imageUrl: item.thumbnail_url ?? undefined,
    lat: item.latitude ?? 0,
    lng: item.longitude ?? 0,
    distanceKm: item.distance_km,
    score: 0,
  };
}
