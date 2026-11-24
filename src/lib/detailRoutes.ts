import type { CardListing } from '../types';
import { findPlace, findPlaceKind } from '../features/place/placeCatalog';
import { POPULAR_BOOK_SHOPS, POPULAR_RESTAURANTS } from '../data/cityPageData';

/**
 * The pages that serve a `/:slug/:id` detail route, and how each one resolves
 * the record its URL names. Every detail page reads through
 * `resolveDetailRecord()`, so a route whose id names nothing renders the
 * not-found state instead of a fallback record — and a test can ask the same
 * function whether a seed href is reachable.
 */
const CATALOG_RESOLVERS: Record<string, (id: string) => CardListing | undefined> = {
  restaurants: (id) => POPULAR_RESTAURANTS.find((item) => item.id === id || item.href?.endsWith(`/${id}`)),
  'book-shops': (id) => POPULAR_BOOK_SHOPS.find((item) => item.id === id || item.href?.endsWith(`/${id}`)),
};

export function resolveDetailRecord(slug: string, id: string): CardListing | undefined {
  const catalog = CATALOG_RESOLVERS[slug];
  if (catalog) return catalog(id);
  const kind = findPlaceKind(slug);
  return kind ? findPlace(kind, id) : undefined;
}

/** Resolves a full detail href such as `/hotels/lotte`; undefined when it is not one. */
export function resolveDetailHref(href: string): CardListing | undefined {
  const segments = href.split('?')[0].split('#')[0].replace(/\/$/, '').split('/').filter(Boolean);
  if (segments.length !== 2) return undefined;
  return resolveDetailRecord(segments[0], segments[1]);
}
