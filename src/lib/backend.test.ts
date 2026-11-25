import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

/**
 * Plan §16B.8 and §16G.5, ticket O-00. The rules: a `P0001` raise is read back
 * as its stable code, a raw database error never reaches a screen, and a module
 * only talks to the server when its flag is `on` and Supabase is configured.
 */

async function loadBackend(env: Record<string, string | undefined> = {}) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) vi.stubEnv(key, '');
    else vi.stubEnv(key, value);
  }
  return import('./backend');
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('the common error codes (§16B.8)', () => {
  it('names the five the Plan lists', async () => {
    const { COMMON_ERROR_CODES } = await loadBackend();
    expect([...COMMON_ERROR_CODES]).toEqual([
      'common_error_not_signed_in',
      'common_error_forbidden',
      'common_error_not_found',
      'common_error_version_conflict',
      'common_error_rate_limit',
    ]);
  });

  it('recognises a known code and rejects anything else', async () => {
    const { isCommonErrorCode } = await loadBackend();
    expect(isCommonErrorCode('common_error_version_conflict')).toBe(true);
    expect(isCommonErrorCode('common_error_made_up')).toBe(false);
    expect(isCommonErrorCode('')).toBe(false);
  });

  it('turns an unknown message into forbidden, so no raw text is shown', async () => {
    const { errorKeyFor } = await loadBackend();
    expect(errorKeyFor('duplicate key value violates unique constraint "profiles_pkey"'))
      .toBe('common_error_forbidden');
    expect(errorKeyFor('permission denied for table listings')).toBe('common_error_forbidden');
    expect(errorKeyFor(undefined)).toBe('common_error_forbidden');
    expect(errorKeyFor(null)).toBe('common_error_forbidden');
  });

  it('passes a known code through untouched', async () => {
    const { errorKeyFor } = await loadBackend();
    for (const code of ['common_error_not_found', 'common_error_rate_limit', 'common_error_not_signed_in']) {
      expect(errorKeyFor(code)).toBe(code);
    }
    expect(errorKeyFor('  common_error_forbidden  ')).toBe('common_error_forbidden');
  });
});

describe('reading a Supabase function error (§16G.3)', () => {
  it('reads the message a P0001 raise carries', async () => {
    const { codeFromRpcError } = await loadBackend();
    expect(codeFromRpcError({ code: 'P0001', message: 'common_error_version_conflict' }))
      .toBe('common_error_version_conflict');
    expect(codeFromRpcError({ code: 'P0001', message: 'common_error_not_signed_in' }))
      .toBe('common_error_not_signed_in');
  });

  it('reads a code that carries a detail after a colon', async () => {
    const { codeFromRpcError } = await loadBackend();
    expect(codeFromRpcError({ code: 'P0001', message: 'common_error_not_found: listing ph3' }))
      .toBe('common_error_not_found');
  });

  it('reads a unique violation as a refusal', async () => {
    const { codeFromRpcError } = await loadBackend();
    expect(codeFromRpcError({ code: '23505', message: 'duplicate key value' })).toBe('common_error_forbidden');
  });

  it('treats a missing error as a refusal rather than a success', async () => {
    const { codeFromRpcError } = await loadBackend();
    expect(codeFromRpcError(null)).toBe('common_error_forbidden');
    expect(codeFromRpcError({})).toBe('common_error_forbidden');
  });

  it('never leaks an unrecognised Postgres message', async () => {
    const { codeFromRpcError } = await loadBackend();
    const code = codeFromRpcError({ code: '42P01', message: 'relation "listings" does not exist' });
    expect(code).toBe('common_error_forbidden');
    expect(code.startsWith('common_error_')).toBe(true);
  });
});

describe('the module flag gate (§16G.5)', () => {
  it('has no server when the flag is off', async () => {
    const { serverAvailable } = await loadBackend({ VITE_BACKEND_ADMIN: 'off' });
    expect(serverAvailable('admin')).toBe(false);
  });

  it('has no server when the flag is on but Supabase is unconfigured', async () => {
    const { serverAvailable } = await loadBackend({ VITE_BACKEND_ADMIN: 'on' });
    expect(serverAvailable('admin')).toBe(false);
  });

  it('has a server only with the flag on and both Supabase values set', async () => {
    const { serverAvailable } = await loadBackend({
      VITE_BACKEND_ADMIN: 'on',
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'anon-key',
    });
    expect(serverAvailable('admin')).toBe(true);
  });

  it('refuses an rpc when no client is configured', async () => {
    const { rpc } = await loadBackend();
    const result = await rpc('admin_get_overview', {});
    expect(result).toEqual({ ok: false, code: 'common_error_forbidden' });
  });
});

describe('the local fallback (rpcOrLocal)', () => {
  it('answers from the browser store while the flag is off', async () => {
    const { rpcOrLocal } = await loadBackend({ VITE_BACKEND_ADMIN: 'off' });
    const result = await rpcOrLocal('admin', 'admin_get_overview', {}, () => ({ kpis: [] }));
    expect(result).toEqual({ ok: true, data: { kpis: [] } });
  });

  it('does not call the fallback when the flag is on and Supabase is set', async () => {
    const { rpcOrLocal } = await loadBackend({
      VITE_BACKEND_ADMIN: 'on',
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'anon-key',
    });
    const fallback = vi.fn(() => ({ kpis: ['local'] }));
    const result = await rpcOrLocal('admin', 'admin_get_overview', {}, fallback);
    // Supabase is configured but unreachable in the test, so the call fails
    // rather than quietly serving local rows over a live server.
    expect(fallback).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
  });
});
