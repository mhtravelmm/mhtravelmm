import { beforeEach, describe, expect, it } from 'vitest';
import {
  cleanupOrphanMedia,
  isReferenced,
  keyForUrl,
  listMediaObjects,
  orphansAt,
  registerMediaObject,
  touchMediaUrls,
  touchMediaObjects,
} from './mediaObjects';

function fakeWindow() {
  const map = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => { map.set(key, value); },
      removeItem: (key: string) => { map.delete(key); },
      clear: () => map.clear(),
      key: () => null,
      get length() { return map.size; },
    },
    dispatchEvent: () => true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
}

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

function register(key: string, url = `https://r2.example/${key}`) {
  registerMediaObject({ key, url, folder: 'blog-posts', bytes: 1000, contentType: 'image/webp' });
}

/** Rewrites the stored row's timestamp, since registering always stamps "now". */
function ageRow(key: string, days: number) {
  const rows = listMediaObjects().map((row) => (row.key === key ? { ...row, lastReferencedAt: daysAgo(days) } : row));
  (globalThis as { window: { localStorage: { setItem: (k: string, v: string) => void } } }).window.localStorage
    .setItem('mh-travel-media-objects', JSON.stringify(rows));
}

beforeEach(() => { fakeWindow(); });

describe('the media object table (Plan §16B.6)', () => {
  it('registers one row per upload with both timestamps', () => {
    register('blog-posts/bagan.webp');
    const [row] = listMediaObjects();
    expect(row.key).toBe('blog-posts/bagan.webp');
    expect(row.folder).toBe('blog-posts');
    expect(row.createdAt).toBe(row.lastReferencedAt);
  });

  it('replaces the row when the same key is registered twice', () => {
    register('blog-posts/bagan.webp');
    register('blog-posts/bagan.webp');
    expect(listMediaObjects()).toHaveLength(1);
  });

  it('finds an object by the URL a content row stores', () => {
    register('blog-posts/bagan.webp');
    expect(keyForUrl('https://r2.example/blog-posts/bagan.webp')).toBe('blog-posts/bagan.webp');
  });

  it('returns null for a URL that was never uploaded through this store', () => {
    expect(keyForUrl('/images/blog/seeded.webp')).toBeNull();
  });
});

describe('a save keeps the photos it still uses', () => {
  it('moves lastReferencedAt forward', () => {
    register('blog-posts/bagan.webp');
    ageRow('blog-posts/bagan.webp', 40);
    expect(isReferenced('blog-posts/bagan.webp')).toBe(false);

    touchMediaUrls(['https://r2.example/blog-posts/bagan.webp']);
    expect(isReferenced('blog-posts/bagan.webp')).toBe(true);
  });

  it('ignores a URL that has no row, so a seeded image cannot be kept alive by accident', () => {
    expect(() => touchMediaUrls(['/images/blog/seeded.webp'])).not.toThrow();
    expect(listMediaObjects()).toHaveLength(0);
  });

  it('ignores a key that has no row', () => {
    touchMediaObjects(['blog-posts/unknown.webp']);
    expect(listMediaObjects()).toHaveLength(0);
  });

  it('leaves a photo the save no longer names alone, so it can age out', () => {
    register('blog-posts/kept.webp');
    register('blog-posts/dropped.webp');
    ageRow('blog-posts/dropped.webp', 40);
    touchMediaUrls(['https://r2.example/blog-posts/kept.webp']);
    expect(isReferenced('blog-posts/dropped.webp')).toBe(false);
  });
});

describe('the nightly orphan cleanup', () => {
  it('removes an object nothing has referenced for 30 days', () => {
    register('blog-posts/old.webp');
    ageRow('blog-posts/old.webp', 31);
    expect(cleanupOrphanMedia()).toEqual(['blog-posts/old.webp']);
    expect(listMediaObjects()).toHaveLength(0);
  });

  it('keeps an object referenced 30 days ago, because the rule is "more than"', () => {
    register('blog-posts/edge.webp');
    ageRow('blog-posts/edge.webp', 30);
    expect(cleanupOrphanMedia()).toEqual([]);
    expect(listMediaObjects()).toHaveLength(1);
  });

  it('finds nothing on a second run, so the job is safe to run twice', () => {
    register('blog-posts/old.webp');
    ageRow('blog-posts/old.webp', 40);
    cleanupOrphanMedia();
    expect(cleanupOrphanMedia()).toEqual([]);
  });

  it('reports only the orphans it removed', () => {
    register('blog-posts/old.webp');
    register('blog-posts/new.webp');
    ageRow('blog-posts/old.webp', 40);
    expect(orphansAt(new Date()).map((row) => row.key)).toEqual(['blog-posts/old.webp']);
    expect(cleanupOrphanMedia().length).toBe(1);
    expect(listMediaObjects().map((row) => row.key)).toEqual(['blog-posts/new.webp']);
  });
});
