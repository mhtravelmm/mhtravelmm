import type { CardListing, BookingFlowMode, PriceDisplayMode } from '../types';
import { DEFAULT_SHOP_PHOTO_QUOTA } from './mediaRules';
import {
  CITY_TRAVEL_GUIDES,
  POPULAR_BOOK_SHOPS,
  POPULAR_CAFES,
  POPULAR_HOTELS,
  POPULAR_MARKETS,
  POPULAR_RESTAURANTS,
  POPULAR_TRANSPORT,
  RENTAL_PAGE_LISTINGS,
  TOP_ATTRACTIONS,
} from '../data/cityPageData';
import { NEARBY_LISTINGS } from '../data/nearbyData';

/**
 * The browser twin of `public.listings` (Plan §16C.2). The table is the same
 * row shape the compiled catalog already carries, so a module can move from
 * `src/data` to a query without changing its components: `toListingRow()` is
 * the one place the two shapes are reconciled, and the seed in
 * `supabase/migrations/20261130000100_listings.sql` is generated from
 * `SEED_LISTING_ROWS` so the table and the catalog cannot drift.
 */

export type ListingCategory =
  | 'attraction'
  | 'hotel'
  | 'guesthouse'
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'market'
  | 'book_shop'
  | 'rental'
  | 'transport'
  | 'travel_guide'
  | 'exchange'
  | 'hospital'
  | 'clinic'
  | 'gym';

export type ListingStatus = 'pending' | 'active' | 'suspended' | 'retired';

export interface ListingRow {
  id: string;
  category: ListingCategory;
  city_id: string;
  /** Null for MH-managed content; a shop owner's account id otherwise. */
  owner_id: string | null;
  name_mm: string | null;
  name_en: string;
  description_mm: string | null;
  description_en: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  open_time: string | null;
  close_time: string | null;
  checkin_time: string | null;
  checkout_time: string | null;
  price_display: PriceDisplayMode;
  price_from_mmk: number | null;
  price_from_usd: number | null;
  booking_flow_mode: BookingFlowMode;
  status: ListingStatus;
  rating: number | null;
  review_count: number;
  favorite_count: number;
  views: number;
  image_url: string | null;
  href: string;
  /** Admin-set bound on `listing_photos`; §16C.2, defaulted by the migration. */
  photo_quota: number;
  /**
   * Plan §9: set once, when the first Admin approval makes the row live. An
   * owner's later edit keeps the row live instead of dropping it to Pending.
   */
  first_approved_at: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Every category the table accepts. The migration's check constraint is this
 * list, and the test reads both so adding a category here without the SQL —
 * or the reverse — fails.
 */
export const LISTING_CATEGORIES: ListingCategory[] = [
  'attraction',
  'hotel',
  'guesthouse',
  'restaurant',
  'cafe',
  'bar',
  'market',
  'book_shop',
  'rental',
  'transport',
  'travel_guide',
  'exchange',
  'hospital',
  'clinic',
  'gym',
];

export const LISTING_STATUSES: ListingStatus[] = ['pending', 'active', 'suspended', 'retired'];

export const PRICE_DISPLAY_MODES: PriceDisplayMode[] = ['hidden', 'after_payment', 'public'];

export const BOOKING_FLOW_MODES: BookingFlowMode[] = ['full_manual', 'instant'];

/**
 * The compiled catalog is Yangon by default — that is what the city page it
 * feeds renders. These records sit in another city, which their distance
 * column already says; the id is the only reliable key, so name them here
 * rather than guess from a distance threshold.
 */
const CITY_OVERRIDES: Record<string, string> = {
  ta5: 'mandalay', // U Bein bridge
  pm4: 'mandalay', // Scott market
  pt5: 'inle', // Inle ferry lines
  pre9: 'bagan', // Bagan horse carriage
  pre10: 'inle', // Inle camping tent
  pre11: 'mandalay', // Mandalay tricycle
  'near-hotel-2': 'yangon',
};

/** Records the seed cannot name in MM yet; the reader falls back to EN. */
interface SeedGroup {
  category: ListingCategory;
  items: CardListing[];
  /** Hotels carry check-in/out and a booking flow; the rest do not. */
  bookingFlow?: BookingFlowMode;
  priceDisplay?: PriceDisplayMode;
}

const GROUPS: SeedGroup[] = [
  { category: 'attraction', items: TOP_ATTRACTIONS },
  { category: 'hotel', items: POPULAR_HOTELS, bookingFlow: 'full_manual', priceDisplay: 'public' },
  { category: 'restaurant', items: POPULAR_RESTAURANTS, priceDisplay: 'public' },
  { category: 'cafe', items: POPULAR_CAFES, priceDisplay: 'public' },
  { category: 'market', items: POPULAR_MARKETS },
  { category: 'book_shop', items: POPULAR_BOOK_SHOPS, priceDisplay: 'public' },
  { category: 'rental', items: RENTAL_PAGE_LISTINGS, bookingFlow: 'full_manual', priceDisplay: 'public' },
  { category: 'transport', items: POPULAR_TRANSPORT, bookingFlow: 'instant', priceDisplay: 'public' },
  { category: 'travel_guide', items: CITY_TRAVEL_GUIDES, bookingFlow: 'full_manual', priceDisplay: 'public' },
  { category: 'guesthouse', items: NEARBY_LISTINGS.filter((item) => item.category === 'guesthouse'), bookingFlow: 'full_manual', priceDisplay: 'public' },
  { category: 'bar', items: NEARBY_LISTINGS.filter((item) => item.category === 'bar'), priceDisplay: 'public' },
  { category: 'exchange', items: NEARBY_LISTINGS.filter((item) => item.category === 'exchange') },
  { category: 'hospital', items: NEARBY_LISTINGS.filter((item) => item.category === 'hospital') },
  { category: 'clinic', items: NEARBY_LISTINGS.filter((item) => item.category === 'clinic') },
  { category: 'gym', items: NEARBY_LISTINGS.filter((item) => item.category === 'gym') },
  // The nearby seed repeats places that already have a row under their own id,
  // but each carries a map pin and an address the catalog rows do not, so they
  // stay separate records until the map columns are filled for the originals.
  { category: 'hotel', items: NEARBY_LISTINGS.filter((item) => item.category === 'hotel'), bookingFlow: 'full_manual', priceDisplay: 'public' },
  { category: 'restaurant', items: NEARBY_LISTINGS.filter((item) => item.category === 'restaurant'), priceDisplay: 'public' },
  { category: 'cafe', items: NEARBY_LISTINGS.filter((item) => item.category === 'cafe'), priceDisplay: 'public' },
  { category: 'market', items: NEARBY_LISTINGS.filter((item) => item.category === 'market') },
  { category: 'book_shop', items: NEARBY_LISTINGS.filter((item) => item.category === 'book_shop'), priceDisplay: 'public' },
  { category: 'attraction', items: NEARBY_LISTINGS.filter((item) => item.category === 'attraction') },
  { category: 'rental', items: NEARBY_LISTINGS.filter((item) => item.category === 'rental'), bookingFlow: 'full_manual', priceDisplay: 'public' },
];

/**
 * Plan §9: "Every listing has open and close times; hotels also have check-in
 * and check-out times." The compiled catalog carries no hours, so each category
 * gets the hours a traveler would expect from it. An Owner edits these; the
 * point is that a seeded row is valid the moment it is opened.
 */
const OPEN_CLOSE_BY_CATEGORY: Partial<Record<ListingCategory, { open: string; close: string }>> = {
  attraction: { open: '08:00', close: '17:00' },
  hotel: { open: '00:00', close: '23:59' },
  guesthouse: { open: '00:00', close: '23:59' },
  restaurant: { open: '10:00', close: '22:00' },
  cafe: { open: '07:00', close: '20:00' },
  bar: { open: '17:00', close: '23:30' },
  market: { open: '08:00', close: '18:00' },
  book_shop: { open: '09:00', close: '19:00' },
  rental: { open: '08:00', close: '18:00' },
  transport: { open: '05:00', close: '21:00' },
  travel_guide: { open: '08:00', close: '18:00' },
  exchange: { open: '09:00', close: '17:00' },
  hospital: { open: '00:00', close: '23:59' },
  clinic: { open: '08:00', close: '17:00' },
  gym: { open: '06:00', close: '22:00' },
};

/** A hotel's stay times; Plan §9 requires both on every hotel and guesthouse. */
const STAY_TIMES = { checkin: '14:00', checkout: '12:00' } as const;

function nearbyDetails(id: string): { address: string; latitude: number; longitude: number } | null {
  const record = NEARBY_LISTINGS.find((item) => item.id === id);
  return record ? { address: record.address, latitude: record.lat, longitude: record.lng } : null;
}

/**
 * One catalog record as a table row. MM text is null rather than a copy of the
 * English: the reader falls back (the translation rule in `Doc/REMAINING-WORK.md`),
 * so a placeholder here would look translated when it is not.
 */
export function toListingRow(item: CardListing, group: SeedGroup): ListingRow {
  const details = nearbyDetails(item.id);
  const hours = OPEN_CLOSE_BY_CATEGORY[group.category];
  const stays = group.category === 'hotel' || group.category === 'guesthouse' ? STAY_TIMES : null;
  return {
    id: item.id,
    category: group.category,
    city_id: CITY_OVERRIDES[item.id] ?? 'yangon',
    owner_id: null,
    name_mm: null,
    name_en: item.title,
    description_mm: null,
    description_en: item.subtitle ?? null,
    address: details?.address ?? null,
    latitude: details?.latitude ?? null,
    longitude: details?.longitude ?? null,
    open_time: hours?.open ?? null,
    close_time: hours?.close ?? null,
    checkin_time: stays?.checkin ?? null,
    checkout_time: stays?.checkout ?? null,
    // Plan §9 lets an Owner choose hidden, after payment or public. A mode that
    // shows a price needs one, so a record the catalog has no price for is
    // hidden rather than public — otherwise the row fails its own validation.
    price_display: item.priceUsd === undefined ? 'hidden' : (group.priceDisplay ?? 'hidden'),
    price_from_mmk: null,
    price_from_usd: item.priceUsd ?? null,
    booking_flow_mode: group.bookingFlow ?? 'full_manual',
    status: 'active',
    rating: item.rating > 0 ? item.rating : null,
    review_count: 0,
    favorite_count: 0,
    views: item.views,
    image_url: item.imageUrl ?? null,
    href: item.href ?? '/',
    photo_quota: DEFAULT_SHOP_PHOTO_QUOTA,
    // The seed inserts every catalog row as active, and the SQL writes the §9
    // stamp for exactly those, so the twin has to agree or the browser would
    // treat a live row as never approved and a later Owner edit would drop it
    // back to Pending.
    first_approved_at: SEED_APPROVED_AT,
  };
}

/** A fixed stamp so the fixture is deterministic; the SQL uses its own `now()`. */
const SEED_APPROVED_AT = '2026-11-30T00:00:00.000Z';

/** Every row the migration seeds, in insertion order, deduplicated by id. */
export const SEED_LISTING_ROWS: ListingRow[] = GROUPS.flatMap((group) =>
  group.items.map((item) => toListingRow(item, group)),
).filter((row, index, all) => all.findIndex((other) => other.id === row.id) === index);

export function findListingRow(id: string): ListingRow | undefined {
  return SEED_LISTING_ROWS.find((row) => row.id === id);
}

/** The row a card renders, so a page can keep taking `CardListing`. */
export function toCardListing(row: ListingRow): CardListing {
  return {
    id: row.id,
    title: row.name_en,
    imageUrl: row.image_url ?? undefined,
    rating: row.rating ?? 0,
    distanceKm: 0,
    isFavorited: false,
    views: row.views,
    subtitle: row.description_en ?? undefined,
    priceUsd: row.price_from_usd ?? undefined,
    href: row.href,
  };
}
