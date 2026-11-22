import { describe, expect, it } from 'vitest';
import { alignToRow } from './useGridColumnCount';

describe('alignToRow', () => {
  it('rounds a request up to the end of its row', () => {
    expect(alignToRow(20, 6, 4)).toBe(8);
    expect(alignToRow(20, 8, 4)).toBe(8);
    expect(alignToRow(20, 5, 2)).toBe(6);
  });

  it('never returns more than the records available', () => {
    expect(alignToRow(7, 6, 4)).toBe(7);
    expect(alignToRow(0, 6, 4)).toBe(0);
  });

  it('keeps a single-column layout at the requested count', () => {
    expect(alignToRow(20, 6, 1)).toBe(6);
  });
});

describe('paging through a list', () => {
  it('shows every remaining record on the last page instead of hiding the tail', () => {
    // Ten guides in a four-column grid: 6 becomes 8, then the last two.
    expect(alignToRow(10, 6, 4)).toBe(8);
    expect(alignToRow(10, 12, 4)).toBe(10);
  });
});
