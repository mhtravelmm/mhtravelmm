/**
 * Plan §16H.4 and §16H.9, ticket O-50. The search index carries a latitude and
 * a longitude per row, and `search_nearby` measures from the reader's own point.
 * This module holds the two things that need to agree with the server: the city
 * centres a row without coordinates falls back to, and the distance formula.
 *
 * The centre table is also what the page's manual location override offers, so
 * choosing "Mandalay" measures from the same point the server would use.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/** The centre of each city in the catalog, and the key that names it. */
export const CITY_CENTERS: Record<string, LatLng & { labelKey: string }> = {
  yangon: { lat: 16.8409, lng: 96.1735, labelKey: 'search_yangon' },
  bago: { lat: 17.335, lng: 96.4815, labelKey: 'search_bago' },
  naypyidaw: { lat: 19.7633, lng: 96.0785, labelKey: 'search_naypyidaw' },
  mandalay: { lat: 21.9588, lng: 96.0891, labelKey: 'search_mandalay' },
  bagan: { lat: 21.1717, lng: 94.8603, labelKey: 'search_bagan' },
  inle: { lat: 20.55, lng: 96.9167, labelKey: 'search_inle' },
};

/** The city ids the override offers, in the order the chips show them. */
export const LOCATION_CITY_IDS = ['yangon', 'bago', 'naypyidaw', 'mandalay', 'bagan', 'inle'];

/** Where a row without its own coordinates is measured from. */
export function cityCenter(cityId: string): LatLng {
  const center = CITY_CENTERS[cityId] ?? CITY_CENTERS.yangon;
  return { lat: center.lat, lng: center.lng };
}

/** The great-circle distance in kilometres, to one decimal. */
export function distanceKm(from: LatLng, to: LatLng): number {
  const radius = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const km = radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(km * 10) / 10;
}

export type LocationSource = 'gps' | 'manual' | 'fallback';

export interface ReaderLocation {
  point: LatLng;
  source: LocationSource;
}

/** The fallback §16H.9 names: the centre of Yangon, so the page keeps working. */
export const FALLBACK_LOCATION: ReaderLocation = { point: cityCenter('yangon'), source: 'fallback' };

export const LOCATION_KEY = 'mh-travel-reader-location';

/**
 * A location is remembered on the device only, so a reload of a shared results
 * URL keeps the distance order the sender saw without asking for GPS again.
 */
export function readLocation(store: Storage | null = safeStorage()): ReaderLocation | null {
  if (!store) return null;
  try {
    const parsed: unknown = JSON.parse(store.getItem(LOCATION_KEY) ?? 'null');
    if (!parsed || typeof parsed !== 'object') return null;
    const value = parsed as Partial<ReaderLocation>;
    if (value.source !== 'gps' && value.source !== 'manual') return null;
    const lat = value.point?.lat;
    const lng = value.point?.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { point: { lat, lng }, source: value.source };
  } catch {
    return null;
  }
}

export function rememberLocation(location: ReaderLocation | null, store: Storage | null = safeStorage()): void {
  if (!store) return;
  try {
    if (!location || location.source === 'fallback') store.removeItem(LOCATION_KEY);
    else store.setItem(LOCATION_KEY, JSON.stringify(location));
  } catch {
    // A blocked store only costs the reader a re-ask, never the page.
  }
}

/**
 * §16H.9: GPS is asked for silently. A refusal, a timeout or a browser without
 * geolocation resolves to `null`, which the page shows as the Yangon fallback.
 */
export function requestGps(timeoutMs = 7000): Promise<LatLng | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 300000 },
    );
  });
}

function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
