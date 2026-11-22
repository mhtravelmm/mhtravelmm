import { describe, expect, it } from 'vitest';
import { allPaths, CATEGORY_SLUGS, isKnownHref, PLACE_SLUGS } from '../routes';
import { CATEGORIES, PARTNERS, POPULARS, REVIEWS, AWARDS, TRAVEL_PLANS, TRAVEL_GUIDES, BLOGS } from './homeData';
import * as cityPageData from './cityPageData';
import type { CardListing } from '../types';
import { findPlace, PLACE_KINDS } from '../features/place/placeCatalog';
import { NEARBY_LISTINGS } from './nearbyData';
import { NOTIFICATIONS } from './notifications';

/** Every href string the app can render from seed data. */
function seedHrefs(): string[] {
  const hrefs: string[] = [];
  const collect = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if (typeof record.href === 'string') hrefs.push(record.href);
      Object.values(record).forEach(collect);
    }
  };
  Object.values(cityPageData).forEach(collect);
  [CATEGORIES, PARTNERS, POPULARS, REVIEWS, AWARDS, TRAVEL_PLANS, TRAVEL_GUIDES, BLOGS, NEARBY_LISTINGS, NOTIFICATIONS].forEach(collect);
  return [...new Set(hrefs)];
}

describe('route table', () => {
  it('declares no duplicate paths', () => {
    const paths = allPaths();
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('resolves every category slug to a list route', () => {
    CATEGORY_SLUGS.forEach((slug) => expect(isKnownHref(`/${slug}`)).toBe(true));
  });

  it('resolves a detail id for every place slug', () => {
    PLACE_SLUGS.forEach((slug) => expect(isKnownHref(`/${slug}/abc123`)).toBe(true));
  });

  it('rejects an undeclared path', () => {
    expect(isKnownHref('/not-a-real-page')).toBe(false);
    expect(isKnownHref('/hotels/ph1/extra')).toBe(false);
  });
});

describe('seed data links', () => {
  it('finds hrefs to check', () => {
    expect(seedHrefs().length).toBeGreaterThan(50);
  });

  it('points every seed href at a declared route', () => {
    const broken = seedHrefs().filter((href) => !isKnownHref(href));
    expect(broken).toEqual([]);
  });
});

describe('catalog data', () => {
  it('gives every catalog record a unique id so detail pages can resolve it', () => {
    const duplicates: string[] = [];
    for (const [name, value] of Object.entries(cityPageData)) {
      if (!Array.isArray(value)) continue;
      const ids = (value as CardListing[]).map((item) => item.id).filter(Boolean);
      if (new Set(ids).size !== ids.length) duplicates.push(name);
    }
    expect(duplicates).toEqual([]);
  });

  it('gives every detail href a tail that identifies exactly one record', () => {
    // Detail pages resolve a record by id or by the last href segment, so two
    // records sharing a tail would make one of them unreachable.
    const collisions: string[] = [];
    for (const [name, value] of Object.entries(cityPageData)) {
      if (!Array.isArray(value)) continue;
      const tails = (value as CardListing[])
        .filter((item) => item.href && item.href.split('/').length === 3)
        .map((item) => item.href!.split('/').pop()!);
      if (new Set(tails).size !== tails.length) collisions.push(name);
    }
    expect(collisions).toEqual([]);
  });

  it('resolves a place catalog href to the record that owns it', () => {
    const unresolved = PLACE_KINDS.flatMap((kind) =>
      kind.items
        .filter((item) => item.href?.split('/').length === 3)
        .filter((item) => findPlace(kind, item.href!.split('/').pop()!)?.id !== item.id)
        .map((item) => `${item.href} (${item.id})`),
    );
    expect(unresolved).toEqual([]);
  });
});
