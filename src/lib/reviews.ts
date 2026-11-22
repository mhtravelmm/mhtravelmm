import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabase';

export type PlatformReview = {
  id: string;
  name: string;
  rating: number;
  text: string;
};

const TABLE = 'reviews';
/** Platform reviews are the rows with no listing attached. */
const PLATFORM_SCOPE = null;

function toReview(row: Record<string, unknown>, index: number): PlatformReview {
  return {
    id: String(row.id ?? `review-${index}`),
    name: String(row.author_name ?? row.name ?? 'Traveler'),
    rating: Number(row.rating ?? 0),
    text: String(row.body ?? row.text ?? ''),
  };
}

/**
 * Platform-level reviews, meaning the review of MH Travel itself rather than a
 * business. The seeded rows stand in until the table answers, so the home page
 * never renders an empty section while the request is in flight.
 */
export function usePlatformReviews(seed: PlatformReview[]) {
  const [reviews, setReviews] = useState<PlatformReview[]>(seed);
  const [source, setSource] = useState<'supabase' | 'seed'>(isSupabaseConfigured ? 'supabase' : 'seed');

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) { setSource('seed'); return; }

    let active = true;
    void (async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, author_name, rating, body')
        .is('listing_id', PLATFORM_SCOPE)
        .order('created_at', { ascending: false })
        .limit(3);
      if (!active) return;
      if (error || !data || data.length === 0) { setSource('seed'); return; }
      setReviews(data.map((row, index) => toReview(row as Record<string, unknown>, index)));
      setSource('supabase');
    })();

    return () => { active = false; };
  }, [seed]);

  return { reviews, source };
}
