import { readGuideEarnings } from './guideEarningsStore';

/**
 * Plan §3A.5: "published and unpriced" — an earning row with no amount yet.
 */
export function guideEarningsUnpriced(): number {
  return readGuideEarnings().filter((row) => row.amountUsd === null).length;
}
