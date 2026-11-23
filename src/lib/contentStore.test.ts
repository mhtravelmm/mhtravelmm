import { beforeEach, describe, expect, it } from 'vitest';
import {
  readBlogPosts,
  readGuides,
  seedGuides,
  seedPosts,
  writeBlogPosts,
  writeGuides,
  type AdminGuide,
  type AdminPost,
} from './contentStore';

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

beforeEach(() => { fakeWindow(); });

/** A row as it was saved before author, location and captions were bilingual. */
function legacyPost(): Record<string, unknown> {
  const rest: Record<string, unknown> = { ...seedPosts()[0] };
  for (const field of ['authorEn', 'authorMm', 'locationEn', 'locationMm']) delete rest[field];
  return {
    ...rest,
    author: 'MH Travel Editorial',
    location: 'Yangon',
    galleryUrls: ['/images/blog/bagan-sunrise.webp'],
    blocks: [
      { id: 'b1', type: 'text', textEn: 'Story', textMm: 'ဇာတ်လမ်း' },
      { id: 'b2', type: 'image', imageUrl: '/a.webp', altEn: 'Alt', altMm: 'အယ်လ်', caption: 'Old caption', credit: 'MH' },
    ],
    // The fields the assertions below read, kept so the row is still a valid post.
    authorName: 'MH Travel Editorial',
  };
}

describe('reading a stored post', () => {
  it('serves the seeded posts when nothing is stored', () => {
    expect(readBlogPosts().length).toBe(seedPosts().length);
  });

  it('keeps a one-language byline in both languages rather than losing it', () => {
    writeBlogPosts([legacyPost() as unknown as AdminPost]);
    const [post] = readBlogPosts();
    expect(post.authorEn).toBe('MH Travel Editorial');
    expect(post.authorMm).toBe('MH Travel Editorial');
    expect(post.locationEn).toBe('Yangon');
    expect(post.locationMm).toBe('Yangon');
  });

  it('keeps a one-language caption in both languages', () => {
    writeBlogPosts([legacyPost() as unknown as AdminPost]);
    const image = readBlogPosts()[0].blocks.find((block) => block.type === 'image');
    expect(image && image.type === 'image' && image.captionEn).toBe('Old caption');
    expect(image && image.type === 'image' && image.captionMm).toBe('Old caption');
  });

  it('drops the gallery list, because extra photos are image blocks now', () => {
    writeBlogPosts([legacyPost() as unknown as AdminPost]);
    expect(readBlogPosts()[0]).not.toHaveProperty('galleryUrls');
  });

  it('leaves a row that is already bilingual untouched', () => {
    const modern: AdminPost = {
      ...seedPosts()[0],
      authorEn: 'Su Myat',
      authorMm: 'စုမြတ်',
      locationEn: 'Bagan',
      locationMm: 'ပုဂံ',
    };
    writeBlogPosts([modern]);
    const [post] = readBlogPosts();
    expect(post.authorEn).toBe('Su Myat');
    expect(post.authorMm).toBe('စုမြတ်');
    expect(post.locationMm).toBe('ပုဂံ');
  });
});

describe('reading a stored guide', () => {
  /** A guide saved before the author was bilingual. */
  function legacyGuide(): Record<string, unknown> {
    const rest: Record<string, unknown> = { ...seedGuides()[0] };
    delete rest.authorEn;
    delete rest.authorMm;
    return { ...rest, author: 'Min Htet' };
  }

  it('serves the seeded guides when nothing is stored', () => {
    expect(readGuides().length).toBe(seedGuides().length);
  });

  it('keeps a one-language byline in both languages rather than losing it', () => {
    writeGuides([legacyGuide() as unknown as AdminGuide]);
    const [guide] = readGuides();
    expect(guide.authorEn).toBe('Min Htet');
    expect(guide.authorMm).toBe('Min Htet');
  });

  it('leaves a guide that is already bilingual untouched', () => {
    const modern: AdminGuide = { ...seedGuides()[0], authorEn: 'Min Htet', authorMm: 'မင်းထက်' };
    writeGuides([modern]);
    const [guide] = readGuides();
    expect(guide.authorEn).toBe('Min Htet');
    expect(guide.authorMm).toBe('မင်းထက်');
  });
});
