import { describe, expect, it } from 'vitest';
import {
  AD_PLACEMENTS,
  BLOG_INLINE_KEY,
  normalizePlacements,
  pageLabelKey,
  placementByKey,
  placementsForPage,
  resolvePlacementKey,
  setPlacementActive,
  setPlacementFallback,
  AD_PAGES,
} from './adPlacements';
import { translate } from './translations';

describe('the §16A.3 placement catalog', () => {
  it('names every placement and page in both languages', () => {
    for (const placement of AD_PLACEMENTS) {
      expect(translate(placement.labelKey, 'mm')).toBeTruthy();
      expect(translate(placement.labelKey, 'en')).toBeTruthy();
      expect(AD_PAGES).toContain(placement.page as (typeof AD_PAGES)[number]);
      expect(translate(pageLabelKey(placement.page), 'en')).toBeTruthy();
    }
  });

  it('uses one key per position and no duplicates', () => {
    const keys = AD_PLACEMENTS.map((placement) => placement.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('falls every blog key back to the inline slot', () => {
    expect(resolvePlacementKey('blog_story-1_reader')).toBe(BLOG_INLINE_KEY);
    expect(resolvePlacementKey('blog_post_top')).toBe('blog_post_top');
    expect(resolvePlacementKey('nowhere_at_all')).toBeNull();
  });

  it("orders a page's placements by sort order", () => {
    const home = placementsForPage('home');
    expect(home.map((placement) => placement.key)).toEqual([
      'home_hero',
      'home_after_travel_plans',
      'home_after_hotels',
      'home_after_blogs',
      'home_after_reviews',
      'home_after_partners',
    ]);
  });

  it('keeps the Plan default when a stored catalog is missing a placement', () => {
    const restored = normalizePlacements([{ ...AD_PLACEMENTS[0], active: false }]);
    expect(restored).toHaveLength(AD_PLACEMENTS.length);
    expect(restored[0].active).toBe(false);
    expect(restored[1].active).toBe(AD_PLACEMENTS[1].active);
  });

  it('toggles one placement without touching the others', () => {
    const off = setPlacementActive(AD_PLACEMENTS, 'home_hero', false);
    expect(placementByKey('home_hero', off)?.active).toBe(false);
    expect(placementByKey('home_after_blogs', off)?.active).toBe(true);

    const noFallback = setPlacementFallback(off, 'home_hero', false);
    expect(placementByKey('home_hero', noFallback)?.fallbackAllowed).toBe(false);
  });
});
