import { describe, expect, it } from 'vitest';
import { adoptLegacyKey, clearScoped, readScoped, scopeKey, writeScoped } from './userScope';

function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() { return map.size; },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => { map.delete(key); },
    setItem: (key: string, value: string) => { map.set(key, value); },
  };
}

function withStorage(store: Storage) {
  (globalThis as { window?: unknown }).window = { localStorage: store };
}

describe('scopeKey', () => {
  it('gives every account its own key', () => {
    expect(scopeKey('favorites', 'user-a')).not.toBe(scopeKey('favorites', 'user-b'));
  });

  it('puts a guest in a separate scope, not the signed-in one', () => {
    expect(scopeKey('favorites', null)).toBe('mh-travel:favorites:guest');
    expect(scopeKey('favorites', null)).not.toBe(scopeKey('favorites', 'user-a'));
  });

  it('treats a blank owner as a guest', () => {
    expect(scopeKey('favorites', '   ')).toBe(scopeKey('favorites', null));
  });
});

describe('scoped storage', () => {
  it('does not let one account read another account values', () => {
    withStorage(fakeStorage());
    writeScoped('favorites', 'user-a', { 'listing-1': true });
    expect(readScoped('favorites', 'user-a', {})).toEqual({ 'listing-1': true });
    expect(readScoped('favorites', 'user-b', {})).toEqual({});
    expect(readScoped('favorites', null, {})).toEqual({});
  });

  it('survives a corrupt value by returning the fallback', () => {
    const store = fakeStorage();
    withStorage(store);
    store.setItem(scopeKey('favorites', 'user-a'), '{not json');
    expect(readScoped('favorites', 'user-a', { fallback: true })).toEqual({ fallback: true });
  });

  it('clears only the requested scope', () => {
    withStorage(fakeStorage());
    writeScoped('favorites', 'user-a', { a: 1 });
    writeScoped('favorites', 'user-b', { b: 2 });
    clearScoped('favorites', 'user-a');
    expect(readScoped('favorites', 'user-a', {})).toEqual({});
    expect(readScoped('favorites', 'user-b', {})).toEqual({ b: 2 });
  });
});

describe('adoptLegacyKey', () => {
  it('moves the old global value into the current account and deletes it', () => {
    const store = fakeStorage();
    withStorage(store);
    store.setItem('mh-travel-favorite-overrides', JSON.stringify({ 'listing-9': true }));

    expect(adoptLegacyKey('favorites', 'mh-travel-favorite-overrides', 'user-a', {})).toEqual({ 'listing-9': true });
    expect(store.getItem('mh-travel-favorite-overrides')).toBeNull();
    expect(readScoped('favorites', 'user-b', {})).toEqual({});
  });

  it('falls back to the scoped value when the legacy key is gone', () => {
    withStorage(fakeStorage());
    writeScoped('favorites', 'user-a', { kept: true });
    expect(adoptLegacyKey('favorites', 'mh-travel-favorite-overrides', 'user-a', {})).toEqual({ kept: true });
  });
});
