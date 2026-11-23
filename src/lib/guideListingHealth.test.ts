import { describe, expect, it } from 'vitest';
import { LISTING_INDEX } from '../data/listingIndex';
import type { AdminGuide } from './contentStore';
import { seedGuides } from './contentStore';
import { adminGuideToReader } from './contentReader';
import { guideNeedsReview, missingListingStops, stopListingMissing } from './guideListingHealth';

const liveListing = LISTING_INDEX[0].id;
const removedListing = 'listing-that-was-removed';

const guide = (overrides: Partial<AdminGuide> = {}): AdminGuide => ({
  ...seedGuides()[0],
  id: 'admin-guide',
  slug: '',
  status: 'Published',
  ...overrides,
});

describe('a stop whose listing left the catalog (Plan §10 §5 acceptance 7)', () => {
  it('treats a current listing as healthy', () => {
    expect(stopListingMissing(liveListing)).toBe(false);
  });

  it('treats a removed listing as missing', () => {
    expect(stopListingMissing(removedListing)).toBe(true);
  });

  it('never reports a stop that has no listing at all', () => {
    expect(stopListingMissing('')).toBe(false);
  });

  it('names every stop that needs attention', () => {
    const rows = guide({
      stops: [
        { ...seedGuides()[0].stops[0], id: 'ok', listingId: liveListing },
        { ...seedGuides()[0].stops[0], id: 'gone', listingId: removedListing },
      ],
    });
    expect(missingListingStops(rows)).toEqual(['gone']);
    expect(guideNeedsReview(rows)).toBe(true);
  });

  it('clears itself when the listing comes back, without an editor opening the guide', () => {
    const rows = guide({ stops: [{ ...seedGuides()[0].stops[0], listingId: liveListing }] });
    expect(guideNeedsReview(rows)).toBe(false);
  });
});

describe('the reader keeps a guide whose listing was removed', () => {
  const removed = () => guide({
    stops: [{
      ...seedGuides()[0].stops[0],
      listingId: removedListing,
      titleEn: 'The old teahouse',
      titleMm: 'လက်ဖက်ရည်ဆိုင် အောင်း',
    }],
  });

  it('still projects the guide, so a published guide stays up', () => {
    const story = adminGuideToReader(removed());
    expect(story.stops).toHaveLength(1);
  });

  it('keeps the stop title it stored instead of showing the missing listing id', () => {
    expect(adminGuideToReader(removed()).stops[0].place).toBe('The old teahouse');
  });

  it('marks the stop so the page can turn Directions off', () => {
    expect(adminGuideToReader(removed()).stops[0].listingMissing).toBe(true);
  });

  it('leaves a live listing unmarked and named from the catalog', () => {
    const stop = adminGuideToReader(guide({ stops: [{ ...seedGuides()[0].stops[0], listingId: liveListing }] })).stops[0];
    expect(stop.listingMissing).toBeUndefined();
    expect(stop.place).toBe(LISTING_INDEX[0].title);
  });
});
