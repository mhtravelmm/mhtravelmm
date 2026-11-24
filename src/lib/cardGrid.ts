import type { CardSize } from '../components/ui/ListingCard';

/**
 * The width each card size caps a card at, in pixels. It mirrors the
 * `maxWidth` class in `ListingCard.tsx`; `cardGrid.test.ts` reads that file
 * and fails if the two disagree.
 */
export const CARD_MAX_WIDTH_PX: Record<CardSize, number> = { xs: 150, sm: 190, md: 240, lg: 300, xl: 340 };

/** Tailwind `gap-2` / `gap-2.5` / `gap-3` in pixels. */
const GAP_PX = { 2: 8, 2.5: 10, 3: 12 } as const;
export type GridGap = keyof typeof GAP_PX;

/**
 * Plan §4: a grid that hosts cards directly repeats one cap —
 * `justify-items-center` plus a width of `columns × the size's max width +
 * gaps`. Computing it from the card table is what stops a page hand-writing a
 * value that contradicts the `size` it passes down. The result is applied as
 * an inline style because Tailwind cannot see a class built at runtime.
 */
export function cardGridMaxWidth(columns: number, size: CardSize, gap: GridGap = 2.5): number {
  return columns * CARD_MAX_WIDTH_PX[size] + (columns - 1) * GAP_PX[gap];
}

/** Ready-made style for a capped card grid. */
export function cardGridStyle(columns: number, size: CardSize, gap: GridGap = 2.5): { maxWidth: number } {
  return { maxWidth: cardGridMaxWidth(columns, size, gap) };
}
