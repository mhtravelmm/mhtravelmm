import { describe, expect, it } from 'vitest';
import { formatDistance, formatRating, hasDistance, hasRating } from './cardMeta';

describe('a card hides what it does not have (Plan §10 §8, decision register 16)', () => {
  it('shows a rating only when one was collected', () => {
    expect(hasRating({ rating: 4.9 })).toBe(true);
    expect(hasRating({ rating: 0 })).toBe(false);
  });

  it('treats a rating that is not a number as absent rather than printing NaN', () => {
    expect(hasRating({ rating: Number.NaN })).toBe(false);
    expect(hasRating({ rating: Number.POSITIVE_INFINITY })).toBe(false);
  });

  it('shows a distance only when the item has coordinates', () => {
    expect(hasDistance({ distanceKm: 3.2 })).toBe(true);
    expect(hasDistance({ distanceKm: 0 })).toBe(false);
  });

  it('treats an unknown distance as absent, not as next door', () => {
    expect(hasDistance({ distanceKm: Number.NaN })).toBe(false);
  });

  it('never returns a negative rating or distance as present', () => {
    expect(hasRating({ rating: -1 })).toBe(false);
    expect(hasDistance({ distanceKm: -0.5 })).toBe(false);
  });
});

describe('a rating and a distance in the reader language', () => {
  it('writes one decimal place', () => {
    expect(formatRating(4.94, 'en')).toBe('4.9');
    expect(formatDistance(3.27, 'en')).toBe('3.3 km');
  });

  it('uses Myanmar digits and the Myanmar unit in Myanmar', () => {
    expect(formatRating(4.9, 'mm')).toBe('၄.၉');
    expect(formatDistance(3.2, 'mm')).toBe('၃.၂ ကီလိုမီတာ');
  });
});
