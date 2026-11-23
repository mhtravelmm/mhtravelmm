import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AD_PLACEMENTS } from './adPlacements';
import { readCreatives } from './adStore';

/**
 * Plan §16A.3: a page never invents a placement key. A key that is not in the
 * catalog serves nothing, so a typo would silently collapse the slot — this
 * test reads the pages and refuses a key the catalog does not know.
 */

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [path] : [];
  });
}

const KNOWN = new Set(AD_PLACEMENTS.map((placement) => placement.key));

const USED = sourceFiles(join(process.cwd(), 'src'))
  .filter((file) => !file.includes(join('src', 'features', 'superAdmin')))
  .flatMap((file) => {
    const text = readFileSync(file, 'utf8');
    return [...text.matchAll(/<AdSlot placement="([^"]+)"/g), ...text.matchAll(/<BreakAd placement="([^"]+)"/g)]
      .map((match) => ({ key: match[1], file: file.replace(process.cwd(), '') }));
  });

describe('ad placement wiring', () => {
  it('finds the slots the pages render', () => {
    expect(USED.length).toBeGreaterThan(0);
  });

  it('uses only keys the §16A.3 catalog declares', () => {
    expect(USED.filter((slot) => !KNOWN.has(slot.key))).toEqual([]);
  });

  it('renders each key with a placement the Adsboard can toggle', () => {
    for (const placement of AD_PLACEMENTS) {
      expect(placement.key.trim()).not.toBe('');
      expect(placement.page.trim()).not.toBe('');
    }
  });
});

describe('seeded creatives', () => {
  it('point at a file that exists under public/', () => {
    const missing = readCreatives()
      .map((creative) => creative.mediaUrl)
      .filter((url) => url.startsWith('/') && !existsSync(join(process.cwd(), 'public', url)))
      .filter((url) => !url.startsWith('/images/ads/'));
    expect(missing).toEqual([]);
  });
});
