import { describe, expect, it } from 'vitest';
import { FALLBACK_LOCATION } from './location';
import { NEARBY_KINDS, NEARBY_RADIUS_KM, nearbyRpcArgs, previewNearby, runNearby, toNearbyItem } from './nearbyApi';
import { SEARCH_INDEX } from './searchIndex';

/**
 * Plan §16H.9 and §16G.3, ticket O-51. The Nearby page has no matching rule of
 * its own, so these are the rules it inherits: the radius, the kind filter, the
 * nearest-first order, Open Now, and the two refusals.
 */

const YANGON = FALLBACK_LOCATION.point;

/** An instant whose Myanmar clock reads `hh:mm`, which is what Open Now uses. */
function atMmt(hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return new Date(Date.UTC(2026, 11, 2, hours, minutes) - (6 * 60 + 30) * 60_000);
}

describe('the function call (§16G.3)', () => {
  it('spells every parameter name the function declares', () => {
    expect(nearbyRpcArgs({ lat: 16.8, lng: 96.1 })).toEqual({
      p_lat: 16.8,
      p_lng: 96.1,
      p_radius_km: NEARBY_RADIUS_KM,
      p_kinds: null,
      p_open_now: false,
      p_limit: 20,
      p_offset: 0,
      p_lang: 'en',
    });
  });

  // The function's item shape is `search_all`'s plus the distance fields
  // (§16H.7). A raw row carried `title_en` and no `title`, so the card drew no
  // name; this pins the names the page reads.
  it('declares every field a card reads on the item', () => {
    const item = previewNearby({ lat: 16.8, lng: 96.1, limit: 1 }).items[0];
    for (const field of ['kind', 'ref_id', 'title', 'href', 'distance_km', 'open_now', 'latitude', 'longitude']) {
      expect(item).toHaveProperty(field);
    }
    expect(item.title).not.toBe('');
  });

  it('asks for the reader\'s language, so the name comes back translated', () => {
    expect(nearbyRpcArgs({ lat: 1, lng: 2, lang: 'mm' }).p_lang).toBe('mm');
  });

  it('passes the reader\'s choices through', () => {
    const args = nearbyRpcArgs({ lat: 1, lng: 2, radiusKm: 1, kinds: ['cafes'], openNow: true, limit: 5, offset: 10 });
    expect(args.p_radius_km).toBe(1);
    expect(args.p_kinds).toEqual(['cafes']);
    expect(args.p_open_now).toBe(true);
    expect(args.p_offset).toBe(10);
    expect(args.p_limit).toBe(5);
  });

  it('sends an empty kind list as no filter rather than as a filter that matches nothing', () => {
    expect(nearbyRpcArgs({ lat: 1, lng: 2, kinds: [] }).p_kinds).toBeNull();
  });
});

describe('the preview answer (§16H.9)', () => {
  it('returns only what is inside the radius', () => {
    const near = previewNearby({ lat: YANGON.lat, lng: YANGON.lng, radiusKm: 1 });
    expect(near.items.length).toBeGreaterThan(0);
    for (const item of near.items) expect(item.distance_km).toBeLessThanOrEqual(1);
  });

  it('orders nearest first', () => {
    const items = previewNearby({ lat: YANGON.lat, lng: YANGON.lng, radiusKm: 10 }).items;
    const distances = items.map((item) => item.distance_km);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });

  it('narrows to the kinds asked for', () => {
    const items = previewNearby({ lat: YANGON.lat, lng: YANGON.lng, kinds: ['cafes'] }).items;
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) expect(item.kind).toBe('cafes');
  });

  it('finds every kind the category row offers, so no chip is a dead end', () => {
    const found = new Set(previewNearby({ lat: YANGON.lat, lng: YANGON.lng, limit: 200 }).items.map((item) => item.kind));
    for (const kind of NEARBY_KINDS) expect(found, kind).toContain(kind);
  });

  it('pages with limit and offset without repeating a row', () => {
    const all = previewNearby({ lat: YANGON.lat, lng: YANGON.lng, limit: 200 }).items;
    const first = previewNearby({ lat: YANGON.lat, lng: YANGON.lng, limit: 3, offset: 0 }).items;
    const second = previewNearby({ lat: YANGON.lat, lng: YANGON.lng, limit: 3, offset: 3 }).items;
    expect([...first, ...second].map((item) => item.ref_id)).toEqual(all.slice(0, 6).map((item) => item.ref_id));
  });
});

describe('Open Now on a Nearby row (§16H.9, criterion 7)', () => {
  const row = SEARCH_INDEX.find((entry) => entry.kind === 'cafes' && entry.openTime);

  it('judges the stored hours against the Myanmar clock', () => {
    expect(row).toBeDefined();
    const open = toNearbyItem(row!, YANGON, atMmt('12:00'));
    const closed = toNearbyItem(row!, YANGON, atMmt('03:00'));
    expect(open.open_now).toBe(true);
    expect(closed.open_now).toBe(false);
    expect(open.closes_at).toBe(row!.closeTime?.slice(0, 5));
  });

  it('excludes a closed row when Open Now is asked for', () => {
    const items = previewNearby({ lat: YANGON.lat, lng: YANGON.lng, openNow: true, limit: 200 }, SEARCH_INDEX, atMmt('03:00')).items;
    expect(items.every((item) => item.open_now)).toBe(true);
    const all = previewNearby({ lat: YANGON.lat, lng: YANGON.lng, limit: 200 }, SEARCH_INDEX, atMmt('03:00')).items;
    expect(items.length).toBeLessThan(all.length);
  });

  it('never calls a row with no hours open', () => {
    const noHours = SEARCH_INDEX.filter((entry) => !entry.openTime);
    expect(noHours.length).toBeGreaterThan(0);
    for (const entry of noHours) {
      expect(toNearbyItem(entry, YANGON, atMmt('12:00')).open_now, entry.id).toBe(false);
    }
  });
});

describe('the refusals (§16G.2)', () => {
  it('refuses a call with no point', async () => {
    const outcome = await runNearby({ lat: Number.NaN, lng: 96.1 });
    expect(outcome).toEqual({ ok: false, code: 'search_error_location_required' });
  });

  it('answers from the preview while the search flag is off', async () => {
    const outcome = await runNearby({ lat: YANGON.lat, lng: YANGON.lng });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.result.items.length).toBeGreaterThan(0);
  });
});

describe('a row as the card draws it', () => {
  it('carries the pin, the address and the distance the page shows', () => {
    const entry = SEARCH_INDEX.find((candidate) => candidate.kind === 'gyms' && candidate.address);
    expect(entry).toBeDefined();
    const item = toNearbyItem(entry!, YANGON, atMmt('12:00'));
    expect(item.latitude).toBe(entry!.lat);
    expect(item.longitude).toBe(entry!.lng);
    expect(item.address).toBe(entry!.address);
    expect(item.distance_km).toBeGreaterThanOrEqual(0);
    expect(item.href).toBe(entry!.href);
  });
});
