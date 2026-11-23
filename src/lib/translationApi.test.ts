import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readTranslationCache } from './translationCache';
import { translateOrCached, translateText } from './translationApi';

function fakeWindow() {
  const map = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => { map.set(key, value); },
      removeItem: (key: string) => { map.delete(key); },
      clear: () => map.clear(),
      key: () => null,
      get length() { return map.size; },
    },
    dispatchEvent: () => true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
}

const ENV = import.meta.env as Record<string, string | undefined>;

beforeEach(() => {
  fakeWindow();
  delete ENV.VITE_TRANSLATION_ENDPOINT;
  vi.unstubAllGlobals();
});

describe('the translation provider call (Plan §16B.4)', () => {
  it('says so when no Worker endpoint is configured', async () => {
    const result = await translateText('Hello', 'en', 'mm');
    expect(result).toMatchObject({ ok: false, code: 'not_configured' });
    expect(readTranslationCache()).toHaveLength(0);
  });

  it('refuses a text longer than the Worker limit', async () => {
    const result = await translateText('x'.repeat(4001), 'en', 'mm');
    expect(result).toMatchObject({ ok: false, code: 'too_long' });
  });

  it('returns the text unchanged when both languages are the same', async () => {
    expect(await translateText('Hello', 'en', 'en')).toEqual({ ok: true, text: 'Hello' });
  });

  it('stores what the Worker returns, so the next reader is served from cache', async () => {
    ENV.VITE_TRANSLATION_ENDPOINT = 'https://worker.example/translate';
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ text: 'မင်္ဂလာပါ' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const first = await translateText('Hello', 'en', 'mm', new Date('2026-11-23T00:00:00.000Z'));
    expect(first).toEqual({ ok: true, text: 'မင်္ဂလာပါ' });
    expect(readTranslationCache()).toHaveLength(1);

    const second = await translateOrCached('Hello', 'en', 'mm', readTranslationCache());
    expect(second).toEqual({ ok: true, text: 'မင်္ဂလာပါ' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports a rate limit and a provider failure instead of throwing', async () => {
    ENV.VITE_TRANSLATION_ENDPOINT = 'https://worker.example/translate';
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 429 })));
    expect(await translateText('Hello', 'en', 'mm')).toMatchObject({ ok: false, code: 'rate_limited' });

    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));
    expect(await translateText('Hello', 'en', 'mm')).toMatchObject({ ok: false, code: 'provider_failed' });

    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ text: '  ' }), { status: 200 })));
    expect(await translateText('Hello', 'en', 'mm')).toMatchObject({ ok: false, code: 'bad_response' });

    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    expect(await translateText('Hello', 'en', 'mm')).toMatchObject({ ok: false, code: 'provider_failed' });
    expect(readTranslationCache()).toHaveLength(0);
  });
});
