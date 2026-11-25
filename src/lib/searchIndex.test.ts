import { describe, expect, it } from 'vitest';
import {
  CANDIDATE_SIMILARITY,
  MAX_RESULTS,
  RECENT_SEARCHES_KEY,
  RECENT_SEARCHES_MAX,
  SEARCH_INDEX,
  clearRecentSearches,
  closestTitle,
  interpretQuery,
  readRecentSearches,
  rememberSearch,
  searchAll,
  suggest,
  trigramSimilarity,
} from './searchIndex';
import { normalizeSearchText } from './searchText';

/**
 * Plan §16H.13, ticket O-50. The acceptance criteria that can be checked
 * without a database are checked here, one per test where possible: Bagan in
 * three spellings, Zawgyi and Unicode, a draft never appearing (the index only
 * holds what the seed modules publish), `hotle`, `hotels yangon` as two chips,
 * `nearest` without a location, an 80-character refusal, kind counts, and a URL
 * reload giving the same page.
 */

const NOW = new Date('2026-11-20T00:00:00.000Z');

describe('the index (§16H.4)', () => {
  it('holds one row per object, so a listing in two seed modules is one result', () => {
    const ids = SEARCH_INDEX.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('holds one row per detail URL, so the Populars row cannot double a catalogue row', () => {
    // `pp4` and `ph3` are the same Lotte hotel under two seed ids. Keying on the
    // id alone listed it twice on the page. A row whose href is a page rather
    // than an object (`/nearby`) is not an identity, so it is left out of the
    // check and those rows are counted separately below.
    const detailHrefs = SEARCH_INDEX.map((row) => row.href).filter((href) => href !== '/nearby');
    expect(new Set(detailHrefs).size).toBe(detailHrefs.length);
  });

  it('keeps every Nearby row that shares the /nearby page href', () => {
    // The hospital, the clinic and the gym have no detail page yet. Keying the
    // duplicate check on `/nearby` kept the first and silently dropped two.
    const shared = SEARCH_INDEX.filter((row) => row.href === '/nearby').map((row) => row.kind);
    expect(shared.sort()).toEqual(['clinics', 'exchange', 'gyms', 'hospitals']);
  });

  it('normalizes the searchable text of every row', () => {
    for (const row of SEARCH_INDEX) {
      expect(row.normText, row.id).toBe(normalizeSearchText(row.normText));
      expect(row.normText.length, row.id).toBeGreaterThan(0);
    }
  });

  it('spreads the preview points, so `nearest` is not one flat tie', () => {
    // The seed modules carry no coordinates, so each row sits at its city's
    // centre plus a stable offset. A weak hash put every Yangon hotel at the
    // same 1.7 km, which made the nearest sort look broken.
    const yangon = SEARCH_INDEX.filter((row) => row.cityId === 'yangon');
    const points = new Set(yangon.map((row) => `${row.lat.toFixed(4)},${row.lng.toFixed(4)}`));
    expect(points.size).toBe(yangon.length);
  });

  it('gives every row a kind and a city, so a chip can count it', () => {
    for (const row of SEARCH_INDEX) {
      expect(row.kind, row.id).toBeTruthy();
      expect(row.cityId, row.id).toBeTruthy();
    }
  });
});

describe('acceptance criterion 1: Bagan in three spellings (§16H.13)', () => {
  it('returns the same Bagan results for ပုဂံ, bagan and pagan', () => {
    const unicode = searchAll({ query: 'ပုဂံ', now: NOW });
    const latin = searchAll({ query: 'bagan', now: NOW });
    const alias = searchAll({ query: 'pagan', now: NOW });
    expect(unicode.hits.length).toBeGreaterThan(0);
    expect(unicode.interpreted.city).toBe('bagan');
    expect(latin.interpreted.city).toBe('bagan');
    expect(alias.interpreted.city).toBe('bagan');
    const ids = (result: typeof unicode) => result.hits.map((hit) => hit.id).sort();
    expect(ids(latin)).toEqual(ids(unicode));
    expect(ids(alias)).toEqual(ids(unicode));
  });
});

describe('acceptance criterion 2: Zawgyi and Unicode agree (§16H.13)', () => {
  it('returns identical results for the same word typed either way', () => {
    const pairs: [string, string][] = [
      ['\u101b\u1014\u1039\u1000\u102f\u1014\u1039', 'ရန်ကုန်'],
      ['\u101f\u102d\u102f\u1010\u101a\u1039', 'ဟိုတယ်'],
      ['\u1031\u1008\u1038', 'ဈေး'],
    ];
    for (const [zawgyi, unicode] of pairs) {
      const a = searchAll({ query: zawgyi, now: NOW });
      const b = searchAll({ query: unicode, now: NOW });
      expect(a.interpreted, zawgyi).toEqual(b.interpreted);
      expect(a.hits.map((hit) => hit.id), zawgyi).toEqual(b.hits.map((hit) => hit.id));
    }
  });
});

describe('acceptance criterion 4: a typo still finds the thing (§16H.13)', () => {
  it('finds hotels for hotle', () => {
    const result = searchAll({ query: 'hotle', now: NOW });
    expect(result.hits.length).toBeGreaterThan(0);
    expect(result.hits.some((hit) => hit.kind === 'hotels')).toBe(true);
  });

  it('offers a did-you-mean when the query matched nothing but a title is close', () => {
    // `sule pagoda` has no blog, so the filtered page is empty even though the
    // title is an exact match — the one case where the offer is useful.
    const result = searchAll({ query: 'sule pagoda', kind: 'blogs', now: NOW });
    expect(result.hits).toEqual([]);
    expect(result.didYouMean).toBe('Sule pagoda');
    expect(closestTitle(normalizeSearchText('sule pagoda'))).toBe(result.didYouMean);
  });

  it('stays quiet when nothing is close enough', () => {
    expect(searchAll({ query: 'zzzqqq', now: NOW }).didYouMean).toBeUndefined();
    expect(closestTitle('zzzqqq')).toBeUndefined();
  });

  it('does not offer a correction for a query that already returned results', () => {
    const result = searchAll({ query: 'shwedagoon', now: NOW });
    expect(result.hits.length).toBeGreaterThan(0);
    expect(result.didYouMean).toBeUndefined();
  });
});

describe('acceptance criterion 5: two aliases become two chips (§16H.13)', () => {
  it('reads hotels yangon as a kind and a city, with no text left', () => {
    const interpreted = interpretQuery('hotels yangon');
    expect(interpreted.mode).toBe('city_category');
    expect(interpreted.kind).toBe('hotels');
    expect(interpreted.city).toBe('yangon');
    expect(interpreted.text).toBe('');
  });

  it('reads a city alone, a category alone, and plain text', () => {
    expect(interpretQuery('yangon')).toEqual({ mode: 'city', city: 'yangon', text: '' });
    expect(interpretQuery('Hotel')).toEqual({ mode: 'category', kind: 'hotels', text: '' });
    expect(interpretQuery('shwedagon pagoda')).toEqual({ mode: 'text', text: 'shwedagon pagoda' });
  });

  it('leaves the words that are not aliases in the text part', () => {
    const interpreted = interpretQuery('bagan sunrise');
    expect(interpreted.mode).toBe('city');
    expect(interpreted.city).toBe('bagan');
    expect(interpreted.text).toBe('sunrise');
  });

  it('does not fire a Latin alias inside a longer word', () => {
    // `bar` is not a seed alias, but `bagan` must not lose its `ban` to one.
    expect(interpretQuery('bagan').city).toBe('bagan');
    expect(interpretQuery('bagan').text).toBe('');
  });

  it('ignores an alias that is switched off', () => {
    const aliases = [
      { term: 'yangon', kind: 'city' as const, target: 'yangon', active: false },
    ];
    expect(interpretQuery('yangon', aliases)).toEqual({ mode: 'text', text: 'yangon' });
  });

  it('reads a single mistyped letter as the alias it names (§16H.6)', () => {
    // Before this, `hotle` was a text word that matched nothing in the title
    // and the page ranked a motorbike rental first.
    expect(interpretQuery('hotle')).toEqual({ mode: 'category', kind: 'hotels', text: '' });
    expect(interpretQuery('resturant')).toEqual({ mode: 'category', kind: 'restaurants', text: '' });
    expect(interpretQuery('bagam')).toEqual({ mode: 'city', city: 'bagan', text: '' });
    expect(interpretQuery('hotle yangon')).toEqual({
      mode: 'city_category', city: 'yangon', kind: 'hotels', text: '',
    });
  });

  it('leaves a word that names two aliases alone, and a short or Myanmar one', () => {
    // `plan`/`plans` both answer to `plans`, so the target is unambiguous — but
    // a word within one edit of two different targets must not pick one.
    expect(interpretQuery('sule').mode).toBe('text');
    expect(interpretQuery('ဟိုတယ').mode).toBe('text');
    expect(interpretQuery('caf').mode).toBe('text');
  });

  it('answers a browse for an empty query', () => {
    expect(interpretQuery('')).toEqual({ mode: 'browse', text: '' });
    expect(interpretQuery('   ')).toEqual({ mode: 'browse', text: '' });
  });
});

describe('acceptance criterion 5b: a city card drills in (§16H.6)', () => {
  it('turns a category-only query plus a chosen city into that category in that city', () => {
    const browse = searchAll({ query: 'hotels', now: NOW });
    expect(browse.interpreted.mode).toBe('category');
    expect(browse.hits.every((hit) => hit.kind === 'hotels')).toBe(true);
    // The reader clicks the Yangon card, which only sets `city`.
    const drilled = searchAll({ query: 'hotels', city: 'yangon', now: NOW });
    expect(drilled.interpreted).toEqual({ mode: 'city_category', city: 'yangon', kind: 'hotels', text: '' });
    expect(drilled.hits.length).toBeGreaterThan(0);
    expect(drilled.hits.every((hit) => hit.kind === 'hotels' && hit.cityId === 'yangon')).toBe(true);
  });

  it('leaves an unknown city in the URL as a plain empty result, not a false chip', () => {
    const odd = searchAll({ query: 'hotels', city: 'atlantis' as never, now: NOW });
    expect(odd.interpreted).toEqual({ mode: 'category', kind: 'hotels', text: '' });
    expect(odd.hits).toEqual([]);
  });
});

describe('acceptance criterion 6: nearest needs a location (§16H.13)', () => {
  it('refuses nearest without one and orders by distance with one', () => {
    const refused = searchAll({ query: 'yangon', sort: 'nearest', now: NOW });
    expect(refused.problem).toBe('search_error_location_required');
    expect(refused.hits).toEqual([]);

    const sorted = searchAll({ query: 'yangon', sort: 'nearest', hasLocation: true, now: NOW });
    expect(sorted.problem).toBeUndefined();
    const distances = sorted.hits.map((hit) => hit.distanceKm);
    expect([...distances].sort((a, b) => a - b)).toEqual(distances);
  });
});

describe('acceptance criterion 8: an over-long query is refused (§16H.13)', () => {
  it('refuses 81 characters and answers 80', () => {
    const long = searchAll({ query: 'a'.repeat(81), now: NOW });
    expect(long.problem).toBe('search_error_query_too_long');
    expect(long.hits).toEqual([]);
    expect(searchAll({ query: 'a'.repeat(80), now: NOW }).problem).toBeUndefined();
  });
});

describe('acceptance criterion 10: counts equal the results (§16H.13)', () => {
  it('counts every kind for the same query', () => {
    const result = searchAll({ query: 'yangon', now: NOW });
    const byKind = new Map<string, number>();
    for (const hit of result.hits) byKind.set(hit.kind, (byKind.get(hit.kind) ?? 0) + 1);
    for (const [kind, count] of byKind) {
      expect(result.counts[kind as keyof typeof result.counts], kind).toBe(count);
    }
  });

  it('counts zero for a kind with no match', () => {
    const result = searchAll({ query: 'bagan', now: NOW });
    expect(result.counts.blogs).toBe(0);
  });

  it('counts the cities a category query can show as cards', () => {
    const result = searchAll({ query: 'hotels', now: NOW });
    expect(result.cityCounts.length).toBeGreaterThan(0);
    const total = result.cityCounts.reduce((sum, entry) => sum + entry.count, 0);
    expect(total).toBe(result.hits.length);
  });
});

describe('acceptance criterion 12: a reload reproduces the page (§16H.13)', () => {
  it('gives the same result for the same query twice', () => {
    const first = searchAll({ query: 'yangon hotel', now: NOW });
    const second = searchAll({ query: 'yangon hotel', now: NOW });
    expect(second.hits.map((hit) => hit.id)).toEqual(first.hits.map((hit) => hit.id));
  });

  it('breaks a score tie on rating, then title, so a page does not shuffle', () => {
    const hits = searchAll({ query: 'yangon', now: NOW }).hits;
    for (let index = 1; index < hits.length; index += 1) {
      const previous = hits[index - 1];
      const current = hits[index];
      expect(current.score).toBeLessThanOrEqual(previous.score);
      if (current.score !== previous.score) continue;
      expect(current.rating).toBeLessThanOrEqual(previous.rating);
      if (current.rating === previous.rating) {
        expect(current.title.localeCompare(previous.title)).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('the score table (§16H.7)', () => {
  it('puts an exact title match first', () => {
    const result = searchAll({ query: 'sedona hotel yangon', now: NOW });
    expect(result.hits[0].title.toLowerCase()).toContain('sedona');
  });

  it('adds the boost weight to the score, within its bounds', () => {
    const row = SEARCH_INDEX[0];
    const plain = searchAll({ query: row.title, now: NOW }).hits.find((hit) => hit.id === row.id)!;
    const boosted = searchAll({ query: row.title, now: NOW }, [{ ...row, boostWeight: 50 }])
      .hits.find((hit) => hit.id === row.id)!;
    expect(boosted.score - plain.score).toBe(50);
  });

  it('never returns more than the maximum', () => {
    expect(searchAll({ query: '', now: NOW }).hits.length).toBeLessThanOrEqual(MAX_RESULTS);
  });

  it('reads a similarity of 1 for the same text and 0 for an empty one', () => {
    expect(trigramSimilarity('bagan', 'bagan')).toBe(1);
    expect(trigramSimilarity('', 'bagan')).toBe(0);
    expect(trigramSimilarity('bagan', '')).toBe(0);
    expect(trigramSimilarity('bagan', 'hotel')).toBeLessThan(CANDIDATE_SIMILARITY);
  });
});

describe('suggestions (§16H.10)', () => {
  it('stays quiet until two characters', () => {
    expect(suggest('b')).toEqual([]);
    expect(suggest('')).toEqual([]);
  });

  it('suggests a title and an alias', () => {
    expect(suggest('sed').length).toBeGreaterThan(0);
    expect(suggest('hot').some((text) => /hotel/i.test(text))).toBe(true);
  });

  it('returns no duplicates and respects the limit', () => {
    const out = suggest('ya', SEARCH_INDEX, undefined, 4);
    expect(new Set(out).size).toBe(out.length);
    expect(out.length).toBeLessThanOrEqual(4);
  });
});

describe('recent searches (§16H.10)', () => {
  function memoryStore(): Storage {
    const map = new Map<string, string>();
    return {
      get length() { return map.size; },
      clear: () => map.clear(),
      getItem: (key: string) => map.get(key) ?? null,
      key: (index: number) => [...map.keys()][index] ?? null,
      removeItem: (key: string) => void map.delete(key),
      setItem: (key: string, value: string) => void map.set(key, value),
    };
  }

  it('keeps the last eight, newest first, without duplicates', () => {
    const store = memoryStore();
    for (let index = 0; index < 10; index += 1) rememberSearch(`query ${index}`, store);
    const recent = readRecentSearches(store);
    expect(recent.length).toBe(RECENT_SEARCHES_MAX);
    expect(recent[0]).toBe('query 9');
    rememberSearch('query 5', store);
    expect(readRecentSearches(store)[0]).toBe('query 5');
    expect(readRecentSearches(store).filter((item) => item === 'query 5').length).toBe(1);
  });

  it('stores the normalized query, never the typing (§16H.11)', () => {
    const store = memoryStore();
    rememberSearch('  Yangon, BAGAN ', store);
    expect(readRecentSearches(store)).toEqual(['yangon bagan']);
  });

  it('clears on request and survives a corrupted store', () => {
    const store = memoryStore();
    rememberSearch('bagan', store);
    expect(clearRecentSearches(store)).toEqual([]);
    expect(readRecentSearches(store)).toEqual([]);
    store.setItem(RECENT_SEARCHES_KEY, '{not json');
    expect(readRecentSearches(store)).toEqual([]);
  });

  it('does nothing without a store, so a server render cannot throw', () => {
    expect(readRecentSearches(null)).toEqual([]);
    expect(rememberSearch('bagan', null)).toEqual([]);
    expect(clearRecentSearches(null)).toEqual([]);
  });
});
