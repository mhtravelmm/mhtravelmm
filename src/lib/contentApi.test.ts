import { describe, expect, it } from 'vitest';
import { fromRemoteBlock, fromRemotePost, publishedOnly, readRemoteBlogPosts } from './contentApi';
import type { RemotePostRow } from './contentApi';
import type { BlogBlock } from './blogBlocks';

/**
 * Plan §10 and ticket O-21. The reader has to show the table's published posts
 * in the same shape the editor writes, or a post published from another browser
 * would render with missing blocks, untagged, or with a blank byline.
 */

const post = (over: Partial<RemotePostRow> = {}): RemotePostRow => ({
  id: 'p1',
  slug: 'bagan-first-light',
  status: 'Published',
  category: 'travel_tips',
  title_en: 'Bagan first light',
  title_mm: 'ပုဂံ အရုဏ်ဦး',
  excerpt_en: 'Sunrise over the plain.',
  excerpt_mm: 'လွင်ပြင်ပေါ်မှ နေထွက်။',
  author_name: 'MH Travel Editorial',
  author_name_mm: 'MH Travel အယ်ဒီတာအဖွဲ့',
  location: 'Bagan',
  location_mm: 'ပုဂံ',
  cover_url: '/images/blog/bagan-sunrise.webp',
  seo_tags: 'bagan, sunrise ,bagan',
  scheduled_for: null,
  published_at: '2026-11-02',
  views: 2840,
  version: 3,
  updated_at: '2026-11-03T02:00:00.000Z',
  deleted_at: null,
  ...over,
});

describe('a blog_blocks row in the editor shape', () => {
  it('reads a text block', () => {
    expect(fromRemoteBlock({ post_id: 'p1', position: 1, kind: 'text', text_en: 'a', text_mm: 'က', image_url: null, alt_en: null, alt_mm: null, caption_en: null, caption_mm: null, credit: null }))
      .toEqual({ id: 'p1-b1', type: 'text', textEn: 'a', textMm: 'က' });
  });

  it('reads an image block with its caption and credit', () => {
    const block = fromRemoteBlock({
      post_id: 'p1', position: 2, kind: 'image', text_en: null, text_mm: null,
      image_url: '/i.webp', alt_en: 'alt', alt_mm: 'အယ်လ်', caption_en: 'c', caption_mm: 'စာ', credit: 'MH',
    });
    expect(block).toEqual({
      id: 'p1-b2', type: 'image', imageUrl: '/i.webp', altEn: 'alt', altMm: 'အယ်လ်',
      captionEn: 'c', captionMm: 'စာ', credit: 'MH',
    });
  });

  it('reads an ad slot, and drops a kind this build does not render', () => {
    expect(fromRemoteBlock({ post_id: 'p1', position: 3, kind: 'ad', text_en: null, text_mm: null, image_url: null, alt_en: null, alt_mm: null, caption_en: null, caption_mm: null, credit: null }))
      .toEqual({ id: 'p1-b3', type: 'ad' });
    expect(fromRemoteBlock({ post_id: 'p1', position: 4, kind: 'video', text_en: null, text_mm: null, image_url: null, alt_en: null, alt_mm: null, caption_en: null, caption_mm: null, credit: null }))
      .toBeNull();
  });
});

describe('a blog_posts row in the store shape', () => {
  it('carries every field the reader and the editor share', () => {
    const mapped = fromRemotePost(post());
    expect(mapped).toMatchObject({
      id: 'p1',
      titleEn: 'Bagan first light',
      titleMm: 'ပုဂံ အရုဏ်ဦး',
      category: 'travel_tips',
      authorEn: 'MH Travel Editorial',
      authorMm: 'MH Travel အယ်ဒီတာအဖွဲ့',
      locationEn: 'Bagan',
      locationMm: 'ပုဂံ',
      imageUrl: '/images/blog/bagan-sunrise.webp',
      status: 'Published',
      publishedAt: '2026-11-02',
      scheduledFor: null,
      deletedAt: null,
      version: 3,
      views: 2840,
    });
  });

  it('normalizes seo_tags through the same list rule the editor uses', () => {
    expect(fromRemotePost(post()).seoTags).toEqual(['bagan', 'sunrise']);
  });

  it('orders blocks by position, not by the order the query returned them', () => {
    const mapped = fromRemotePost(post({
      blog_blocks: [
        { post_id: 'p1', position: 2, kind: 'ad', text_en: null, text_mm: null, image_url: null, alt_en: null, alt_mm: null, caption_en: null, caption_mm: null, credit: null },
        { post_id: 'p1', position: 1, kind: 'text', text_en: 'a', text_mm: 'က', image_url: null, alt_en: null, alt_mm: null, caption_en: null, caption_mm: null, credit: null },
      ],
    }));
    expect(mapped.blocks.map((block: BlogBlock) => block.type)).toEqual(['text', 'ad']);
  });

  it('falls back to the English byline and place when the Myanmar one is empty', () => {
    const mapped = fromRemotePost(post({ author_name_mm: '', location_mm: '' }));
    expect(mapped.authorMm).toBe('MH Travel Editorial');
    expect(mapped.locationMm).toBe('Bagan');
  });

  // A status this build does not know is a draft: showing it would publish
  // something the table never said was live.
  it('treats an unknown status as Draft', () => {
    expect(fromRemotePost(post({ status: 'Archived' })).status).toBe('Draft');
    expect(fromRemotePost(post({ status: 'Scheduled', published_at: null })).status).toBe('Scheduled');
  });
});

describe('the published filter the reader applies', () => {
  it('keeps only published, undated-deleted, dated rows', () => {
    const rows = [
      fromRemotePost(post({ id: 'live' })),
      fromRemotePost(post({ id: 'draft', status: 'Draft' })),
      fromRemotePost(post({ id: 'scheduled', status: 'Scheduled', published_at: null })),
      fromRemotePost(post({ id: 'deleted', deleted_at: '2026-12-01T00:00:00.000Z' })),
    ];
    expect(publishedOnly(rows).map((row) => row.id)).toEqual(['live']);
  });
});

describe('the read with no Supabase configured', () => {
  // `null` keeps the browser store; an empty array would blank /blogs.
  it('answers null so the caller keeps its own rows', async () => {
    expect(await readRemoteBlogPosts()).toBeNull();
  });
});
