import { useEffect, useState } from 'react';

/**
 * One page size for every paged grid. It divides evenly into two, three, four
 * and six columns, so a revealed batch always fills its rows.
 */
export const PAGE_SIZE = 12;

export type PageWindow = { visibleCount: number; hasMore: boolean };

/**
 * Clamps a requested page length to the records that exist, so the last batch
 * is short rather than hidden.
 */
export function pageWindow(total: number, requested: number): PageWindow {
  const visibleCount = Math.max(0, Math.min(total, requested));
  return { visibleCount, hasMore: visibleCount < total };
}

/**
 * Pages a filtered list in whole batches of `PAGE_SIZE`. `resetKey` returns the
 * list to the first batch whenever the filter changes.
 */
export function usePagedList<T>(items: T[], resetKey: string) {
  const [requested, setRequested] = useState(PAGE_SIZE);

  useEffect(() => {
    setRequested(PAGE_SIZE);
  }, [resetKey]);

  const { visibleCount, hasMore } = pageWindow(items.length, requested);

  return {
    visibleItems: items.slice(0, visibleCount),
    hasMore,
    loadMore: () => setRequested((count) => count + PAGE_SIZE),
    showAll: () => setRequested(Number.POSITIVE_INFINITY),
  };
}
