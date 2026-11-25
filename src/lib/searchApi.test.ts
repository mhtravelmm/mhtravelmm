import { describe, expect, it } from 'vitest';
import {
  fromRemoteSearch,
  previewPayload,
  refusalFor,
  runSearch,
  searchRpcArgs,
  runSuggest,
  toSearchHit,
  type RemoteSearchPayload,
} from './searchApi';
import { MAX_QUERY_LENGTH, searchAll } from './searchIndex';
import { normalizeSearchText } from './searchText';
import { cityCenter } from './location';

/**
 * Plan §16G.3, §16H.6, §16H.7 and §16H.8, ticket O-50. The page never sees a
 * payload: it sees a `SearchResult`. These tests hold the seam that makes that
 * true — the arguments the function is called with, the two refusals the page
 * must show in words, and the payload → result mapping.
 */

const YANGON = cityCenter('yangon');

describe('the arguments search_all is called with (§16G.3)', () => {
  it('spells every parameter the Plan names, with the defaults filled in', () => {
    expect(searchRpcArgs({ q: 'bagan' })).toEqual({
      p_q: 'bagan',
      p_lang: 'en',
      p_city: null,
      p_kinds: null,
      p_sort: 'relevance',
      p_lat: null,
      p_lng: null,
      p_limit: 20,
      p_offset: 0,
    });
  });

  it('sends a kind as a one-item array, because the function takes text[]', () => {
    expect(searchRpcArgs({ q: 'x', kind: 'hotels' }).p_kinds).toEqual(['hotels']);
  });

  // §16H.5 step 3: the 115-rule Zawgyi conversion exists only in the client, so
  // the query has to arrive already normalized or a Zawgyi reader matches
  // nothing. The other six steps are repeated by `normalize_search_text()`.
  it('sends the query normalized, so a Zawgyi or upper-case query still matches', () => {
    const zawgyi = searchRpcArgs({ q: 'ေရႊတိဂံု' }).p_q as string;
    expect(zawgyi).toBe(normalizeSearchText('ရွှေတိဂုံ'));
    expect(searchRpcArgs({ q: 'HOTEL  Yangon' }).p_q).toBe('hotel yangon');
    expect(searchRpcArgs({ q: 'ဟိုတယ်၊ ၁၂၃' }).p_q).toBe('ဟိုတယ် 123');
  });

  it('passes the reader point and the page window through', () => {
    const args = searchRpcArgs({ q: 'x', lat: 16.8, lng: 96.1, limit: 50, offset: 20, lang: 'mm' });
    expect(args.p_lat).toBe(16.8);
    expect(args.p_lng).toBe(96.1);
    expect(args.p_limit).toBe(50);
    expect(args.p_offset).toBe(20);
    expect(args.p_lang).toBe('mm');
  });
});

describe('the suggestions the page asks for (§16H.8)', () => {
  // `search_suggest()` also reads the alias table, so an Admin's new alias is
  // offered before the page's seed has it. Both paths must answer `string[]`.
  it('answers the preview list while the flag is off', async () => {
    const rows = await runSuggest('bag');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((text) => typeof text === 'string' && text.length > 0)).toBe(true);
  });

  it('refuses a one-character prefix, which the function also refuses', async () => {
    expect(await runSuggest('b')).toEqual([]);
    expect(await runSuggest('   ')).toEqual([]);
  });

  it('sends a normalized prefix so a Zawgyi reader still gets suggestions', async () => {
    // The preview matches on normalized text, so a Zawgyi prefix that maps to a
    // seeded title has to answer something; an un-normalized one would not.
    const rows = await runSuggest('ဟိုတယ်');
    expect(Array.isArray(rows)).toBe(true);
  });

  it('never repeats a suggestion', async () => {
    const rows = await runSuggest('hotel', 'en', 8);
    expect(new Set(rows).size).toBe(rows.length);
  });
});

describe('the two refusals the page can know without asking (§16H.6, §16H.7)', () => {
  it('refuses a query past the limit and answers exactly at it', () => {
    expect(refusalFor({ q: 'a'.repeat(MAX_QUERY_LENGTH + 1) })).toBe('search_error_query_too_long');
    expect(refusalFor({ q: 'a'.repeat(MAX_QUERY_LENGTH) })).toBeUndefined();
  });

  it('refuses nearest without a location, and allows it with one', () => {
    expect(refusalFor({ q: 'yangon', sort: 'nearest' })).toBe('search_error_location_required');
    expect(refusalFor({ q: 'yangon', sort: 'nearest', lat: YANGON.lat, lng: YANGON.lng })).toBeUndefined();
  });

  it('never refuses relevance, which needs no location', () => {
    expect(refusalFor({ q: 'yangon', sort: 'relevance' })).toBeUndefined();
  });
});

describe('the payload becomes the shape the page renders (§16H.8)', () => {
  const payload: RemoteSearchPayload = {
    items: [
      {
        kind: 'hotels',
        ref_id: 'h1',
        title: 'Sedona hotel Yangon',
        subtitle: null,
        href: '/hotels/sedona-yangon',
        thumbnail_url: null,
        city_id: 'yangon',
        rating: 4.8,
        distance_km: 2.5,
        score: 142.5,
      },
    ],
    counts: { hotels: 1, restaurants: 0 },
    interpreted: { mode: 'city_category', city: 'yangon', kind: 'hotels', text: '' },
    city_counts: { yangon: 1 },
    next_offset: null,
  };

  it('keeps the server score and distance instead of rescoring locally', () => {
    const result = fromRemoteSearch(payload, { q: 'hotels yangon' });
    expect(result.hits[0].score).toBe(142.5);
    expect(result.hits[0].distanceKm).toBe(2.5);
    expect(result.hits[0].href).toBe('/hotels/sedona-yangon');
  });

  it('reads a missing count as zero, so a chip never overstates a list', () => {
    const result = fromRemoteSearch(payload, { q: 'x' });
    expect(result.counts.hotels).toBe(1);
    expect(result.counts.restaurants).toBe(0);
    expect(result.counts.blogs).toBe(0);
  });

  it('falls back to text mode and the request text when the payload is thin', () => {
    const result = fromRemoteSearch(
      { items: [], counts: null, interpreted: null, city_counts: null, next_offset: null },
      { q: 'bagan' },
    );
    expect(result.interpreted).toEqual({ mode: 'text', city: undefined, kind: undefined, text: 'bagan' });
    expect(result.hits).toEqual([]);
    expect(result.cityCounts).toEqual([]);
  });

  it('orders the city cards by count, so the busiest city leads', () => {
    const result = fromRemoteSearch(
      { ...payload, city_counts: { bago: 1, yangon: 7, mandalay: 3 } },
      { q: 'hotels' },
    );
    expect(result.cityCounts.map((entry) => entry.city)).toEqual(['yangon', 'mandalay', 'bago']);
  });

  it('measures a server hit from its city, because the payload carries no point', () => {
    const hit = toSearchHit(payload.items[0], 'bagan');
    expect(hit.lat).toBe(cityCenter('bagan').lat);
    expect(hit.lng).toBe(cityCenter('bagan').lng);
  });
});

describe('the preview answers in the same envelope as the function', () => {
  it('gives one row per hit, with the id under ref_id', () => {
    const request = { q: 'yangon hotel' };
    const preview = previewPayload(request);
    const direct = searchAll({ query: request.q });
    expect(preview.items.map((item) => item.ref_id)).toEqual(direct.hits.map((hit) => hit.id));
  });

  it('carries the counts and the interpreted query through unchanged', () => {
    const preview = previewPayload({ q: 'hotels yangon' });
    expect(preview.interpreted?.mode).toBe('city_category');
    expect(preview.interpreted?.city).toBe('yangon');
    expect(preview.interpreted?.kind).toBe('hotels');
    expect(preview.counts?.hotels).toBeGreaterThan(0);
  });

  it('survives the round trip, so the page sees what the preview computed', () => {
    const request = { q: 'bagan', lat: YANGON.lat, lng: YANGON.lng };
    const round = fromRemoteSearch(previewPayload(request), request);
    const direct = searchAll({ query: request.q, hasLocation: true, location: YANGON });
    expect(round.hits.map((hit) => hit.id)).toEqual(direct.hits.map((hit) => hit.id));
  });
});

describe('runSearch with the backend flag off (§16G.5)', () => {
  it('answers from the preview, because no Supabase project is configured', async () => {
    const outcome = await runSearch({ q: 'bagan' });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.hits.length).toBeGreaterThan(0);
    expect(outcome.result.interpreted.city).toBe('bagan');
  });

  it('returns the refusal as a code for t(), never as an empty list', async () => {
    const outcome = await runSearch({ q: 'a'.repeat(MAX_QUERY_LENGTH + 1) });
    expect(outcome).toEqual({ ok: false, code: 'search_error_query_too_long' });
  });

  it('refuses nearest without a point before it calls anything', async () => {
    const outcome = await runSearch({ q: 'yangon', sort: 'nearest' });
    expect(outcome).toEqual({ ok: false, code: 'search_error_location_required' });
  });

  it('orders by distance once a point is given', async () => {
    const outcome = await runSearch({ q: 'yangon', sort: 'nearest', lat: YANGON.lat, lng: YANGON.lng });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const distances = outcome.result.hits.map((hit) => hit.distanceKm);
    expect([...distances].sort((a, b) => a - b)).toEqual(distances);
  });

  it('narrows to one kind when the page asks for one', async () => {
    const outcome = await runSearch({ q: 'yangon', kind: 'hotels' });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.hits.every((hit) => hit.kind === 'hotels')).toBe(true);
  });
});
