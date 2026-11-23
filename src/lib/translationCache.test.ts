import { beforeEach, describe, expect, it } from 'vitest';
import {
  findTranslation,
  isTranslatable,
  localizedOrFallback,
  missingLanguage,
  pendingReviewCount,
  readTranslationCache,
  recordTranslationView,
  rememberTranslation,
  resolveLocalized,
  reviewQueue,
  reviewTranslation,
  sourceHash,
  writeTranslationCache,
  type TranslationRow,
} from './translationCache';

function row(overrides: Partial<TranslationRow> = {}): TranslationRow {
  return {
    id: 'tr-1',
    sourceHash: sourceHash('Hello', 'en', 'mm'),
    fromLang: 'en',
    toLang: 'mm',
    sourceText: 'Hello',
    translatedText: 'မင်္ဂလာပါ',
    status: 'auto',
    reviewedBy: '',
    views: 0,
    createdAt: '2026-11-23T00:00:00.000Z',
    ...overrides,
  };
}

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

beforeEach(() => { fakeWindow(); });

describe('the translation cache (Plan §16B.4)', () => {

  it('never translates a name, an address or a price', () => {
    expect(isTranslatable('title')).toBe(true);
    expect(isTranslatable('prose')).toBe(true);
    expect(isTranslatable('name')).toBe(false);
    expect(isTranslatable('address')).toBe(false);
    expect(isTranslatable('price')).toBe(false);
  });

  it('names the language a text is still missing', () => {
    expect(missingLanguage({ en: '', mm: 'မြန်မာ' })).toBe('en');
    expect(missingLanguage({ en: 'English', mm: '' })).toBe('mm');
    expect(missingLanguage({ en: 'Both', mm: 'နှစ်မျိုး' })).toBeNull();
    expect(missingLanguage({ en: '  ', mm: '  ' })).toBeNull();
  });

  it('hashes one text per direction, so the pair never collides', () => {
    expect(sourceHash('Hello', 'en', 'mm')).toBe(sourceHash('  Hello  ', 'en', 'mm'));
    expect(sourceHash('Hello', 'en', 'mm')).not.toBe(sourceHash('Hello', 'mm', 'en'));
    expect(sourceHash('Hello', 'en', 'mm')).not.toBe(sourceHash('Hi', 'en', 'mm'));
  });

  it('stores an automatic row once and reuses it', () => {
    const first = rememberTranslation({ sourceText: 'Hello', translatedText: 'မင်္ဂလာပါ', fromLang: 'en', toLang: 'mm' });
    const second = rememberTranslation({ sourceText: 'Hello', translatedText: 'ဟယ်လို', fromLang: 'en', toLang: 'mm' });
    expect(first?.status).toBe('auto');
    expect(second?.translatedText).toBe('မင်္ဂလာပါ');
    expect(readTranslationCache()).toHaveLength(1);
  });

  it('refuses an empty text or a same-language pair', () => {
    expect(rememberTranslation({ sourceText: '  ', translatedText: 'x', fromLang: 'en', toLang: 'mm' })).toBeNull();
    expect(rememberTranslation({ sourceText: 'x', translatedText: '', fromLang: 'en', toLang: 'mm' })).toBeNull();
    expect(rememberTranslation({ sourceText: 'x', translatedText: 'y', fromLang: 'en', toLang: 'en' })).toBeNull();
  });

  it('shows the marker until a row is reviewed', () => {
    const stored = row();
    writeTranslationCache([stored]);
    const before = resolveLocalized({ en: 'Hello', mm: '' }, 'mm', readTranslationCache());
    expect(before).toMatchObject({ value: 'မင်္ဂလာပါ', autoTranslated: true });

    writeTranslationCache(reviewTranslation(readTranslationCache(), stored.id, 'Super Admin'));
    const after = resolveLocalized({ en: 'Hello', mm: '' }, 'mm', readTranslationCache());
    expect(after.autoTranslated).toBe(false);
  });

  it('approving keeps the text, editing replaces it', () => {
    const stored = row();
    const approved = reviewTranslation([stored], stored.id, 'Admin')[0];
    expect(approved).toMatchObject({ status: 'approved', reviewedBy: 'Admin', translatedText: 'မင်္ဂလာပါ' });

    const edited = reviewTranslation([stored], stored.id, 'Admin', 'ဟယ်လို')[0];
    expect(edited).toMatchObject({ status: 'edited', translatedText: 'ဟယ်လို' });
  });

  it('prefers a reviewed row over an automatic one for the same text', () => {
    const auto = row({ id: 'tr-auto' });
    const reviewed = row({ id: 'tr-reviewed', status: 'approved', translatedText: 'အတည်ပြုပြီး' });
    const hit = findTranslation([auto, reviewed], 'Hello', 'en', 'mm');
    expect(hit?.id).toBe('tr-reviewed');
  });

  it('ranks the review queue by views, automatic rows only', () => {
    const quiet = row({ id: 'tr-quiet', views: 2 });
    const busy = row({ id: 'tr-busy', sourceText: 'Other', sourceHash: sourceHash('Other', 'en', 'mm'), views: 9 });
    const done = row({ id: 'tr-done', status: 'approved', views: 99 });
    expect(reviewQueue([quiet, busy, done]).map((item) => item.id)).toEqual(['tr-busy', 'tr-quiet']);
    expect(pendingReviewCount([quiet, busy, done])).toBe(2);
  });

  it('counts one view per reader so the queue can rank it', () => {
    const stored = row();
    const next = recordTranslationView([stored], stored.id);
    expect(next[0].views).toBe(1);
  });

  it('falls back to the source language and asks for the missing one', () => {
    const resolved = resolveLocalized({ en: 'Hello', mm: '' }, 'mm', []);
    expect(resolved).toMatchObject({ value: 'Hello', autoTranslated: false, needs: 'mm' });
  });

  it('uses the reader language when it is written', () => {
    expect(resolveLocalized({ en: 'Hello', mm: 'မင်္ဂလာပါ' }, 'en', [])).toMatchObject({
      value: 'Hello',
      autoTranslated: false,
    });
  });

  describe('localizedOrFallback', () => {
    it('reads the language that was written when the reader language is blank', () => {
      expect(localizedOrFallback({ en: 'Bagan', mm: '' }, 'mm')).toBe('Bagan');
      expect(localizedOrFallback({ en: '', mm: 'ပုဂံ' }, 'en')).toBe('ပုဂံ');
    });

    it('prefers the reader language when it is written', () => {
      expect(localizedOrFallback({ en: 'Bagan', mm: 'ပုဂံ' }, 'mm')).toBe('ပုဂံ');
    });

    it('returns an empty string for a missing field instead of throwing', () => {
      expect(localizedOrFallback(undefined, 'en')).toBe('');
    });

    it('never marks a fallback as translated, because a name is not translated', () => {
      expect(localizedOrFallback({ en: 'No. 45, Inya Road', mm: '' }, 'mm')).toBe('No. 45, Inya Road');
    });
  });
});
