import { readCreatives } from './adStore';

/**
 * Plan §3A.5 Needs attention and §16A.7: the creatives waiting for approval.
 * The Adsboard owns the rows; the Overview reads the count through this so
 * the two screens cannot disagree.
 */
export function pendingCreativeCount(): number {
  return readCreatives().filter((row) => row.approval === 'pending').length;
}

/** The shape the Overview asks for, kept as one call so the count is one read. */
export function adStoreRows(): { pendingCreatives: number } {
  return { pendingCreatives: pendingCreativeCount() };
}
