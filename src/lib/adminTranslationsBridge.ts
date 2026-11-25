import { readTranslationCache } from './translationCache';

/**
 * Plan §3A.5 and §16B.4: the rows waiting for review in the translation queue.
 */
export function translationReviewCount(): number {
  return readTranslationCache().filter((row) => row.status === 'auto').length;
}
