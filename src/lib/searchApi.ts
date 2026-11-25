import type { Language } from '../types';
import { rpcOrLocal, type ErrorCode } from './backend';
import { cityCenter } from './location';
import {
  MAX_QUERY_LENGTH,
  searchAll,
  suggest,
  type SearchCityId,
  type SearchHit,
  type SearchKind,
  type SearchResult,
  type SearchRow,
  type SearchSort,
} from './searchIndex';
import { normalizeSearchText } from './searchText';

/**
 * Plan §16G.3 and §16H.8, ticket O-50. `search_all` is the one function the
 * search page calls. This module is the seam: it turns the page's state into
 * the function's arguments, turns the payload back into the same `SearchResult`
 * the local preview returns, and lets `rpcOrLocal` decide which of the two
 * answers.
 *
 * Both paths reach the page in one shape, so a screen written against the
 * preview keeps working when `VITE_BACKEND_SEARCH` turns on.
 */

export type SearchSortMode = SearchSort;

export interface SearchRequest {
  q: string;
  city?: string;
  kind?: string;
  sort?: SearchSortMode;
  /** The reader's point, when one is known; `nearest` needs it. */
  lat?: number;
  lng?: number;
  limit?: number;
  offset?: number;
  lang?: Language;
}

/** The item shape `search_all` returns (§16G.3). */
export interface RemoteSearchItem {
  kind: string;
  ref_id: string;
  title: string;
  subtitle: string | null;
  href: string;
  thumbnail_url: string | null;
  city_id: string | null;
  rating: number | null;
  distance_km: number | null;
  score: number | null;
}

export interface RemoteSearchPayload {
  items: RemoteSearchItem[];
  counts: Record<string, number> | null;
  interpreted: { mode?: string; city?: string | null; kind?: string | null; text?: string | null } | null;
  city_counts: Record<string, number> | null;
  next_offset: number | null;
}

/** §16G.3's parameter names, so no call site spells one by hand. */
export function searchRpcArgs(request: SearchRequest): Record<string, unknown> {
  return {
    // §16H.5: the query travels normalized. `normalize_search_text()` covers the
    // six other steps but not the 115-rule Zawgyi conversion, which only the
    // client has (`src/lib/zawgyi.ts`); sending the typed text would match
    // nothing for a reader on a Zawgyi keyboard. Normalizing twice is safe —
    // the function is idempotent on its own output.
    p_q: normalizeSearchText(request.q),
    p_lang: request.lang ?? 'en',
    p_city: request.city ?? null,
    p_kinds: request.kind ? [request.kind] : null,
    p_sort: request.sort ?? 'relevance',
    p_lat: request.lat ?? null,
    p_lng: request.lng ?? null,
    p_limit: request.limit ?? 20,
    p_offset: request.offset ?? 0,
  };
}

const MODES: SearchResult['interpreted']['mode'][] = ['city', 'category', 'city_category', 'text', 'browse'];

function modeOf(value: string | null | undefined): SearchResult['interpreted']['mode'] {
  return MODES.includes(value as SearchResult['interpreted']['mode'])
    ? (value as SearchResult['interpreted']['mode'])
    : 'text';
}

/** The payload carries no coordinates, so a server hit is measured from its city. */
export function toSearchHit(item: RemoteSearchItem, cityId: SearchCityId): SearchHit {
  const point = cityCenter(cityId);
  const row: SearchRow = {
    id: item.ref_id,
    kind: item.kind as SearchKind,
    cityId,
    title: item.title,
    subtitle: item.subtitle ?? '',
    normText: '',
    rating: item.rating ?? 0,
    views: 0,
    boostWeight: 0,
    href: item.href || '/search',
    imageUrl: item.thumbnail_url ?? undefined,
    lat: point.lat,
    lng: point.lng,
    distanceKm: item.distance_km ?? 0,
  };
  return { ...row, score: item.score ?? 0 };
}

const COUNT_KINDS: SearchKind[] = [
  'hotels', 'restaurants', 'bookshops', 'cafes', 'rentals', 'attractions', 'markets',
  'transport', 'plans', 'guides', 'blogs', 'cities',
];

/**
 * The payload → `SearchResult`. A missing or unknown count reads as zero, so a
 * chip never shows a number its own list does not have.
 */
export function fromRemoteSearch(payload: RemoteSearchPayload, request: SearchRequest): SearchResult {
  const items = Array.isArray(payload.items) ? payload.items : [];
  const hits = items.map((item) => toSearchHit(item, (item.city_id ?? 'other') as SearchCityId));
  const counts = Object.fromEntries(
    COUNT_KINDS.map((kind) => [kind, Number(payload.counts?.[kind] ?? 0)]),
  ) as SearchResult['counts'];
  const cityCounts = Object.entries(payload.city_counts ?? {})
    .map(([city, count]) => ({ city: city as SearchCityId, count: Number(count) }))
    .filter((entry) => Number.isFinite(entry.count))
    .sort((a, b) => b.count - a.count);
  const interpreted = payload.interpreted ?? {};
  return {
    interpreted: {
      mode: modeOf(interpreted.mode),
      city: (interpreted.city ?? undefined) as SearchCityId | undefined,
      kind: (interpreted.kind ?? undefined) as SearchKind | undefined,
      text: interpreted.text ?? request.q,
    },
    hits,
    counts,
    cityCounts,
  };
}

export type SearchOutcome =
  | { ok: true; result: SearchResult }
  | { ok: false; code: ErrorCode };

/**
 * The two refusals the page can know without asking anyone (§16H.6, §16H.7).
 * Checked here so the preview and the server refuse in the same words, and so a
 * refusal never travels as an empty list that would read as "no matches".
 */
export function refusalFor(request: SearchRequest): ErrorCode | undefined {
  if ([...request.q].length > MAX_QUERY_LENGTH) return 'search_error_query_too_long';
  if (request.sort === 'nearest' && (request.lat === undefined || request.lng === undefined)) {
    return 'search_error_location_required';
  }
  return undefined;
}

/** The preview's answer, in the envelope the function returns, so one mapper covers both. */
export function previewPayload(request: SearchRequest): RemoteSearchPayload {
  const hasLocation = request.lat !== undefined && request.lng !== undefined;
  const result = searchAll({
    query: request.q,
    kind: (request.kind ?? 'all') as SearchKind | 'all',
    city: (request.city ?? 'all') as SearchCityId | 'all',
    sort: request.sort ?? 'relevance',
    hasLocation,
    location: hasLocation ? { lat: request.lat!, lng: request.lng! } : undefined,
  });
  return {
    items: result.hits.map((hit) => ({
      kind: hit.kind,
      ref_id: hit.id,
      title: hit.title,
      subtitle: hit.subtitle,
      href: hit.href,
      thumbnail_url: hit.imageUrl ?? null,
      city_id: hit.cityId,
      rating: hit.rating,
      distance_km: hit.distanceKm,
      score: hit.score,
    })),
    counts: result.counts,
    interpreted: result.interpreted,
    city_counts: Object.fromEntries(result.cityCounts.map((entry) => [entry.city, entry.count])),
    next_offset: null,
  };
}

/**
 * The page's one call. With `VITE_BACKEND_SEARCH` off — or Supabase unset — the
 * preview answers from the seeded index, which is the same function the tests
 * drive.
 */
export async function runSearch(request: SearchRequest): Promise<SearchOutcome> {
  const refusal = refusalFor(request);
  if (refusal) return { ok: false, code: refusal };
  const outcome = await rpcOrLocal<RemoteSearchPayload>(
    'search',
    'search_all',
    searchRpcArgs(request),
    () => previewPayload(request),
  );
  if (!outcome.ok) return { ok: false, code: outcome.code };
  return { ok: true, result: fromRemoteSearch(outcome.data, request) };
}

/** One row `search_suggest()` returns (§16H.8). */
export interface RemoteSuggestion {
  text: string;
  kind: string | null;
  href: string | null;
}

/**
 * §16H.8's prefix suggestions. The function looks at `norm_text` with `pg_trgm`
 * and at the alias table, so an alias an Admin just added is suggested before
 * the page's own seed has it. The preview's `suggest()` answers while the flag
 * is off, and both arrive as one `string[]` because the page only renders text.
 */
export async function runSuggest(
  prefix: string,
  lang: Language = 'en',
  limit = 6,
): Promise<string[]> {
  if ([...normalizeSearchText(prefix)].length < 2) return [];
  const outcome = await rpcOrLocal<RemoteSuggestion[]>(
    'search',
    'search_suggest',
    { p_prefix: normalizeSearchText(prefix), p_lang: lang, p_limit: limit },
    () => suggest(prefix).map((text) => ({ text, kind: null, href: null })),
  );
  if (!outcome.ok) return suggest(prefix);
  const rows = Array.isArray(outcome.data) ? outcome.data : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of rows) {
    const text = typeof row?.text === 'string' ? row.text : '';
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out.slice(0, limit);
}
