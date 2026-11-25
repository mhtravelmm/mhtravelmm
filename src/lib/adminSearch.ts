import { createCollection } from './collection';

/**
 * Plan §16H.11 and §3A.12, ticket O-67. Search tuning: alias rows (a term the
 * reader types mapped to the thing it means), boost weights per category, and
 * the report of what people searched for.
 *
 * An alias is a suggestion, not a rewrite: `search_aliases` is read by the
 * search function, and a row that is switched off is ignored without being
 * deleted, so turning it back on needs no retyping.
 */

export type AliasKind = 'listing' | 'city' | 'category' | 'guide';

export interface SearchAliasRow {
  id: string;
  term: string;
  target: string;
  kind: AliasKind;
  active: boolean;
  updated_at: string;
  updated_by: string;
}

export const SEED_ALIASES: SearchAliasRow[] = [
  { id: 'al-1', term: 'shwedagon', target: 'Shwedagon Pagoda', kind: 'listing', active: true, updated_at: '2026-10-02T02:00:00.000Z', updated_by: 'Super Admin' },
  { id: 'al-2', term: 'pagoda', target: 'Attraction', kind: 'category', active: true, updated_at: '2026-10-02T02:00:00.000Z', updated_by: 'Super Admin' },
  { id: 'al-3', term: 'inle', target: 'Inle Lake', kind: 'city', active: true, updated_at: '2026-10-02T02:00:00.000Z', updated_by: 'Super Admin' },
  { id: 'al-4', term: 'ngwe saung', target: 'Ngwesaung', kind: 'city', active: false, updated_at: '2026-10-09T02:00:00.000Z', updated_by: 'Super Admin' },
];

export const searchAliases = createCollection<SearchAliasRow>({
  key: 'mh-travel-search-aliases',
  seed: SEED_ALIASES,
  id: (row) => row.id,
  isRow: (value): value is SearchAliasRow => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<SearchAliasRow>;
    return typeof row.id === 'string' && typeof row.term === 'string' && typeof row.target === 'string';
  },
  normalize: (row, seed) => ({ ...(seed ?? row), ...row, active: row.active ?? true }),
});

export const BOOST_MIN = -20;
export const BOOST_MAX = 50;

export interface SearchBoostRow {
  id: string;
  /** The listing category, city or field the weight applies to. */
  key: string;
  label: string;
  weight: number;
  updated_at: string;
  updated_by: string;
}

export const SEED_BOOSTS: SearchBoostRow[] = [
  { id: 'bo-1', key: 'listing.name', label: 'Listing name', weight: 20, updated_at: '2026-10-02T02:00:00.000Z', updated_by: 'Super Admin' },
  { id: 'bo-2', key: 'listing.city', label: 'City', weight: 10, updated_at: '2026-10-02T02:00:00.000Z', updated_by: 'Super Admin' },
  { id: 'bo-3', key: 'listing.description', label: 'Description', weight: 0, updated_at: '2026-10-02T02:00:00.000Z', updated_by: 'Super Admin' },
  { id: 'bo-4', key: 'blog.title', label: 'Blog title', weight: 5, updated_at: '2026-10-02T02:00:00.000Z', updated_by: 'Super Admin' },
];

export const searchBoosts = createCollection<SearchBoostRow>({
  key: 'mh-travel-search-boosts',
  seed: SEED_BOOSTS,
  id: (row) => row.id,
  isRow: (value): value is SearchBoostRow => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<SearchBoostRow>;
    return typeof row.id === 'string' && typeof row.key === 'string' && typeof row.weight === 'number';
  },
  normalize: (row, seed) => ({ ...(seed ?? row), ...row }),
});

export type AliasProblem = 'term_required' | 'target_required' | 'term_duplicate';

export function aliasProblem(draft: Pick<SearchAliasRow, 'term' | 'target' | 'id'>, rows: SearchAliasRow[]): AliasProblem | null {
  const term = draft.term.trim().toLowerCase();
  if (!term) return 'term_required';
  if (!draft.target.trim()) return 'target_required';
  if (rows.some((row) => row.id !== draft.id && row.term.trim().toLowerCase() === term)) return 'term_duplicate';
  return null;
}

export function boostValid(weight: number): boolean {
  return Number.isFinite(weight) && weight >= BOOST_MIN && weight <= BOOST_MAX;
}

export interface SearchQueryStat {
  query: string;
  results: number;
  clicks: number;
}

/**
 * `search_log` rows as the report's per-query rows: one row per normalized
 * query, the results it produced and how often it was clicked. Aggregating here
 * rather than in the panel keeps the preview and the server report on one shape.
 */
export function statsFromLog(
  rows: { q_normalized: string; result_count: number; clicked_ref: string | null }[],
): SearchQueryStat[] {
  const byQuery = new Map<string, SearchQueryStat>();
  for (const row of rows) {
    const entry = byQuery.get(row.q_normalized) ?? { query: row.q_normalized, results: 0, clicks: 0 };
    entry.results += Math.max(0, row.result_count);
    if (row.clicked_ref) entry.clicks += 1;
    byQuery.set(row.q_normalized, entry);
  }
  return [...byQuery.values()];
}

/** The report rows. No events yet means no rows, never a sample (§3A.2 rule 4). */
export function searchReport(rows: SearchQueryStat[]): {
  top: SearchQueryStat[];
  zero: SearchQueryStat[];
  ctr: number;
} {
  const top = [...rows].sort((a, b) => b.clicks - a.clicks).slice(0, 10);
  const zero = rows.filter((row) => row.results === 0).slice(0, 10);
  const impressions = rows.reduce((sum, row) => sum + row.results, 0);
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  return { top, zero, ctr: impressions === 0 ? 0 : Math.round((clicks / impressions) * 1000) / 10 };
}
