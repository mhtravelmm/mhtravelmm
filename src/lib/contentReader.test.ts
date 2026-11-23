import { describe, expect, it } from 'vitest';
import { BLOG_POSTS } from '../data/blogsData';
import { TRAVEL_GUIDE_STORIES } from '../data/travelGuideData';
import { seedGuides, seedPosts, type AdminGuide, type AdminPost } from './contentStore';
import {
  adminGuideToReader,
  adminPostToReader,
  publishedBlogPosts,
  publishedGuides,
  readMinutesOf,
  slugify,
  uniqueSlug,
} from './contentReader';

const post = (overrides: Partial<AdminPost> = {}): AdminPost => ({
  ...seedPosts()[0],
  id: 'admin-post',
  titleEn: 'A Slow Morning in Bagan',
  excerptEn: 'A short summary.',
  excerptMm: 'အနှစ်ချုပ်',
  titleMm: 'ပုဂံ မနက်ခင်း',
  status: 'Published',
  publishedAt: '2026-11-20',
  scheduledFor: null,
  ...overrides,
});

const guide = (overrides: Partial<AdminGuide> = {}): AdminGuide => ({
  ...seedGuides()[0],
  id: 'admin-guide',
  titleEn: 'Two Days in Hpa-An',
  status: 'Published',
  publishedAt: '2026-11-20',
  scheduledFor: null,
  ...overrides,
});

describe('a post slug (Plan §10 §4)', () => {
  it('is the lowercase hyphenated English title', () => {
    expect(slugify('A Slow Morning in Bagan')).toBe('a-slow-morning-in-bagan');
  });

  it('drops punctuation and collapses runs of hyphens', () => {
    expect(slugify('Bagan — Sunrise & Sunset!!')).toBe('bagan-sunrise-sunset');
  });

  it('falls back to a usable slug rather than an empty URL', () => {
    expect(slugify('မြန်မာ')).toBe('story');
  });

  it('gives a second post with the same title its own slug', () => {
    const taken = new Set(['bagan']);
    expect(uniqueSlug('bagan', taken)).toBe('bagan-2');
    taken.add('bagan-2');
    expect(uniqueSlug('bagan', taken)).toBe('bagan-3');
  });
});

describe('read time', () => {
  it('counts English words across text blocks at 200 a minute', () => {
    const words = (count: number) => Array.from({ length: count }, () => 'word').join(' ');
    const minutes = readMinutesOf([
      { id: 'a', type: 'text', textEn: words(250), textMm: '' },
      { id: 'b', type: 'ad' },
      { id: 'c', type: 'text', textEn: words(150), textMm: '' },
    ]);
    expect(minutes).toBe(2);
  });

  it('is never zero, so a photo-only post still shows a read time', () => {
    expect(readMinutesOf([{ id: 'a', type: 'ad' }])).toBe(1);
  });
});

describe('what the reader is allowed to see', () => {
  it('shows a published admin post', () => {
    const reader = publishedBlogPosts([post()], BLOG_POSTS);
    expect(reader.some((story) => story.id === 'admin-post')).toBe(true);
  });

  it('hides a draft and a scheduled post until the job publishes it', () => {
    const reader = publishedBlogPosts(
      [post({ id: 'draft', status: 'Draft' }), post({ id: 'waiting', status: 'Scheduled' })],
      BLOG_POSTS,
    );
    expect(reader.some((story) => story.id === 'draft')).toBe(false);
    expect(reader.some((story) => story.id === 'waiting')).toBe(false);
  });

  it('replaces the seeded post the editor took over instead of showing it twice', () => {
    const seed = BLOG_POSTS[0];
    const reader = publishedBlogPosts([post({ id: seed.id, titleEn: 'Rewritten title' })], BLOG_POSTS);
    expect(reader.filter((story) => story.id === seed.id)).toHaveLength(1);
    expect(reader.find((story) => story.id === seed.id)?.title.en).toBe('Rewritten title');
  });

  it('keeps a seed card rating, distance and favourites when Admin edits it', () => {
    const seed = BLOG_POSTS[0];
    const reader = publishedBlogPosts([post({ id: seed.id, titleEn: 'Rewritten title' })], BLOG_POSTS);
    const story = reader.find((item) => item.id === seed.id)!;
    expect(story.rating).toBe(seed.rating);
    expect(story.distanceKm).toBe(seed.distanceKm);
    expect(story.favoriteCount).toBe(seed.favoriteCount);
  });

  it('keeps every seeded story that Admin has not touched', () => {
    expect(publishedBlogPosts([], BLOG_POSTS)).toHaveLength(BLOG_POSTS.length);
  });

  it('does not let an admin slug shadow a seeded one', () => {
    const seed = BLOG_POSTS[0];
    const reader = publishedBlogPosts([post({ titleEn: seed.slug.replace(/-/g, ' ') })], BLOG_POSTS);
    const admin = reader.find((story) => story.id === 'admin-post');
    expect(admin?.slug).not.toBe(seed.slug);
  });
});

describe('a withdrawn story (Plan §10 §4 Unpublish and Delete)', () => {
  it('drops a soft-deleted admin post from the reader', () => {
    const posts = [post({ deletedAt: '2026-11-24T10:00:00.000Z' })];
    expect(publishedBlogPosts(posts, BLOG_POSTS).some((item) => item.id === 'admin-post')).toBe(false);
  });

  it('takes a seeded story off the reader once Admin unpublishes it', () => {
    const seed = BLOG_POSTS[0];
    const posts = [post({ id: seed.id, status: 'Draft' })];
    expect(publishedBlogPosts(posts, BLOG_POSTS).some((item) => item.id === seed.id)).toBe(false);
  });

  it('takes a seeded story off the reader once Admin deletes it', () => {
    const seed = BLOG_POSTS[0];
    const posts = [post({ id: seed.id, deletedAt: '2026-11-24T10:00:00.000Z' })];
    expect(publishedBlogPosts(posts, BLOG_POSTS).some((item) => item.id === seed.id)).toBe(false);
  });

  it('drops a soft-deleted guide from the reader', () => {
    const guides = [guide({ deletedAt: '2026-11-24T10:00:00.000Z' })];
    expect(publishedGuides(guides, TRAVEL_GUIDE_STORIES).some((item) => item.id === 'admin-guide')).toBe(false);
  });

  it('takes a seeded guide off the reader once Admin deletes it', () => {
    const seed = TRAVEL_GUIDE_STORIES[0];
    const guides = [guide({ id: seed.id, deletedAt: '2026-11-24T10:00:00.000Z' })];
    expect(publishedGuides(guides, TRAVEL_GUIDE_STORIES).some((item) => item.id === seed.id)).toBe(false);
  });
});

describe('an admin post as a reader story', () => {
  it('turns editor blocks into the reader blocks, in order', () => {
    const story = adminPostToReader(post({
      blocks: [
        { id: '1', type: 'text', textEn: 'First line.', textMm: 'ပထမ' },
        { id: '2', type: 'image', imageUrl: '/a.webp', altEn: 'Alt', altMm: 'အယ်လ်', caption: 'A caption', credit: 'A credit' },
        { id: '3', type: 'ad' },
      ],
    }), new Set());

    expect(story.blocks.map((block) => block.type)).toEqual(['paragraph', 'image', 'ad']);
    expect(story.blocks[0]).toEqual({ type: 'paragraph', text: { en: 'First line.', mm: 'ပထမ' } });
  });

  it('omits an empty caption rather than rendering a blank line', () => {
    const story = adminPostToReader(post({
      blocks: [{ id: '2', type: 'image', imageUrl: '/a.webp', altEn: 'Alt', altMm: '', caption: '  ', credit: '' }],
    }), new Set());
    const image = story.blocks[0];
    expect(image.type === 'image' && image.caption).toBeFalsy();
  });

  it('keeps an unknown category readable instead of dropping the post', () => {
    expect(adminPostToReader(post({ category: 'not-a-category' }), new Set()).category).toBe('others');
  });

  it('uses the excerpt Admin wrote as the card summary', () => {
    const story = adminPostToReader(post({
      excerptEn: 'A short summary.',
      excerptMm: 'အနှစ်ချုပ်',
      blocks: [{ id: '1', type: 'text', textEn: 'The opening line of the story.', textMm: 'အဖွင့်စာကြောင်း' }],
    }), new Set());
    expect(story.excerpt.en).toBe('A short summary.');
  });

  it('falls back to the opening paragraph when an older post has no excerpt', () => {
    const story = adminPostToReader(post({
      excerptEn: '',
      excerptMm: '',
      blocks: [{ id: '1', type: 'text', textEn: 'The opening line of the story.', textMm: 'အဖွင့်စာကြောင်း' }],
    }), new Set());
    expect(story.excerpt.en).toBe('The opening line of the story.');
  });
});

describe('an admin guide as a reader story', () => {
  it('shows published guides and hides the rest', () => {
    const reader = publishedGuides(
      [guide({ id: 'live' }), guide({ id: 'draft', status: 'Draft' }), guide({ id: 'later', status: 'Scheduled' })],
      TRAVEL_GUIDE_STORIES,
    );
    expect(reader.some((story) => story.id === 'live')).toBe(true);
    expect(reader.some((story) => story.id === 'draft')).toBe(false);
    expect(reader.some((story) => story.id === 'later')).toBe(false);
  });

  it('derives the stop place from the listing, never from typed text', () => {
    const story = adminGuideToReader(guide({
      stops: [{
        id: 's1', time: '09:00', listingId: 'ta1',
        titleEn: 'Morning visit', titleMm: 'မနက်ခင်းလည်ပတ်',
        descriptionEn: 'Quiet hour.', descriptionMm: 'တိတ်ဆိတ်ချိန်',
        imageUrl: '',
      }],
    }));
    expect(story.stops[0].place).toBe('Shwedagon pagoda');
  });

  it('sorts the stops by time and reports the duration between first and last', () => {
    const stop = (time: string) => ({
      id: time, time, listingId: '', titleEn: time, titleMm: time,
      descriptionEn: '', descriptionMm: '', imageUrl: '',
    });
    const story = adminGuideToReader(guide({ stops: [stop('16:00'), stop('08:00'), stop('12:00')] }));
    expect(story.stops.map((item) => item.time)).toEqual(['08:00', '12:00', '16:00']);
    expect(story.duration.en).toBe('8 hours');
  });

  it('shows at least one hour for a single-stop guide', () => {
    const story = adminGuideToReader(guide({
      stops: [{
        id: 's1', time: '09:00', listingId: '', titleEn: 'Only stop', titleMm: 'တစ်ခုတည်း',
        descriptionEn: '', descriptionMm: '', imageUrl: '',
      }],
    }));
    expect(story.duration.en).toBe('1 hour');
  });

  it('keeps the seed rating and distance when Admin edits a seeded guide', () => {
    const seed = TRAVEL_GUIDE_STORIES[0];
    const reader = publishedGuides([guide({ id: seed.id, titleEn: 'Rewritten guide' })], TRAVEL_GUIDE_STORIES);
    const story = reader.find((item) => item.id === seed.id)!;
    expect(story.rating).toBe(seed.rating);
    expect(story.distanceKm).toBe(seed.distanceKm);
  });

  it('replaces a seeded guide the editor took over', () => {
    const seed = TRAVEL_GUIDE_STORIES[0];
    const reader = publishedGuides([guide({ id: seed.id, titleEn: 'Rewritten guide' })], TRAVEL_GUIDE_STORIES);
    expect(reader.filter((story) => story.id === seed.id)).toHaveLength(1);
    expect(reader.find((story) => story.id === seed.id)?.title).toBe('Rewritten guide');
  });
});
