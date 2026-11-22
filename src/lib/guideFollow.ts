/**
 * Plan §10: "Follow this route" walks a guide one stop at a time. The state is
 * a single index, so the reader can step forward and back without losing place.
 */
export type FollowStep = { index: number; position: number; total: number; isFirst: boolean; isLast: boolean };

export function followStep(index: number, total: number): FollowStep {
  const safeTotal = Math.max(0, total);
  const safeIndex = safeTotal === 0 ? 0 : Math.min(Math.max(0, index), safeTotal - 1);
  return {
    index: safeIndex,
    position: safeTotal === 0 ? 0 : safeIndex + 1,
    total: safeTotal,
    isFirst: safeIndex === 0,
    isLast: safeTotal === 0 || safeIndex === safeTotal - 1,
  };
}

/** Moves one stop, stopping at both ends rather than wrapping. */
export function stepIndex(index: number, total: number, offset: -1 | 1): number {
  return followStep(index + offset, total).index;
}
