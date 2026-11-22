/**
 * Per-user browser storage.
 *
 * Favorites and notification read-state used to live under one global key, so
 * they survived logout and followed whoever used the browser next. Every read
 * and write now goes through a key that carries the account id, and a guest
 * gets its own scope instead of sharing the signed-in user's.
 *
 * The Supabase tables for these rows already exist; this module is the seam
 * where a table-backed adapter replaces `localStorage` without touching the
 * callers.
 */

const PREFIX = 'mh-travel';

export type ScopeOwner = string | null;

/** Guests share one scope, keyed apart from every account id. */
const GUEST_SCOPE = 'guest';

export function scopeKey(base: string, owner: ScopeOwner): string {
  return `${PREFIX}:${base}:${owner && owner.trim() ? owner.trim() : GUEST_SCOPE}`;
}

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readScoped<T>(base: string, owner: ScopeOwner, fallback: T): T {
  const store = storage();
  if (!store) return fallback;
  try {
    const raw = store.getItem(scopeKey(base, owner));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeScoped<T>(base: string, owner: ScopeOwner, value: T): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(scopeKey(base, owner), JSON.stringify(value));
  } catch {
    // A full or blocked quota must not break the interaction; the value still
    // lives in React state for this session.
  }
}

export function clearScoped(base: string, owner: ScopeOwner): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(scopeKey(base, owner));
  } catch {
    // Nothing to recover: the key is already unreadable.
  }
}

/**
 * Moves a legacy unscoped key into one scope and deletes the original, so the
 * data is claimed once and stops leaking to the next account.
 */
export function adoptLegacyKey<T>(base: string, legacyKey: string, owner: ScopeOwner, fallback: T): T {
  const store = storage();
  if (!store) return fallback;
  try {
    const raw = store.getItem(legacyKey);
    if (raw === null) return readScoped<T>(base, owner, fallback);
    const parsed = JSON.parse(raw) as T;
    writeScoped(base, owner, parsed);
    store.removeItem(legacyKey);
    return parsed;
  } catch {
    return readScoped<T>(base, owner, fallback);
  }
}
