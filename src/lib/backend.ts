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

const FALLBACK_CODE: CommonErrorCode = 'common_error_forbidden';

export function isCommonErrorCode(value: string): value is CommonErrorCode {
  return (COMMON_ERROR_CODES as readonly string[]).includes(value);
}

/**
 * The key a screen shows for whatever came back. A known code is itself; a
 * `23505` (unique violation) means the row already exists, which reads as a
 * refusal; everything else is a refusal too. Nothing raw survives this.
 */
export function errorKeyFor(message: string | null | undefined): CommonErrorCode {
  const trimmed = (message ?? '').trim();
  if (isCommonErrorCode(trimmed)) return trimmed;
  if (/duplicate key|already exists|unique constraint/i.test(trimmed)) return 'common_error_forbidden';
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
export function codeFromRpcError(error: RpcErrorLike | null | undefined): CommonErrorCode {
  if (!error) return FALLBACK_CODE;
  const message = (error.message ?? '').trim();
  if (isCommonErrorCode(message)) return message;
  const firstToken = message.split(/[:\s]/, 1)[0];
  if (isCommonErrorCode(firstToken)) return firstToken;
  if (error.code === '23505') return 'common_error_forbidden';
  return errorKeyFor(message);
}

export type RpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: CommonErrorCode };

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
export function messageKey(message: string | null | undefined): CommonErrorCode {
  return errorKeyFor(message);
}
