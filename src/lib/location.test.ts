import { describe, expect, it } from 'vitest';
import {
  CITY_CENTERS,
  LOCATION_CITY_IDS,
  LOCATION_KEY,
  cityCenter,
  distanceKm,
  readLocation,
  rememberLocation,
} from './location';

/**
 * Plan §16H.4 and §16H.9, ticket O-50. Distance is the one number `nearest` sorts
 * on, and the city centre is what a row without coordinates is measured from, so
 * both are held here rather than trusted by eye.
 */

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const rows = new Map(Object.entries(initial));
  return {
    get length() {
      return rows.size;
    },
    clear: () => rows.clear(),
    getItem: (key) => rows.get(key) ?? null,
    key: (index) => [...rows.keys()][index] ?? null,
    removeItem: (key) => {
      rows.delete(key);
    },
    setItem: (key, value) => {
      rows.set(key, value);
    },
  } as Storage;
}

describe('the city centres (§16H.4)', () => {
  it('has a centre and a label for every city the override offers', () => {
    for (const id of LOCATION_CITY_IDS) {
      expect(CITY_CENTERS[id], id).toBeDefined();
      expect(Number.isFinite(CITY_CENTERS[id].lat), id).toBe(true);
      expect(Number.isFinite(CITY_CENTERS[id].lng), id).toBe(true);
      expect(CITY_CENTERS[id].labelKey.startsWith('search_'), id).toBe(true);
    }
  });

  it('falls back to Yangon for a city it does not know, so a row is never unmeasured', () => {
    expect(cityCenter('atlantis')).toEqual(cityCenter('yangon'));
  });
});

describe('distanceKm (§16H.7 nearest)', () => {
  it('is zero at the same point', () => {
    expect(distanceKm(cityCenter('yangon'), cityCenter('yangon'))).toBe(0);
  });

  it('matches the known road-free gap between Yangon and Bagan, within a few km', () => {
    // Great-circle Yangon → Bagan is about 500 km; a wrong formula lands far off.
    const km = distanceKm(cityCenter('yangon'), cityCenter('bagan'));
    expect(km).toBeGreaterThan(470);
    expect(km).toBeLessThan(530);
  });

  it('is symmetric and to one decimal', () => {
    const there = distanceKm(cityCenter('mandalay'), cityCenter('inle'));
    const back = distanceKm(cityCenter('inle'), cityCenter('mandalay'));
    expect(there).toBe(back);
    expect(Math.round(there * 10)).toBeCloseTo(there * 10, 6);
  });
});

describe('the remembered reader location (§16H.9)', () => {
  it('round-trips a GPS point', () => {
    const store = memoryStorage();
    rememberLocation({ point: { lat: 16.8, lng: 96.15 }, source: 'gps' }, store);
    expect(readLocation(store)).toEqual({ point: { lat: 16.8, lng: 96.15 }, source: 'gps' });
  });

  it('does not store the fallback, so a reload asks GPS again', () => {
    const store = memoryStorage();
    rememberLocation({ point: cityCenter('yangon'), source: 'fallback' }, store);
    expect(store.getItem(LOCATION_KEY)).toBeNull();
    expect(readLocation(store)).toBeNull();
  });

  it('ignores a stored row that is not a usable point', () => {
    for (const raw of ['not json', '{}', '{"source":"gps"}', '{"source":"gps","point":{"lat":"16","lng":96}}']) {
      expect(readLocation(memoryStorage({ [LOCATION_KEY]: raw })), raw).toBeNull();
    }
  });

  it('keeps working with no store at all', () => {
    expect(readLocation(null)).toBeNull();
    expect(() => rememberLocation({ point: { lat: 1, lng: 2 }, source: 'manual' }, null)).not.toThrow();
  });
});
