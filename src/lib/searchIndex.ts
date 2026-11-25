import { BLOGS, POPULARS, TRAVEL_GUIDES, TRAVEL_PLANS } from '../data/homeData';
import {
  CITIES,
  POPULAR_BOOK_SHOPS,
  POPULAR_CAFES,
  POPULAR_HOTELS,
  POPULAR_MARKETS,
  POPULAR_RENTALS,
  POPULAR_RESTAURANTS,
  POPULAR_TRANSPORT,
  TOP_ATTRACTIONS,
} from '../data/cityPageData';
import { NEARBY_LISTINGS, type NearbyListing } from '../data/nearbyData';
import type { CardListing } from '../types';
import { findListingRow } from './listingRows';
import { MAX_QUERY_LENGTH, normalizeSearchText } from './searchText';
import { cityCenter, distanceKm as kmBetween, type LatLng } from './location';

/** §16H.6: the query limit lives with the normalizer, and is re-exported here. */
export { MAX_QUERY_LENGTH } from './searchText';

/**
 * Plan §16H.3, §16H.4, §16H.7, §16H.8 and §16H.10, ticket O-50. The search page
 * used a substring test over one flat list, so `hotle` found nothing and a
 * Zawgyi query never matched a Unicode row. This module is the local stand-in
 * for `search_index` and `search_all()`: the same rows, the same score table and
 * the same `interpreted` / `counts` result shape, so the page moves to the
 * function without changing what it renders.
 *
 * The index is built once from the seed modules. When §16C moves a module to
 * Supabase, its rows come from a trigger instead and this builder loses that
 * source — the query code below does not change.
 */

export type SearchKind =
  | 'hotels'
  | 'guesthouses'
  | 'restaurants'
  | 'cafes'
  | 'bars'
  | 'attractions'
  | 'markets'
  | 'bookshops'
  | 'transport'
  | 'rentals'
  | 'exchange'
  | 'hospitals'
  | 'clinics'
  | 'gyms'
  | 'blogs'
  | 'guides'
  | 'plans'
  | 'cities';

export type SearchCityId = 'yangon' | 'bago' | 'naypyidaw' | 'mandalay' | 'bagan' | 'inle' | 'other';

export interface SearchRow {
  id: string;
  kind: SearchKind;
  cityId: SearchCityId;
  title: string;
  subtitle: string;
  /** The normalized title, subtitle and keywords — what a substring test reads. */
  normText: string;
  rating: number;
  views: number;
  /** Plan §16H.7: −20 to 50, set by an Admin in the tuning screen. */
  boostWeight: number;
  /** Plan §16H.7: blogs and guides published in the last 30 days get +5. */
  publishedAt?: string;
  href: string;
  imageUrl?: string;
  priceUsd?: number;
  /** §16H.4: the row's own point, so `nearest` can measure from the reader. */
  lat: number;
  lng: number;
  /** Distance from the reader's point when one is known, else from the city. */
  distanceKm: number;
  /**
   * Plan §16H.4 and §16H.9: the two stored times, so Nearby can answer Open Now
   * itself instead of trusting a flag the seed froze. Null means unknown, which
   * `isOpenAt()` reads as closed.
   */
  openTime?: string | null;
  closeTime?: string | null;
  /** The street address a Nearby card shows; null when the source has none. */
  address?: string | null;
}

/** The catalogue an item's kind and city come from, kept readable as a table. */
type Source = { kind: SearchKind; rows: CardListing[]; city: (row: CardListing, index: number) => SearchCityId; keywords?: string };

/** The Nearby seed rows of one category, which the catalog modules do not carry. */
function nearbyOf(category: NearbyListing['category']): CardListing[] {
  return NEARBY_LISTINGS.filter((row) => row.category === category);
}

const SOURCES: Source[] = [
  { kind: 'plans', rows: TRAVEL_PLANS, city: () => 'yangon', keywords: 'plan trip tour package' },
  { kind: 'guides', rows: TRAVEL_GUIDES, city: () => 'yangon', keywords: 'guide itinerary' },
  { kind: 'blogs', rows: BLOGS, city: () => 'other', keywords: 'blog story article' },
  { kind: 'cities', rows: CITIES, city: (row) => cityIdFor(row), keywords: 'city destination' },
  { kind: 'attractions', rows: TOP_ATTRACTIONS, city: (row) => (row.title.toLowerCase().includes('bein') ? 'mandalay' : 'yangon'), keywords: 'attraction pagoda temple sight' },
  { kind: 'hotels', rows: POPULAR_HOTELS, city: (_row, index) => (index > 2 ? 'bago' : 'yangon'), keywords: 'hotel stay room' },
  { kind: 'restaurants', rows: POPULAR_RESTAURANTS, city: (_row, index) => (index % 2 === 1 ? 'bago' : 'yangon'), keywords: 'restaurant food dining' },
  { kind: 'bookshops', rows: POPULAR_BOOK_SHOPS, city: () => 'yangon', keywords: 'book shop bookshop' },
  { kind: 'cafes', rows: POPULAR_CAFES, city: () => 'yangon', keywords: 'cafe coffee tea' },
  { kind: 'markets', rows: POPULAR_MARKETS, city: () => 'yangon', keywords: 'market shopping' },
  { kind: 'rentals', rows: POPULAR_RENTALS, city: () => 'yangon', keywords: 'rental bike car hire' },
  { kind: 'transport', rows: POPULAR_TRANSPORT, city: (row) => (row.title.toLowerCase().includes('inle') ? 'other' : 'yangon'), keywords: 'transport bus car' },
  // The six kinds only the Nearby seed carries. §12's category row offers each
  // as its own chip, so each is its own kind here — the SQL does the same.
  { kind: 'guesthouses', rows: nearbyOf('guesthouse'), city: () => 'yangon', keywords: 'guesthouse stay room' },
  { kind: 'bars', rows: nearbyOf('bar'), city: () => 'yangon', keywords: 'bar drinks nightlife' },
  { kind: 'exchange', rows: nearbyOf('exchange'), city: () => 'yangon', keywords: 'exchange currency money' },
  { kind: 'hospitals', rows: nearbyOf('hospital'), city: () => 'yangon', keywords: 'hospital emergency health' },
  { kind: 'clinics', rows: nearbyOf('clinic'), city: () => 'yangon', keywords: 'clinic health doctor' },
  { kind: 'gyms', rows: nearbyOf('gym'), city: () => 'yangon', keywords: 'gym fitness training' },
  { kind: 'hotels', rows: POPULARS.filter((row) => row.href?.includes('/hotels/')), city: () => 'yangon' },
  { kind: 'bookshops', rows: POPULARS.filter((row) => row.href?.includes('/book-shops/')), city: () => 'yangon' },
  { kind: 'markets', rows: POPULARS.filter((row) => row.href?.includes('/markets/')), city: () => 'yangon' },
];

/**
 * The seed modules carry no coordinates, so a preview row sits at its city's
 * centre plus a small offset derived from its id. That keeps `nearest` from
 * returning one flat tie, and the offset is stable across reloads. A real row
 * brings its own latitude and longitude from `search_index`.
 */
function previewPoint(cityId: SearchCityId, id: string): LatLng {
  const center = cityCenter(cityId);
  // FNV-1a, so `ph1` and `ph2` land far apart: a multiply-and-add hash put
  // sequential ids within 50 m of each other and every hotel read "1.7 km".
  let hash = 0x811c9dc5;
  for (const char of id) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  // The finalizer matters: FNV alone leaves `ph1` and `ph2` one bit apart, so
  // the avalanche step is what actually separates them on the map.
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b) >>> 0;
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35) >>> 0;
  hash ^= hash >>> 16;
  // About 1.5 km each way, which is a believable in-city spread.
  const lat = ((hash & 0xffff) / 0xffff - 0.5) * 0.028;
  const lng = (((hash >>> 16) & 0xffff) / 0xffff - 0.5) * 0.028;
  return { lat: center.lat + lat, lng: center.lng + lng };
}

/** The city a city card names, by its id, so `bagan` is not `other`. */
function cityIdFor(row: CardListing): SearchCityId {
  const id = row.id as SearchCityId;
  return CITY_IDS.includes(id) ? id : 'other';
}

export const CITY_IDS: SearchCityId[] = ['yangon', 'bago', 'naypyidaw', 'mandalay', 'bagan', 'inle'];

/**
 * A seed href that names a page rather than one object. Three Nearby rows point
 * at `/nearby` because they have no detail page yet, so keying the duplicate
 * check on it dropped two of them; a page href is not an object identity.
 */
const PAGE_HREFS = new Set(['/nearby', '/search']);

/** The Nearby seed row behind an id, which is where the pin and the street are. */
function nearbyRecord(id: string): NearbyListing | undefined {
  return NEARBY_LISTINGS.find((row) => row.id === id);
}

/**
 * Plan §16H.4: one row per object, so a listing that appears in two seed
 * modules is still one result. The first source that names an id or a URL wins,
 * which keeps the more specific kind (`hotels` over the generic `populars` row).
 */
export function buildSearchIndex(): SearchRow[] {
  const rows = new Map<string, SearchRow>();
  // The Populars row and the catalogue row share a URL under two ids, so the
  // href is the object: keying on the id alone listed Lotte hotel twice.
  const seenHref = new Set<string>();
  for (const source of SOURCES) {
    source.rows.forEach((listing, index) => {
      if (rows.has(listing.id)) return;
      const detailHref = listing.href && !PAGE_HREFS.has(listing.href) ? listing.href : null;
      if (detailHref && seenHref.has(detailHref)) return;
      if (detailHref) seenHref.add(detailHref);
      const subtitle = listing.subtitle ?? '';
      const cityId = source.city(listing, index);
      const seed = nearbyRecord(listing.id);
      const point = seed ? { lat: seed.lat, lng: seed.lng } : previewPoint(cityId, listing.id);
      // §16H.9: the seed modules carry no hours, but the listing rows do — the
      // same table `SQL/20261202000100_search.sql` reads — so Nearby can judge
      // Open Now instead of trusting a frozen flag.
      const hours = findListingRow(listing.id);
      rows.set(listing.id, {
        id: listing.id,
        kind: source.kind,
        cityId,
        title: listing.title,
        subtitle,
        normText: normalizeSearchText([listing.title, subtitle, source.keywords ?? '', listing.href ?? ''].join(' ')),
        rating: listing.rating,
        views: listing.views,
        boostWeight: 0,
        href: listing.href ?? '/search',
        imageUrl: listing.imageUrl,
        priceUsd: listing.priceUsd,
        lat: point.lat,
        lng: point.lng,
        distanceKm: listing.distanceKm,
        openTime: hours?.open_time ?? null,
        closeTime: hours?.close_time ?? null,
        address: hours?.address ?? seed?.address ?? null,
      });
    });
  }
  return [...rows.values()];
}

export const SEARCH_INDEX: SearchRow[] = buildSearchIndex();

/** The kinds a result can be, in the order the chips show them. */
export const SEARCH_KINDS: SearchKind[] = [
  'hotels', 'guesthouses', 'restaurants', 'cafes', 'bars', 'attractions', 'markets',
  'bookshops', 'rentals', 'transport', 'exchange', 'hospitals', 'clinics', 'gyms',
  'plans', 'guides', 'blogs', 'cities',
];

/**
 * §16H.6: aliases are data, not code. These are the seed rows of
 * `search_aliases`; the Admin tuning screen writes the same table.
 */
export interface SearchAlias {
  term: string;
  kind: 'city' | 'category';
  target: string;
  active: boolean;
}

export const SEED_SEARCH_ALIASES: SearchAlias[] = [
  { term: 'hotel', kind: 'category', target: 'hotels', active: true },
  { term: 'hotels', kind: 'category', target: 'hotels', active: true },
  { term: 'ဟိုတယ်', kind: 'category', target: 'hotels', active: true },
  { term: 'ဟိုတယ်များ', kind: 'category', target: 'hotels', active: true },
  { term: 'guesthouse', kind: 'category', target: 'guesthouses', active: true },
  { term: 'guesthouses', kind: 'category', target: 'guesthouses', active: true },
  { term: 'restaurant', kind: 'category', target: 'restaurants', active: true },
  { term: 'restaurants', kind: 'category', target: 'restaurants', active: true },
  { term: 'စားသောက်ဆိုင်', kind: 'category', target: 'restaurants', active: true },
  { term: 'book', kind: 'category', target: 'bookshops', active: true },
  { term: 'bookshop', kind: 'category', target: 'bookshops', active: true },
  { term: 'bookshops', kind: 'category', target: 'bookshops', active: true },
  { term: 'cafe', kind: 'category', target: 'cafes', active: true },
  { term: 'cafes', kind: 'category', target: 'cafes', active: true },
  { term: 'ကဖေး', kind: 'category', target: 'cafes', active: true },
  { term: 'rental', kind: 'category', target: 'rentals', active: true },
  { term: 'rentals', kind: 'category', target: 'rentals', active: true },
  { term: 'ငှားရမ်း', kind: 'category', target: 'rentals', active: true },
  { term: 'bar', kind: 'category', target: 'bars', active: true },
  { term: 'bars', kind: 'category', target: 'bars', active: true },
  { term: 'attraction', kind: 'category', target: 'attractions', active: true },
  { term: 'attractions', kind: 'category', target: 'attractions', active: true },
  { term: 'market', kind: 'category', target: 'markets', active: true },
  { term: 'markets', kind: 'category', target: 'markets', active: true },
  { term: 'ဈေး', kind: 'category', target: 'markets', active: true },
  { term: 'exchange', kind: 'category', target: 'exchange', active: true },
  { term: 'hospital', kind: 'category', target: 'hospitals', active: true },
  { term: 'hospitals', kind: 'category', target: 'hospitals', active: true },
  { term: 'clinic', kind: 'category', target: 'clinics', active: true },
  { term: 'clinics', kind: 'category', target: 'clinics', active: true },
  { term: 'gym', kind: 'category', target: 'gyms', active: true },
  { term: 'gyms', kind: 'category', target: 'gyms', active: true },
  { term: 'plan', kind: 'category', target: 'plans', active: true },
  { term: 'plans', kind: 'category', target: 'plans', active: true },
  { term: 'guide', kind: 'category', target: 'guides', active: true },
  { term: 'guides', kind: 'category', target: 'guides', active: true },
  { term: 'blog', kind: 'category', target: 'blogs', active: true },
  { term: 'blogs', kind: 'category', target: 'blogs', active: true },
  { term: 'yangon', kind: 'city', target: 'yangon', active: true },
  { term: 'ရန်ကုန်', kind: 'city', target: 'yangon', active: true },
  { term: 'bago', kind: 'city', target: 'bago', active: true },
  { term: 'ပဲခူး', kind: 'city', target: 'bago', active: true },
  { term: 'naypyidaw', kind: 'city', target: 'naypyidaw', active: true },
  { term: 'nay pyi taw', kind: 'city', target: 'naypyidaw', active: true },
  { term: 'နေပြည်တော်', kind: 'city', target: 'naypyidaw', active: true },
  { term: 'mandalay', kind: 'city', target: 'mandalay', active: true },
  { term: 'မန္တလေး', kind: 'city', target: 'mandalay', active: true },
  { term: 'bagan', kind: 'city', target: 'bagan', active: true },
  { term: 'pagan', kind: 'city', target: 'bagan', active: true },
  { term: 'ပုဂံ', kind: 'city', target: 'bagan', active: true },
  { term: 'inle', kind: 'city', target: 'inle', active: true },
  { term: 'အင်းလေး', kind: 'city', target: 'inle', active: true },
];

export type SearchMode = 'city' | 'category' | 'city_category' | 'text' | 'browse';

export interface InterpretedQuery {
  mode: SearchMode;
  city?: SearchCityId;
  kind?: SearchKind;
  /** What is left to match on text after the aliases were lifted out. */
  text: string;
}

/**
 * §16H.6: a city alias and a category alias found in the query become filters
 * and are removed from the text part. The mode falls out of what was found, so
 * the page never has to guess. Aliases are matched longest-first, so `hotels`
 * does not leave a stray `s` behind.
 */
export function interpretQuery(
  query: string,
  aliases: SearchAlias[] = SEED_SEARCH_ALIASES,
): InterpretedQuery {
  const normalized = normalizeSearchText(query);
  if (!normalized) return { mode: 'browse', text: '' };

  const active = aliases
    .filter((alias) => alias.active)
    .map((alias) => ({ ...alias, norm: normalizeSearchText(alias.term) }))
    .filter((alias) => alias.norm.length > 0)
    .sort((a, b) => b.norm.length - a.norm.length);

  let rest = ` ${normalized} `;
  let city: SearchCityId | undefined;
  let kind: SearchKind | undefined;

  for (const alias of active) {
    if (city && kind) break;
    // A Latin alias must stand alone, or `bar` would fire inside `bagan`.
    const isLatin = /^[a-z0-9 ]+$/.test(alias.norm);
    const needle = isLatin ? ` ${alias.norm} ` : alias.norm;
    if (!rest.includes(needle)) continue;
    if (alias.kind === 'city' && !city) {
      if (!CITY_IDS.includes(alias.target as SearchCityId)) continue;
      city = alias.target as SearchCityId;
      rest = rest.replace(needle, ' ');
    } else if (alias.kind === 'category' && !kind) {
      if (!SEARCH_KINDS.includes(alias.target as SearchKind)) continue;
      kind = alias.target as SearchKind;
      rest = rest.replace(needle, ' ');
    }
  }

  // §16H.6's "common variants": a single mistyped letter still names the alias,
  // so `hotle` is the hotels category rather than a word that matches nothing.
  if (!city || !kind) {
    for (const word of rest.trim().split(/\s+/)) {
      const near = fuzzyAliasFor(word, active);
      if (!near) continue;
      if (near.kind === 'city' && !city) city = near.target as SearchCityId;
      else if (near.kind === 'category' && !kind) kind = near.target as SearchKind;
      else continue;
      rest = rest.replace(word, ' ');
      if (city && kind) break;
    }
  }

  const text = rest.replace(/\s+/g, ' ').trim();
  if (city && kind) return { mode: 'city_category', city, kind, text };
  if (city) return { mode: 'city', city, text };
  if (kind) return { mode: 'category', kind, text };
  return { mode: 'text', text };
}

/**
 * §16H.6: the alias a single typo still names. Only Latin words of four or more
 * letters are considered — a Myanmar syllable is several code points, so one
 * edit there is far more likely to be a different word — and the answer must be
 * unambiguous, or a word that sits between two targets names neither.
 */
function fuzzyAliasFor(
  word: string,
  active: (SearchAlias & { norm: string })[],
): { kind: SearchAlias['kind']; target: string } | undefined {
  if (!/^[a-z]{4,}$/.test(word)) return undefined;
  const hits = active.filter(
    (alias) => /^[a-z]{4,}$/.test(alias.norm) && withinOneEdit(alias.norm, word),
  );
  const targets = new Set(hits.map((hit) => `${hit.kind}:${hit.target}`));
  if (targets.size !== 1) return undefined;
  return { kind: hits[0].kind, target: hits[0].target };
}

/** Damerau–Levenshtein within one edit, with an early exit on a length gap. */
export function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const grid: number[][] = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      grid[i][j] = Math.min(grid[i - 1][j] + 1, grid[i][j - 1] + 1, grid[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        grid[i][j] = Math.min(grid[i][j], grid[i - 2][j - 2] + 1);
      }
    }
  }
  return grid[rows - 1][cols - 1] <= 1;
}

/*
 * Sørensen–Dice over padded character bigrams — the local stand-in for the
 * `similarity()` the index uses. Bigrams rather than trigrams because a Myanmar
 * syllable is often two code points, so a trigram is already a whole word.
 */
export function trigramSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  // Built per code point: a Myanmar syllable is often two UTF-16 units, so
  // slicing the string by index would split a character in half.
  const grams = (text: string) => {
    const chars = [...` ${text} `];
    return chars.slice(0, -1).map((char, index) => char + chars[index + 1]);
  };
  const left = grams(a);
  const rightGrams = grams(b);
  // A multiset, so `aa` sharing two bigrams with `aaa` counts twice.
  const right = new Map<string, number>();
  for (const gram of rightGrams) right.set(gram, (right.get(gram) ?? 0) + 1);
  let shared = 0;
  for (const gram of left) {
    const count = right.get(gram) ?? 0;
    if (count > 0) {
      shared += 1;
      right.set(gram, count - 1);
    }
  }
  return (2 * shared) / (left.length + rightGrams.length);
}

/** §16H.7: at least 0.3 title similarity makes an item a candidate. */
export const CANDIDATE_SIMILARITY = 0.3;

/**
 * §16H.10's "did you mean" needs a *lower* bar than the candidate test, or it
 * could never fire: a title within 0.3 of the query is already a match, so a
 * zero-result page only has titles below it. 0.15 is far enough down to catch a
 * mistyped word and high enough to stay quiet on unrelated text.
 */
export const DID_YOU_MEAN_SIMILARITY = 0.15;

/** §16H.7's four sorts. `relevance` is the default and needs no location. */
export type SearchSort = 'relevance' | 'rating' | 'nearest' | 'newest';

export interface SearchParams {
  query: string;
  kind?: SearchKind | 'all';
  city?: SearchCityId | 'all';
  sort?: SearchSort;
  /** §16H.7: `nearest` refuses without one; with one it also breaks ties. */
  hasLocation?: boolean;
  /** The point distances are measured from, when the reader has one. */
  location?: LatLng;
  now?: Date;
}

export interface SearchHit extends SearchRow {
  score: number;
}

export interface SearchResult {
  interpreted: InterpretedQuery;
  hits: SearchHit[];
  /** §16H.8: the number of matches per kind for the same query. */
  counts: Record<SearchKind, number>;
  /** The city counts a `category` query shows as cards (§16H.6). */
  cityCounts: { city: SearchCityId; count: number }[];
  /** §16H.10: the closest title when nothing matched. */
  didYouMean?: string;
  problem?: 'search_error_query_too_long' | 'search_error_location_required';
}

const EMPTY_COUNTS = (): Record<SearchKind, number> =>
  Object.fromEntries(SEARCH_KINDS.map((kind) => [kind, 0])) as Record<SearchKind, number>;

/**
 * §16H.7's score table, in its order. Every part is a sum, so a boosted item
 * still wins on relevance rather than on the boost alone.
 */
export function scoreRow(row: SearchRow, interpreted: InterpretedQuery, now = new Date()): number {
  const query = interpreted.text;
  if (!query) {
    // A browse (a city or a category alone) is ordered by rank, so rating and
    // views carry it and the boost still applies.
    return rankScore(row, now);
  }
  let score = 0;
  if (row.normText === query) score += 100;
  else if (row.normText.startsWith(query)) score += 60;
  const titleSim = trigramSimilarity(normalizeSearchText(row.title), query);
  if (titleSim > 0) score += titleSim * 50;
  const textSim = trigramSimilarity(row.normText, query);
  if (textSim > 0) score += textSim * 20;
  if (interpreted.city && row.cityId === interpreted.city) score += 10;
  if (interpreted.kind && row.kind === interpreted.kind) score += 10;
  return score + rankScore(row, now);
}

/** The parts of the score that do not depend on the query text. */
function rankScore(row: SearchRow, now: Date): number {
  const rating = row.rating * 2;
  const views = Math.min(8, Math.log10(row.views + 1) * 2);
  const fresh = isFresh(row, now) ? 5 : 0;
  return rating + views + fresh + row.boostWeight;
}

/** A blog or guide published in the last 30 days (§16H.7). */
function isFresh(row: SearchRow, now: Date): boolean {
  if (row.kind !== 'blogs' && row.kind !== 'guides') return false;
  if (!row.publishedAt) return true;
  const published = Date.parse(row.publishedAt);
  if (Number.isNaN(published)) return false;
  return now.getTime() - published <= 30 * 24 * 60 * 60 * 1000;
}

/** §16H.7: substring, title similarity, or a close-enough text similarity. */
function isCandidate(row: SearchRow, query: string): boolean {
  if (!query) return true;
  if (row.normText.includes(query)) return true;
  if (trigramSimilarity(normalizeSearchText(row.title), query) >= CANDIDATE_SIMILARITY) return true;
  return trigramSimilarity(row.normText, query) >= CANDIDATE_SIMILARITY;
}

export const PAGE_SIZE = 20;
export const MAX_RESULTS = 50;

/**
 * `search_all()` as the page uses it. The order of the steps is the Plan's:
 * interpret, filter, score, sort, then count. Counts are taken after the
 * filters, so a chip never promises more than its list shows.
 */
export function searchAll(
  params: SearchParams,
  index: SearchRow[] = SEARCH_INDEX,
  aliases: SearchAlias[] = SEED_SEARCH_ALIASES,
): SearchResult {
  const now = params.now ?? new Date();
  const interpreted = interpretQuery(params.query, aliases);
  const counts = EMPTY_COUNTS();
  const cityCounts = new Map<SearchCityId, number>();
  const sort = params.sort ?? 'relevance';

  if ([...params.query].length > MAX_QUERY_LENGTH) {
    return { interpreted, hits: [], counts, cityCounts: [], problem: 'search_error_query_too_long' };
  }
  if (sort === 'nearest' && !params.hasLocation) {
    return { interpreted, hits: [], counts, cityCounts: [], problem: 'search_error_location_required' };
  }

  const kind = params.kind && params.kind !== 'all' ? params.kind : undefined;
  const city = params.city && params.city !== 'all' ? params.city : undefined;

  // §16H.6: a category-only query shows city cards, and choosing one drills in.
  // The query still says `hotels`, so without this the drill-down would return
  // the same cards: the reader clicks Yangon and the page does not move.
  if (city && CITY_IDS.includes(city as SearchCityId) && interpreted.kind && !interpreted.city) {
    interpreted.mode = 'city_category';
    interpreted.city = city as SearchCityId;
  }

  const candidates = index.filter((row) => {
    if (kind && row.kind !== kind) return false;
    if (city && row.cityId !== city) return false;
    if (interpreted.kind && row.kind !== interpreted.kind) return false;
    if (interpreted.city && row.cityId !== interpreted.city) return false;
    return isCandidate(row, interpreted.text);
  });

  for (const row of candidates) {
    counts[row.kind] += 1;
    cityCounts.set(row.cityId, (cityCounts.get(row.cityId) ?? 0) + 1);
  }

  let hits: SearchHit[] = candidates.map((row) => {
    const distance = params.location ? kmBetween(params.location, { lat: row.lat, lng: row.lng }) : row.distanceKm;
    return { ...row, distanceKm: distance, score: scoreRow(row, interpreted, now) };
  });

  hits = hits.sort((a, b) => {
    if (sort === 'rating') return b.rating - a.rating || b.score - a.score;
    if (sort === 'nearest') return a.distanceKm - b.distanceKm || b.score - a.score;
    if (sort === 'newest') return (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '') || b.score - a.score;
    // §16H.7: ties go to the higher rating, then the title; a reader who gave a
    // location gets the closer of two equal items first.
    const distance = params.location ? a.distanceKm - b.distanceKm : 0;
    return b.score - a.score || distance || b.rating - a.rating || a.title.localeCompare(b.title);
  });

  const didYouMean = hits.length === 0 && interpreted.text
    ? closestTitle(interpreted.text, index)
    : undefined;

  return {
    interpreted,
    hits: hits.slice(0, MAX_RESULTS),
    counts,
    cityCounts: [...cityCounts.entries()]
      .map(([id, count]) => ({ city: id, count }))
      .sort((a, b) => b.count - a.count),
    didYouMean,
  };
}

/** §16H.10: "did you mean" — the best title close enough to be worth offering. */
export function closestTitle(query: string, index: SearchRow[] = SEARCH_INDEX): string | undefined {
  let best: { title: string; similarity: number } | undefined;
  for (const row of index) {
    const similarity = trigramSimilarity(normalizeSearchText(row.title), query);
    if (similarity < DID_YOU_MEAN_SIMILARITY) continue;
    if (!best || similarity > best.similarity) best = { title: row.title, similarity };
  }
  return best?.title;
}

/** §16H.10: suggestions after two characters, best first. */
export const SUGGEST_MIN_LENGTH = 2;

export function suggest(
  query: string,
  index: SearchRow[] = SEARCH_INDEX,
  aliases: SearchAlias[] = SEED_SEARCH_ALIASES,
  limit = 6,
): string[] {
  const normalized = normalizeSearchText(query);
  if ([...normalized].length < SUGGEST_MIN_LENGTH) return [];
  const seen = new Set<string>();
  const out: { text: string; score: number }[] = [];
  for (const row of index) {
    if (!row.normText.includes(normalized) && trigramSimilarity(row.normText, normalized) < CANDIDATE_SIMILARITY) continue;
    const text = row.title;
    if (seen.has(text)) continue;
    seen.add(text);
    out.push({ text, score: scoreRow(row, { mode: 'text', text: normalized }) });
  }
  for (const alias of aliases) {
    if (!alias.active || !alias.term.toLowerCase().includes(normalized)) continue;
    if (seen.has(alias.term)) continue;
    seen.add(alias.term);
    out.push({ text: alias.term, score: 1000 });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit).map((entry) => entry.text);
}

/**
 * §16H.10: the last 8 searches, on the device only, with a Clear button. The
 * stored text is the normalized query, never the raw typing, so a stored row is
 * what `search_log` would hold too (§16H.11).
 */
export const RECENT_SEARCHES_KEY = 'mh-travel-recent-searches';
export const RECENT_SEARCHES_MAX = 8;

export function readRecentSearches(store: Storage | null = safeStorage()): string[] {
  if (!store) return [];
  try {
    const raw = store.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string').slice(0, RECENT_SEARCHES_MAX);
  } catch {
    return [];
  }
}

export function rememberSearch(query: string, store: Storage | null = safeStorage()): string[] {
  const normalized = normalizeSearchText(query);
  if (!store || !normalized) return readRecentSearches(store);
  const next = [normalized, ...readRecentSearches(store).filter((item) => item !== normalized)]
    .slice(0, RECENT_SEARCHES_MAX);
  store.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  return next;
}

export function clearRecentSearches(store: Storage | null = safeStorage()): string[] {
  store?.removeItem(RECENT_SEARCHES_KEY);
  return [];
}

function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
