import { isSupabaseConfigured, supabase } from './supabase';
import { FALLBACK_MMK_PER_USD, type ExchangeRateRow } from './exchangeRates';

/**
 * Plan §16B.5 and ticket O-02. `exchange_rates` is append-only, and the rate in
 * force is the latest row whose `effective_from` has passed. This module is the
 * seam: `src/lib/exchangeRates.ts` keeps the browser rows the Currency screen
 * edits, and this asks the table when Supabase can answer.
 *
 * Three rules the shape of this file follows:
 *
 *  - a rate the server does not have is the Plan's 4,500, never a guessed
 *    number, so a fresh project prices in MMK at the documented fallback;
 *  - an unreadable answer is `null` and the caller keeps its browser rate,
 *    because a broken request must not reprice the whole site;
 *  - a new row is appended, never an update — a correction is a new row.
 */

const TABLE = 'exchange_rates';

export interface RemoteRateRow {
  id: string;
  mmk_per_usd: number | string;
  effective_from: string;
  set_by: string | null;
  note: string | null;
}

/** A table row → the shape `exchangeRates.ts` already stores. */
export function fromRemoteRate(row: RemoteRateRow): ExchangeRateRow {
  return {
    id: row.id,
    mmkPerUsd: Number(row.mmk_per_usd),
    effectiveFrom: row.effective_from,
    setBy: row.set_by ?? '',
    note: row.note ?? '',
  };
}

/**
 * The rate in force, or `null` when the table cannot answer. A zero, a negative
 * or a non-numeric value is refused rather than returned, because a rate of 0
 * would price every listing at nothing.
 */
export async function readRemoteRate(at = new Date()): Promise<number | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('mmk_per_usd, effective_from')
      .lte('effective_from', at.toISOString())
      .order('effective_from', { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return null;
    const value = Number((data[0] as { mmk_per_usd: number | string }).mmk_per_usd);
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

/** The history the Currency screen shows, newest first. `null` when unreadable. */
export async function readRemoteRateHistory(limit = 200): Promise<ExchangeRateRow[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, mmk_per_usd, effective_from, set_by, note')
      .order('effective_from', { ascending: false })
      .limit(limit);
    if (error || !data) return null;
    return (data as RemoteRateRow[]).map(fromRemoteRate);
  } catch {
    return null;
  }
}

/**
 * The rate to display: the server's when it has one, the browser rows otherwise,
 * and 4,500 when neither has a row. Kept as one function so the header, the
 * estimate panel and a stored order cannot each pick a different number.
 */
export async function effectiveRate(
  localRate: number | null,
  at = new Date(),
): Promise<number> {
  const remote = await readRemoteRate(at);
  if (remote !== null) return remote;
  if (localRate !== null && Number.isFinite(localRate) && localRate > 0) return localRate;
  return FALLBACK_MMK_PER_USD;
}

export type AppendRateResult =
  | { ok: true; row: ExchangeRateRow; source: 'server' | 'preview' }
  | { ok: false; code: 'common_error_forbidden' };

/**
 * Appends one row. The table's insert policy is Super Admin and Payment Admin
 * (§16B.1), so a refusal here is the server's answer, not a client guess. With
 * Supabase off the caller's browser row stands, which is what keeps the preview
 * working.
 */
export async function appendRemoteRate(
  input: { mmkPerUsd: number; note?: string },
  at = new Date(),
): Promise<AppendRateResult> {
  const local: ExchangeRateRow = {
    id: `rate-${at.getTime()}`,
    mmkPerUsd: Math.round(input.mmkPerUsd * 100) / 100,
    effectiveFrom: at.toISOString(),
    setBy: '',
    note: input.note ?? '',
  };
  if (!isSupabaseConfigured || !supabase) return { ok: true, row: local, source: 'preview' };

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ mmk_per_usd: local.mmkPerUsd, effective_from: local.effectiveFrom, note: local.note })
      .select('id, mmk_per_usd, effective_from, set_by, note')
      .single();
    if (error || !data) return { ok: false, code: 'common_error_forbidden' };
    return { ok: true, row: fromRemoteRate(data as RemoteRateRow), source: 'server' };
  } catch {
    return { ok: false, code: 'common_error_forbidden' };
  }
}
