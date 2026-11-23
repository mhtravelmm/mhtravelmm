import type { Language } from '../types';

/**
 * Plan §10 §8 and the decision register's row 16: a card hides a rating and a
 * distance it does not have, rather than showing `0.0` and `0 km`. Views and
 * favourites always show, so only these two are conditional. Kept here so the
 * rule is one function the card and its tests read, not a condition repeated at
 * every call site.
 */

/** A rating is shown only when one was collected; zero means "not rated". */
export function hasRating(listing: { rating: number }): boolean {
  return Number.isFinite(listing.rating) && listing.rating > 0;
}

/**
 * A distance is shown only when the item has coordinates and the reader's
 * location was known; zero means "unknown", not "next door".
 */
export function hasDistance(listing: { distanceKm: number }): boolean {
  return Number.isFinite(listing.distanceKm) && listing.distanceKm > 0;
}

/** One decimal place, in the language's digits and separators. */
export function formatRating(rating: number, language: Language): string {
  return oneDecimal(rating, language);
}

/** `1.2 km`, or `၁.၂ ကီလိုမီတာ` in Myanmar. */
export function formatDistance(km: number, language: Language): string {
  const text = oneDecimal(km, language);
  return language === 'mm' ? `${text} ကီလိုမီတာ` : `${text} km`;
}

/** The app's one number convention: `Intl` with the `my-MM` locale in Myanmar. */
function oneDecimal(value: number, language: Language): string {
  return new Intl.NumberFormat(language === 'mm' ? 'my-MM' : 'en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}
