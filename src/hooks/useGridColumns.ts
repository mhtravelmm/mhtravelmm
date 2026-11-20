import { useEffect, useState, type RefObject } from 'react';

/**
 * Live column count of a CSS grid, read from its computed
 * `grid-template-columns`. Card lists use it to page by whole rows, so a
 * "Load More" control only appears once every visible row is full.
 */
export function useGridColumns(ref: RefObject<HTMLElement | null>, fallback = 1): number {
  const [columns, setColumns] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const read = () => {
      const value = getComputedStyle(element).gridTemplateColumns;
      const count = value.split(' ').filter(Boolean).length;
      if (count > 0) setColumns(count);
    };

    read();
    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return columns;
}
