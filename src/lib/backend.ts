import { isSupabaseConfigured, supabase } from './supabase';
import { backendIsOn, type ModuleFlag } from './moduleFlags';

/**
 * Plan §16B.8 and §16G.5, ticket O-00. Every server call goes through this file
 * so three rules hold in one place: a module only talks to the server when its
 * flag is `on` and Supabase is configured, a `P0001` raise is read back as its
 * stable code, and a raw database error never reaches a screen.
 */

/**
 * The codes the Plan names (§16B.8, §3A.14). A function raises one of these in
 * its message; the client translates it. Anything else — a constraint name, a
 * Postgres sentence, an empty string — becomes `common_error_forbidden`, because
 * a screen may only ever show a string this build can translate.
 */
export const COMMON_ERROR_CODES = [
  'common_error_not_signed_in',
  'common_error_forbidden',
  'common_error_not_found',
  'common_error_version_conflict',
  'common_error_rate_limit',
] as const;

export type CommonErrorCode = (typeof COMMON_ERROR_CODES)[number];

/**
 * §16G.2: a module raises `<module>_error_<code>` — `rental_error_start_date`,
 * `blog_error_publish_blocked`, `search_error_query_too_long`. Each module's
 * codes are listed in the Plan next to its functions, so the client can only
 * accept one the Plan names. A code the Plan does not list is a refusal.
 */
export const MODULE_ERROR_CODES = [
  'rental_error_not_signed_in',
  'rental_error_category',
  'rental_error_city_availability',
  'rental_error_variant',
  'rental_error_branch',
  'rental_error_start_date',
  'rental_error_end_date',
  'rental_error_min_days',
  'rental_error_name',
  'rental_error_phone',
  'rental_error_address',
  'rental_error_participants',
  'rental_error_terms',
  'rental_error_rate_limit',
  'rental_error_rate_missing',
  'rental_error_forbidden',
  'rental_error_order_missing',
  'rental_error_status_transition',
  'rental_error_payment_method',
  'rental_error_reschedule_not_paid',
  'rental_error_reschedule_limit',
  'rental_error_reschedule_too_late',
  'rental_error_reschedule_unchanged',
  'blog_error_publish_blocked',
  'blog_error_version_conflict',
  'guide_error_publish_blocked',
  'guide_error_version_conflict',
  'ads_error_forbidden',
  'ads_error_invalid_transition',
  'ads_error_creative_not_approved',
  'search_error_query_too_long',
  'search_error_bad_sort',
  'search_error_location_required',
  'media_error_forbidden',
  'media_error_rate_limit',
] as const;

export type ModuleErrorCode = (typeof MODULE_ERROR_CODES)[number];

/** Every code a screen may render, common first because those come up most. */
export type ErrorCode = CommonErrorCode | ModuleErrorCode;

const FALLBACK_CODE: CommonErrorCode = 'common_error_forbidden';

export function isCommonErrorCode(value: string): value is CommonErrorCode {
  return (COMMON_ERROR_CODES as readonly string[]).includes(value);
}

export function isModuleErrorCode(value: string): value is ModuleErrorCode {
  return (MODULE_ERROR_CODES as readonly string[]).includes(value);
}

export function isErrorCode(value: string): value is ErrorCode {
  return isCommonErrorCode(value) || isModuleErrorCode(value);
}

/**
 * The key a screen shows for whatever came back. A code the Plan lists is
 * itself — a module's own code is more useful than a generic refusal, because
 * it names the field that failed. A `23505` (unique violation) means the row
 * already exists, which reads as a refusal; everything else is a refusal too.
 * Nothing raw survives this.
 */
export function errorKeyFor(message: string | null | undefined): ErrorCode {
  const trimmed = (message ?? '').trim();
  if (isErrorCode(trimmed)) return trimmed;
  if (/duplicate key|already exists|unique constraint/i.test(trimmed)) return FALLBACK_CODE;
  return FALLBACK_CODE;
}

/** The shape Supabase puts on a rejected `rpc()` call. */
export interface RpcErrorLike {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}

/**
 * Reads the message a Supabase function raises. `P0001` is `RAISE EXCEPTION`
 * with a custom message, which is exactly how §16G.3 spells the error contract;
 * the message may carry a trailing detail after a colon, so the first token is
 * what is matched.
 */
export function codeFromRpcError(error: RpcErrorLike | null | undefined): ErrorCode {
  if (!error) return FALLBACK_CODE;
  const message = (error.message ?? '').trim();
  if (isErrorCode(message)) return message;
  const firstToken = message.split(/[:\s]/, 1)[0];
  if (isErrorCode(firstToken)) return firstToken;
  if (error.code === '23505') return FALLBACK_CODE;
  return errorKeyFor(message);
}

export type RpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ErrorCode };

/**
 * §16G.5: a module uses the server only when its flag is `on` **and** Supabase
 * is configured. The caller checks `serverAvailable()` before offering a
 * server-only action, so the local preview keeps working while the flag is off.
 */
export function serverAvailable(flag: ModuleFlag): boolean {
  return backendIsOn(flag) && isSupabaseConfigured && supabase !== null;
}

/**
 * Calls a Postgres function and returns either its rows or a code a screen can
 * translate. A thrown network failure is a refusal as far as the screen is
 * concerned — it shows the same translated line and offers a retry.
 */
export async function rpc<T>(
  name: string,
  args: Record<string, unknown> = {},
): Promise<RpcResult<T>> {
  if (!supabase) return { ok: false, code: 'common_error_forbidden' };
  try {
    const { data, error } = await supabase.rpc(name, args);
    if (error) return { ok: false, code: codeFromRpcError(error) };
    return { ok: true, data: data as T };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return { ok: false, code: errorKeyFor(message) };
  }
}

/**
 * The same call, but a module that has not been switched on yet answers from
 * its browser store instead. `fallback` runs only when the server is not in
 * use; a real server refusal is never papered over by local data.
 */
export async function rpcOrLocal<T>(
  flag: ModuleFlag,
  name: string,
  args: Record<string, unknown>,
  fallback: () => T,
): Promise<RpcResult<T>> {
  if (!serverAvailable(flag)) return { ok: true, data: fallback() };
  return rpc<T>(name, args);
}

/**
 * §3A.16 criterion 12: every string a section shows comes from `t()`. A panel
 * that receives a code renders `t(code)`; this helper exists so a caller that
 * holds a raw message cannot accidentally render it.
 */
export function messageKey(message: string | null | undefined): ErrorCode {
  return errorKeyFor(message);
}
