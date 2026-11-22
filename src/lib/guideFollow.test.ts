import { describe, expect, it } from 'vitest';
import { followStep, stepIndex } from './guideFollow';

describe('followStep', () => {
  it('reports a one-based position and the total', () => {
    expect(followStep(0, 3)).toEqual({ index: 0, position: 1, total: 3, isFirst: true, isLast: false });
    expect(followStep(2, 3)).toEqual({ index: 2, position: 3, total: 3, isFirst: false, isLast: true });
  });

  it('clamps an index that falls outside the route', () => {
    expect(followStep(-4, 3).index).toBe(0);
    expect(followStep(9, 3).index).toBe(2);
  });

  it('reports an empty route as both first and last', () => {
    expect(followStep(0, 0)).toEqual({ index: 0, position: 0, total: 0, isFirst: true, isLast: true });
  });
});

describe('stepIndex', () => {
  it('stops at the ends instead of wrapping', () => {
    expect(stepIndex(0, 3, -1)).toBe(0);
    expect(stepIndex(2, 3, 1)).toBe(2);
  });

  it('moves one stop at a time', () => {
    expect(stepIndex(0, 3, 1)).toBe(1);
    expect(stepIndex(2, 3, -1)).toBe(1);
  });
});
