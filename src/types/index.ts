/**
 * Shared types for MH Travel.
 *
 * IMPORTANT: `CardListing` is the shape used by every card component
 * across the app (Travel Plans, Travel Guide, Blogs, Populars, Nearby,
 * City cards, business listings, etc).
 *
 * Per the confirmed design rule, every one of these cards must always
 * show: rating, distance, favorite state, and views. Those four fields
 * are therefore REQUIRED (not optional) below — this is intentional,
 * so a card can't be built without them. If a real value isn't known
 * yet for some content type, use an explicit placeholder (e.g. 0) or
 * revisit whether that content type belongs on a card at all, rather
 * than making the field optional.
 */
export interface CardListing {
  id: string;
  title: string;
  imageUrl?: string;
  rating: number; // 0-5
  distanceKm: number;
  isFavorited: boolean;
  views: number;
  /** Optional context-specific fields */
  subtitle?: string;
  priceLabel?: string; // e.g. "$ 580" or "$95 / night"
  badgeLabel?: string; // e.g. "Best seller", "Open now"
  href?: string;
}

export type ListingCategory =
  | 'hotel'
  | 'restaurant'
  | 'book_shop'
  | 'pagoda'
  | 'monastery'
  | 'bank'
  | 'atm'
  | 'exchanger'
  | 'market'
  | 'police_station'
  | 'cafe';

export type RentalCategory =
  | 'car'
  | 'motorbike'
  | 'motorboat'
  | 'horse_carriage'
  | 'bicycle'
  | 'camping_tent'
  | 'travel_guide';

export type BookingFlowMode = 'full_manual' | 'instant';

export type PriceDisplayMode = 'hidden' | 'after_payment' | 'public';

export type Language = 'mm' | 'en';
export type Currency = 'MMK' | 'USD';
export type Theme = 'dark' | 'light';
