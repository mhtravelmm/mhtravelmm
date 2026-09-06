import { useState } from 'react';
import type { CardListing } from '../types';

/**
 * Manages local favorite/unfavorite state for a set of listings.
 *
 * This is a client-side placeholder: it makes the heart icon actually
 * respond to taps. Once Favorites (Section 22) is backed by Supabase,
 * `toggle` should also write/delete the corresponding row for the
 * logged-in user instead of only updating local state.
 */
export function useToggleFavorite(initial: CardListing[]) {
  const [listings, setListings] = useState(initial);

  function toggle(id: string) {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isFavorited: !l.isFavorited } : l))
    );
  }

  return { listings, toggle };
}
