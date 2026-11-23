import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AD_VIDEO,
  DEFAULT_SHOP_PHOTO_QUOTA,
  MEDIA_RULES,
  ORPHAN_MEDIA_DAYS,
  acceptFor,
  checkMedia,
  folderPrefix,
  isOrphan,
  maxBytesFor,
  mediaKind,
  orphanCandidates,
  type MediaFolder,
} from './mediaRules';
import { MEDIA_FOLDERS } from './mediaApi';

const KB = 1024;

describe('media folders', () => {
  it('lists the five Plan §16B.6 folders in order', () => {
    expect(MEDIA_FOLDERS).toEqual(['blog-posts', 'guide-stops', 'ads', 'rentals', 'shops']);
  });

  it('keeps every prefix under its folder name', () => {
    for (const folder of MEDIA_FOLDERS) {
      expect(MEDIA_RULES[folder].prefix).toBe(`${folder}/`);
    }
  });

  it('holds the Plan limits: 450 KB for content, 300 KB for an ad image', () => {
    expect(maxBytesFor('blog-posts')).toBe(450 * KB);
    expect(maxBytesFor('guide-stops')).toBe(450 * KB);
    expect(maxBytesFor('rentals')).toBe(450 * KB);
    expect(maxBytesFor('shops')).toBe(450 * KB);
    expect(maxBytesFor('ads')).toBe(300 * KB);
  });

  it('allows a 3 MB ad video and no other folder', () => {
    expect(maxBytesFor('ads', 'video')).toBe(3 * 1024 * KB);
    expect(AD_VIDEO.maxSeconds).toBe(15);
    expect(MEDIA_RULES['blog-posts'].accepts).not.toContain('video/mp4');
  });
});

describe('folderPrefix', () => {
  it('returns a fixed prefix for the four shared folders', () => {
    expect(folderPrefix('blog-posts')).toBe('blog-posts/');
    expect(folderPrefix('guide-stops')).toBe('guide-stops/');
    expect(folderPrefix('ads')).toBe('ads/');
    expect(folderPrefix('rentals')).toBe('rentals/');
  });

  it('namespaces a shop photo by the shop id', () => {
    expect(folderPrefix('shops', 'sedona')).toBe('shops/sedona/');
  });

  it('refuses a missing or path-like shop id', () => {
    expect(folderPrefix('shops')).toBeNull();
    expect(folderPrefix('shops', '   ')).toBeNull();
    expect(folderPrefix('shops', '../admin')).toBeNull();
    expect(folderPrefix('shops', 'a/b')).toBeNull();
  });
});

describe('mediaKind', () => {
  it('separates an image from a video', () => {
    expect(mediaKind('image/webp')).toBe('image');
    expect(mediaKind('video/mp4')).toBe('video');
    expect(mediaKind('application/pdf')).toBeNull();
  });
});

describe('checkMedia', () => {
  const image = (type: string, size: number) => ({ type, size });

  it('accepts a WebP inside the content limit', () => {
    const result = checkMedia('blog-posts', image('image/webp', 400 * KB));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.kind).toBe('image');
      expect(result.prefix).toBe('blog-posts/');
    }
  });

  it('refuses an oversized stored image', () => {
    expect(checkMedia('guide-stops', image('image/webp', 451 * KB), { stage: 'final' })).toEqual({ ok: false, code: 'too_large' });
  });

  it('lets a large original through, because it is compressed first', () => {
    expect(checkMedia('guide-stops', image('image/png', 5 * 1024 * KB)).ok).toBe(true);
    expect(checkMedia('guide-stops', image('image/png', 13 * 1024 * KB))).toEqual({ ok: false, code: 'too_large' });
  });

  it('refuses a type the folder does not list', () => {
    expect(checkMedia('blog-posts', image('image/gif', 100 * KB))).toEqual({ ok: false, code: 'unsupported_type' });
    expect(checkMedia('blog-posts', image('video/mp4', 100 * KB))).toEqual({ ok: false, code: 'unsupported_type' });
    expect(checkMedia('rentals', image('application/pdf', 100 * KB))).toEqual({ ok: false, code: 'unsupported_type' });
  });

  it('refuses an ad image above 300 KB but allows it under', () => {
    expect(checkMedia('ads', image('image/webp', 301 * KB), { stage: 'final' })).toEqual({ ok: false, code: 'too_large' });
    expect(checkMedia('ads', image('image/webp', 300 * KB), { stage: 'final' }).ok).toBe(true);
  });

  it('allows a 3 MB, 15-second ad video', () => {
    const result = checkMedia('ads', image('video/mp4', 3 * 1024 * KB), { seconds: 15 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.kind).toBe('video');
  });

  it('refuses an ad video that is too long or too heavy', () => {
    expect(checkMedia('ads', image('video/mp4', 1024 * KB), { seconds: 16 })).toEqual({ ok: false, code: 'video_too_long' });
    expect(checkMedia('ads', image('video/mp4', 3 * 1024 * KB + 1), { seconds: 10 })).toEqual({ ok: false, code: 'too_large' });
  });

  it('needs a shop id for a shop photo', () => {
    expect(checkMedia('shops', image('image/webp', 100 * KB))).toEqual({ ok: false, code: 'shop_required' });
    expect(checkMedia('shops', image('image/webp', 100 * KB), { shopId: 'sedona' }).ok).toBe(true);
  });

  it('stops a shop at its photo quota', () => {
    const atQuota = checkMedia('shops', image('image/webp', 100 * KB), {
      shopId: 'sedona',
      shopPhotoCount: DEFAULT_SHOP_PHOTO_QUOTA,
    });
    expect(atQuota).toEqual({ ok: false, code: 'quota_reached' });
    const below = checkMedia('shops', image('image/webp', 100 * KB), {
      shopId: 'sedona',
      shopPhotoCount: DEFAULT_SHOP_PHOTO_QUOTA - 1,
    });
    expect(below.ok).toBe(true);
  });

  it('uses the Admin-set quota when one is given', () => {
    const result = checkMedia('shops', image('image/webp', 100 * KB), {
      shopId: 'sedona',
      shopPhotoCount: 5,
      shopQuota: 5,
    });
    expect(result).toEqual({ ok: false, code: 'quota_reached' });
  });

  it('ignores the quota for a folder that is not a shop', () => {
    const result = checkMedia('blog-posts', image('image/webp', 100 * KB), { shopPhotoCount: 99, shopQuota: 1 });
    expect(result.ok).toBe(true);
  });
});

describe('acceptFor', () => {
  it('offers exactly what the folder accepts', () => {
    expect(acceptFor('blog-posts')).toBe('image/jpeg,image/png,image/webp');
    expect(acceptFor('ads')).toContain('video/mp4');
    for (const folder of MEDIA_FOLDERS as MediaFolder[]) {
      expect(acceptFor(folder).split(',')).toEqual([...MEDIA_RULES[folder].accepts]);
    }
  });
});

describe('orphan cleanup', () => {
  const now = new Date('2026-11-24T00:00:00.000Z');
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  it('keeps an object referenced within 30 days', () => {
    expect(isOrphan({ key: 'blog-posts/a.webp', lastReferencedAt: daysAgo(29) }, now)).toBe(false);
    expect(isOrphan({ key: 'blog-posts/a.webp', lastReferencedAt: daysAgo(30) }, now)).toBe(false);
  });

  it('removes an object nothing referenced for more than 30 days', () => {
    expect(isOrphan({ key: 'blog-posts/a.webp', lastReferencedAt: daysAgo(31) }, now)).toBe(true);
    expect(ORPHAN_MEDIA_DAYS).toBe(30);
  });

  it('keeps an object with an unreadable date rather than guessing', () => {
    expect(isOrphan({ key: 'blog-posts/a.webp', lastReferencedAt: 'not a date' }, now)).toBe(false);
  });

  it('lists only the orphans', () => {
    const objects = [
      { key: 'blog-posts/old.webp', lastReferencedAt: daysAgo(40) },
      { key: 'blog-posts/new.webp', lastReferencedAt: daysAgo(1) },
      { key: 'ads/old.mp4', lastReferencedAt: daysAgo(90) },
    ];
    expect(orphanCandidates(objects, now).map((object) => object.key)).toEqual(['blog-posts/old.webp', 'ads/old.mp4']);
  });
});

/** The Worker and this module must not disagree about a limit; the SQL is the copy. */
describe('the media migration repeats these limits', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase', 'migrations', '20261123000500_media_objects.sql'), 'utf8');

  it('lists the same five folders', () => {
    for (const folder of MEDIA_FOLDERS) {
      expect(sql).toContain(`'${folder}'`);
    }
  });

  it('holds the same byte ceilings', () => {
    expect(sql).toContain(String(3 * 1024 * 1024));
    expect(sql).toContain(String(300 * 1024));
    expect(sql).toContain(String(450 * 1024));
  });

  it('keeps the 30-day orphan rule', () => {
    expect(sql).toContain('p_days integer default 30');
    expect(ORPHAN_MEDIA_DAYS).toBe(30);
  });

  it('records the reference time the cleanup reads', () => {
    expect(sql).toContain('last_referenced_at');
    expect(sql).toContain('public.orphan_media_objects');
  });
});

describe('the effective rule', () => {
  it('reports the video limits for an ad video', () => {
    const result = checkMedia('ads', { type: 'video/mp4', size: 2 * 1024 * 1024 }, { seconds: 12 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rule.maxBytes).toBe(3 * 1024 * 1024);
    expect(result.rule.maxSeconds).toBe(15);
    expect(result.rule.stores).toBe('video/mp4');
  });

  it('reports the image limits for an ad image', () => {
    const result = checkMedia('ads', { type: 'image/webp', size: 100 * 1024 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rule.maxBytes).toBe(300 * 1024);
    expect(result.rule.stores).toBe('image/webp');
  });
});
