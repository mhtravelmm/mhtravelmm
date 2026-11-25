import { rpcOrLocal } from './backend';
import { createCollection } from './collection';
import { MAX_QUERY_LENGTH, normalizeSearchText } from './searchText';

/**
 * Plan §16H.11, ticket O-50. `search_log` records what was searched, so the
 * Admin report can answer "what do people look for and not find". Two rules
 * shape this file:
 *
 *  - the stored text is the **normalized** query and nothing else — no user id,
 *    no IP, no raw input — because a query is often a place someone lives;
 *  - the write never blocks or breaks a search. A reader who is offline, or a
 *    project without M-50 applied, still gets their results.
 */

export interface SearchLogRow {
  id: string;
  /** ISO instant. */
  at: string;
  q_normalized: string;
  lang: 'mm' | 'en';
  kind: string | null;
  result_count: number;
  clicked_ref: string | null;
}

/** The 90 days §16H.11 keeps. Anything older is dropped by the server job. */
export const SEARCH_LOG_RETENTION_DAYS = 90;

/**
 * The browser log. It exists for two reasons: the preview must be able to show
 * a non-empty report, and a query typed while the server is unreachable is
 * still worth keeping until the next successful call. It holds the same columns
 * as the table, so nothing has to be translated to display it.
 */
export const searchLog = createCollection<SearchLogRow>({
  key: 'mh-travel-search-log',
  seed: [],
  id: (row) => row.id,
  isRow: (value): value is SearchLogRow => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<SearchLogRow>;
    return typeof row.id === 'string' && typeof row.q_normalized === 'string' && typeof row.at === 'string';
  },
  mergeSeed: false,
});

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * The rows a report reads: the browser log, cut to the retention window, oldest
 * first. A row with no date or an unparseable one is dropped rather than shown
 * at the wrong end of the range.
 */
export function recentLogRows(rows: SearchLogRow[], now = new Date()): SearchLogRow[] {
  const cutoff = now.getTime() - SEARCH_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return rows
    .filter((row) => {
      const at = Date.parse(row.at);
      return Number.isFinite(at) && at >= cutoff && at <= now.getTime();
    })
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

/**
 * §16H.11: a query is logged only when it is worth reading later — two
 * characters or more, no longer than the search box allows, and not a repeat of
 * the row that was just written (a debounce can fire the same query twice).
 */
export function shouldLog(query: string, previous: SearchLogRow | undefined): boolean {
  const normalized = normalizeSearchText(query);
  if ([...normalized].length < 2 || normalized.length > MAX_QUERY_LENGTH) return false;
  if (!previous) return true;
  return previous.q_normalized !== normalized;
}

export interface LogSearchInput {
  q: string;
  lang: 'mm' | 'en';
  kind?: string | null;
  resultCount: number;
}

/**
 * Records one search and returns the id a later click can name. With
 * `VITE_BACKEND_SEARCH` on the id is the `search_log` row's; otherwise it is the
 * browser row's. Either way the caller only has an opaque string.
 */
export async function logSearch(input: LogSearchInput, rows: SearchLogRow[] = searchLog.read()): Promise<string | null> {
  const normalized = normalizeSearchText(input.q);
  if (!shouldLog(input.q, rows[rows.length - 1])) return null;

  const local: SearchLogRow = {
    id: newId(),
    at: new Date().toISOString(),
    q_normalized: normalized,
    lang: input.lang,
    kind: input.kind ?? null,
    result_count: Math.max(0, Math.trunc(input.resultCount)),
    clicked_ref: null,
  };
  searchLog.write([...rows, local].slice(-500));

  const outcome = await rpcOrLocal<unknown>(
    'search',
    'log_search',
    {
      p_q: normalized,
      p_lang: input.lang,
      p_kind: input.kind ?? null,
      p_result_count: local.result_count,
    },
    () => local.id,
  );
  if (outcome.ok && typeof outcome.data === 'string' && outcome.data) return outcome.data;
  return local.id;
}

/**
 * §16H.11's click-through: the search row already exists, so a click names it.
 * A row the reader never clicked keeps `clicked_ref` null, which is what makes
 * "searched but did not click" countable at all.
 */
export async function logSearchClick(id: string | null, ref: string): Promise<void> {
  if (!id) return;
  const rows = searchLog.read();
  const index = rows.findIndex((row) => row.id === id);
  if (index >= 0) {
    const next = [...rows];
    next[index] = { ...next[index], clicked_ref: ref.slice(0, 120) };
    searchLog.write(next);
  }
  await rpcOrLocal<unknown>('search', 'log_search_click', { p_id: id, p_ref: ref.slice(0, 120) }, () => null);
}

/** The Clear button on the tuning panel: the browser rows only, never the server. */
export function clearSearchLog(): SearchLogRow[] {
  return searchLog.reset();
}
