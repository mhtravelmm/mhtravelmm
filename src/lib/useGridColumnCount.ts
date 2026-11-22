import { useEffect, useState, type RefObject } from 'react';

/**
 * Reads how many columns a CSS grid currently renders, so a "load more" control
 * can page by whole rows. Reads the computed track list rather than duplicating
 * the responsive breakpoints in JavaScript.
 */
export function useGridColumnCount(ref: RefObject<HTMLElement | null>): number {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const read = () => {
      const tracks = window.getComputedStyle(element).gridTemplateColumns;
      const count = tracks.split(' ').filter(Boolean).length;
      if (count > 0) setColumns(count);
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return columns;
}

/**
 * Rounds a requested count up to the end of its row, so a page of results never
 * ends on a ragged row. Six items in a four-column grid become eight. The final
 * page is clamped to what exists, so no record is ever hidden.
 */
export function alignToRow(total: number, visible: number, columns: number): number {
  if (columns <= 1) return Math.min(total, visible);
  return Math.min(total, Math.ceil(visible / columns) * columns);
}
