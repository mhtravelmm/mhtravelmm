import { describe, expect, it } from 'vitest';
import { PAGE_SIZE, pageWindow } from './usePagedList';

describe('PAGE_SIZE', () => {
  it('divides evenly into every grid column count the app uses', () => {
    for (const columns of [2, 3, 4, 6]) {
      expect(PAGE_SIZE % columns).toBe(0);
    }
  });
});

describe('pageWindow', () => {
  it('shows the first batch and reports that more remain', () => {
    expect(pageWindow(30, PAGE_SIZE)).toEqual({ visibleCount: 12, hasMore: true });
  });

  it('reveals a whole second batch', () => {
    expect(pageWindow(30, PAGE_SIZE * 2)).toEqual({ visibleCount: 24, hasMore: true });
  });

  it('clamps the last batch instead of hiding the tail', () => {
    expect(pageWindow(14, PAGE_SIZE * 2)).toEqual({ visibleCount: 14, hasMore: false });
  });

  it('hides Load More once everything is shown', () => {
    expect(pageWindow(7, PAGE_SIZE)).toEqual({ visibleCount: 7, hasMore: false });
    expect(pageWindow(12, PAGE_SIZE)).toEqual({ visibleCount: 12, hasMore: false });
  });

  it('handles an empty list', () => {
    expect(pageWindow(0, PAGE_SIZE)).toEqual({ visibleCount: 0, hasMore: false });
  });
});
