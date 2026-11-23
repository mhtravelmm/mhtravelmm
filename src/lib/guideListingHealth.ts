import type { AdminGuide } from './contentStore';
import { LISTING_IDS } from '../data/listingIndex';

/**
 * Plan §10 §5 acceptance 7: when a listing leaves the catalog, the guides that
 * point at it are flagged rather than hidden — a published guide stays up and
 * keeps the copy it stored for that stop. The flag is derived, not stored, so a
 * listing that comes back clears it without an editor opening the guide.
 */
export function stopListingMissing(listingId: string): boolean {
  return listingId !== '' && !LISTING_IDS.has(listingId);
}

export function missingListingStops(guide: Pick<AdminGuide, 'stops'>): string[] {
  return guide.stops.filter((stop) => stopListingMissing(stop.listingId)).map((stop) => stop.id);
}

export function guideNeedsReview(guide: Pick<AdminGuide, 'stops'>): boolean {
  return missingListingStops(guide).length > 0;
}
