import { useMemo } from 'react';
import type { CardListing } from '../types';
import { useFavorites } from '../lib/favorites';

/**
 * Projects the shared favorite store onto a page's listing collection.
 * Every page keeps the same favorite identity and updates immediately when
 * another route toggles the same item.
 */
export function useToggleFavorite<T extends CardListing>(initial: T[]) {
  const { overrides, toggleFavorite } = useFavorites();
  const listings = useMemo(() => initial.map((listing) => ({
    ...listing,
    isFavorited: overrides[listing.id] ?? listing.isFavorited,
  })), [initial, overrides]);

  function toggle(id: string) {
    const listing = initial.find((item) => item.id === id);
    toggleFavorite(id, listing?.isFavorited ?? false);
  }

  return { listings, toggle };
}
