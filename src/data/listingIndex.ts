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
} from './cityPageData';
import { NEARBY_LISTINGS } from './nearbyData';

export type IndexedListing = { id: string; title: string };

/**
 * Every listing a guide stop may point at. Plan §10 allows only places that
 * already exist in MH Travel, so this is the whole set the editor can offer.
 */
export const LISTING_INDEX: IndexedListing[] = [
  ...TOP_ATTRACTIONS,
  ...POPULAR_HOTELS,
  ...POPULAR_RESTAURANTS,
  ...POPULAR_CAFES,
  ...POPULAR_MARKETS,
  ...POPULAR_BOOK_SHOPS,
  ...POPULAR_TRANSPORT,
  ...RENTAL_PAGE_LISTINGS,
  ...CITY_TRAVEL_GUIDES,
  ...NEARBY_LISTINGS,
]
  .map((listing) => ({ id: listing.id, title: listing.title }))
  .filter((listing, index, all) => all.findIndex((item) => item.id === listing.id) === index);

export const LISTING_IDS: ReadonlySet<string> = new Set(LISTING_INDEX.map((listing) => listing.id));

export function listingTitle(id: string): string {
  return LISTING_INDEX.find((listing) => listing.id === id)?.title ?? id;
}
