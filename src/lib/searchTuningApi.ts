import {
  codeFromRpcError,
  errorKeyFor,
  rpc,
  serverAvailable,
  type ErrorCode,
} from './backend';
import { supabase } from './supabase';
import type { AliasKind, SearchAliasRow, SearchQueryStat } from './adminSearch';

const ALIAS_TABLE = 'search_aliases';

/**
 * Plan §16H.11 and §3A.12, ticket O-52. The Search tuning screen reads and
 * writes `search_aliases`, `set_search_boost`, `get_search_report` and
 * `rebuild_search_index`. This module is the seam, the way `searchApi.ts` is for
 * the page: the panel asks in the shape it already renders, and the browser
 * collection answers while `VITE_BACKEND_SEARCH` is off or M-50 is unapplied.
 *
 * Two shape differences the seam hides:
 *
 *  - `search_aliases.kind` is `city` / `category` / `synonym`, while the panel
 *    names a target `listing`, `city`, `category` or `guide`. A listing alias and
 *    a guide alias are both a synonym to the function, which looks for the term
 *    in the query text and names an object.
 *  - a boost belongs to one index row (`kind` + `ref_id`), so the panel's boost
 *    rows carry both and every save names the object the function lifts.
 */

/** The SQL kind for a panel kind: a listing and a guide are both synonyms. */
export function sqlAliasKind(kind: AliasKind): 'city' | 'category' | 'synonym' {
  if (kind === 'city') return 'city';
  if (kind === 'category') return 'category';
  return 'synonym';
}

/** The panel kind for a SQL kind. A synonym names an object, so it reads `listing`. */
export function panelAliasKind(kind: string): AliasKind {
  if (kind === 'city') return 'city';
  if (kind === 'category') return 'category';
  return 'listing';
}

export interface RemoteAliasRow {
  id: string;
  kind: string;
  term: string;
  target: string;
  active: boolean;
  updated_at: string | null;
  updated_by: string | null;
}

/** One `search_aliases` row → the panel's row. `updated_by` is an id on the server. */
export function fromRemoteAlias(row: RemoteAliasRow): SearchAliasRow {
  return {
    id: row.id,
    term: row.term,
    target: row.target,
    kind: panelAliasKind(row.kind),
    active: row.active !== false,
    updated_at: row.updated_at ?? new Date(0).toISOString(),
    updated_by: row.updated_by ?? '—',
  };
}

export type AliasSaveResult = { ok: true; row: SearchAliasRow } | { ok: false; code: ErrorCode };

/**
 * Inserts or updates one alias. `search_aliases` is the one table the app writes
 * directly: its `for all` policy is `is_search_tuner()`, so the server refuses a
 * non-tuner write without a function in between (§16G.1). The unique index is on
 * `(kind, lower(term))`, so a duplicate is refused rather than merged;
 * `aliasProblem()` refuses it in the panel first, so both answers agree.
 */
export async function saveAliasRow(row: SearchAliasRow, updatedBy?: string | null): Promise<AliasSaveResult> {
  if (!serverAvailable('search') || !supabase) return { ok: true, row };

  const payload = {
    kind: sqlAliasKind(row.kind),
    term: row.term.trim().toLowerCase(),
    target: row.target.trim(),
    active: row.active,
    updated_by: updatedBy ?? null,
  };

  try {
    const query = isUuid(row.id)
      ? supabase.from(ALIAS_TABLE).update(payload).eq('id', row.id)
      : supabase.from(ALIAS_TABLE).insert(payload);
    const { data, error } = await query.select('id, kind, term, target, active, updated_at, updated_by').single();
    if (error) return { ok: false, code: codeFromRpcError(error) };
    return { ok: true, row: fromRemoteAlias(data as RemoteAliasRow) };
  } catch (cause) {
    return { ok: false, code: errorKeyFor(cause instanceof Error ? cause.message : String(cause)) };
  }
}

/** The alias rows the table holds, in the panel's shape. */
export async function readAliasRows(): Promise<SearchAliasRow[] | null> {
  if (!serverAvailable('search') || !supabase) return null;
  const { data, error } = await supabase
    .from(ALIAS_TABLE)
    .select('id, kind, term, target, active, updated_at, updated_by')
    .order('term');
  if (error || !data) return null;
  return (data as RemoteAliasRow[]).map(fromRemoteAlias);
}

export type BoostSaveResult =
  | { ok: true; applied: 'server' | 'local' }
  | { ok: false; code: ErrorCode };

/**
 * §16H.11: a boost is −20…50 on one index row. `set_search_boost` refuses a
 * weight outside the range with `search_error_bad_sort` and an unknown object
 * with `common_error_not_found`; the panel refuses the range before calling, so
 * neither side clamps a number the Admin did not choose.
 */
export async function saveBoostFor(
  kind: string,
  refId: string,
  weight: number,
): Promise<BoostSaveResult> {
  // The server is the only writer: a boost with no object has nothing to lift,
  // and with the flag off the caller keeps the weight in its own store.
  if (!serverAvailable('search')) return { ok: true, applied: 'local' };
  if (!kind || !refId) return { ok: false, code: 'common_error_not_found' };
  const outcome = await rpc('set_search_boost', { p_kind: kind, p_ref_id: refId, p_boost: weight });
  if (!outcome.ok) return { ok: false, code: outcome.code };
  return { ok: true, applied: 'server' };
}

export interface RemoteReport {
  top_queries: { query: string; searches: number; clicks: number }[];
  zero_result_queries: { query: string; searches: number }[];
  click_through: number;
}

/**
 * The report's rows in the panel's shape. The server counts a query once per log
 * row and a click once per row carrying `clicked_ref`, so `results` here is the
 * number of searches; the preview's `statsFromLog()` sums `result_count`
 * instead. The panel labels the columns "results" and "clicks", and this
 * mapping is the one place that decides which server number fills which.
 */
export function fromRemoteReport(payload: RemoteReport | null): { rows: SearchQueryStat[]; ctr: number } {
  if (!payload) return { rows: [], ctr: 0 };
  return {
    rows: (payload.top_queries ?? []).map((row) => ({
      query: row.query,
      results: row.searches,
      clicks: row.clicks,
    })),
    ctr: Number(payload.click_through ?? 0),
  };
}

export type ReportResult =
  | { ok: true; rows: SearchQueryStat[]; ctr: number; source: 'server' | 'preview' }
  | { ok: false; code: ErrorCode };

/** §16H.11's report over an inclusive day window, server first. */
export async function readSearchReport(
  from: string,
  to: string,
  preview: () => { rows: SearchQueryStat[]; ctr: number },
): Promise<ReportResult> {
  if (!serverAvailable('search')) return { ok: true, ...preview(), source: 'preview' };
  const outcome = await rpc<RemoteReport>('get_search_report', { p_from: from, p_to: to });
  if (!outcome.ok) return { ok: false, code: outcome.code };
  return { ok: true, ...fromRemoteReport(outcome.data), source: 'server' };
}

export type RebuildResult = { ok: true; rows: number } | { ok: false; code: ErrorCode };

/** §16H.11: a Super Admin rebuilds the whole index; the answer is the row count. */
export async function rebuildIndex(): Promise<RebuildResult> {
  const outcome = await rpc<number>('rebuild_search_index');
  if (!outcome.ok) return { ok: false, code: outcome.code };
  return { ok: true, rows: Number(outcome.data ?? 0) };
}

/** A client-generated row id is not a uuid, so it must not be sent as one. */
function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
