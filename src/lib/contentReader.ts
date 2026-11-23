import type { BlogBlock as ReaderBlock, BlogPost, BlogCategory } from '../data/blogsData';
import type { GuideCategory, TravelGuideStory, GuideStop } from '../data/travelGuideData';
import type { BlogBlock } from './blogBlocks';
import type { AdminGuide, AdminPost } from './contentStore';
import { listingTitle } from '../data/listingIndex';
import { minutesOfDay } from './guideItinerary';

/**
 * Plan §10 §4 Publish and §6 Reader contract: the reader shows what Admin
 * published, in the shape the cards already render. A Draft or a Scheduled post
 * never reaches here, so "invisible to the public until its time" is one filter
 * rather than a condition spread across the page.
 */

/** Plan §10 §4: lowercase, hyphenated English title, fixed after first publish. */
export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return slug || 'story';
}

/** A taken slug gains a number, so two posts with one title still both have a URL. */
export function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

/** Plan §10 §4: English words ÷ 200, rounded up, at least 1. */
export function readMinutesOf(blocks: BlogBlock[]): number {
  const words = blocks
    .filter((block): block is Extract<BlogBlock, { type: 'text' }> => block.type === 'text')
    .flatMap((block) => block.textEn.split(/\s+/))
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * The card's summary is the excerpt Admin wrote. A post saved before the store
 * kept that field falls back to its opening paragraph, cut at a word boundary.
 */
function excerptOf(post: AdminPost): { en: string; mm: string } {
  if (post.excerptEn.trim() || post.excerptMm.trim()) {
    return { en: post.excerptEn, mm: post.excerptMm };
  }
  const first = post.blocks.find((block): block is Extract<BlogBlock, { type: 'text' }> => block.type === 'text');
  const cut = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length <= 160) return trimmed;
    return `${trimmed.slice(0, 160).replace(/\s+\S*$/, '')}…`;
  };
  return { en: cut(first?.textEn ?? ''), mm: cut(first?.textMm ?? '') };
}

/** A caption in either language, with the other language standing in when empty. */
function captionOf(block: Extract<BlogBlock, { type: 'image' }>): { en: string; mm: string } | null {
  const writtenEn = block.captionEn.trim() ? block.captionEn : '';
  const writtenMm = block.captionMm.trim() ? block.captionMm : '';
  if (!writtenEn && !writtenMm) return null;
  return { en: writtenEn || writtenMm, mm: writtenMm || writtenEn };
}

/** Admin blocks become reader blocks: the editor's two languages, in order. */
function toReaderBlocks(blocks: BlogBlock[]): ReaderBlock[] {
  const reader: ReaderBlock[] = [];
  for (const block of blocks) {
    if (block.type === 'text') {
      reader.push({ type: 'paragraph', text: { en: block.textEn, mm: block.textMm } });
    } else if (block.type === 'image') {
      reader.push({
        type: 'image',
        imageUrl: block.imageUrl,
        alt: { en: block.altEn, mm: block.altMm },
        // Plan §10 §2: each language keeps its own caption; a caption written
        // in one language only falls back to the other rather than going blank.
        ...(captionOf(block) ? { caption: captionOf(block)! } : {}),
      });
    } else {
      reader.push({ type: 'ad' });
    }
  }
  return reader;
}

const BLOG_CATEGORIES: BlogCategory[] = ['travel_tips', 'nature', 'food', 'health', 'culture', 'safety', 'others'];

function asBlogCategory(value: string): BlogCategory {
  return (BLOG_CATEGORIES as string[]).includes(value) ? (value as BlogCategory) : 'others';
}

/**
 * Published admin posts as reader posts. `taken` carries the slugs already in
 * use so a new post cannot shadow a seeded one.
 */
export function adminPostToReader(post: AdminPost, taken: Set<string>): BlogPost {
  const slug = uniqueSlug(slugify(post.titleEn), taken);
  taken.add(slug);
  return {
    id: post.id,
    slug,
    category: asBlogCategory(post.category),
    favoriteCount: 0,
    imageUrl: post.imageUrl,
    location: { en: post.locationEn, mm: post.locationMm },
    publishedAt: post.publishedAt,
    readMinutes: readMinutesOf(post.blocks),
    author: { en: post.authorEn, mm: post.authorMm },
    title: { en: post.titleEn, mm: post.titleMm },
    excerpt: excerptOf(post),
    blocks: toReaderBlocks(post.blocks),
    seoTags: post.seoTags ? post.seoTags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    rating: 0,
    distanceKm: 0,
    isFavorited: false,
    views: post.views,
  };
}

/**
 * The published admin posts, newest first. A seeded post the editor has taken
 * over is replaced rather than duplicated, so one story has one card.
 */
export function publishedBlogPosts(posts: AdminPost[], seeds: BlogPost[]): BlogPost[] {
  const seedById = new Map(seeds.map((seed) => [seed.id, seed]));
  const taken = new Set(seeds.map((seed) => seed.slug));
  const published = posts.filter((post) => post.status === 'Published' && !post.deletedAt);
  const overriding = new Set(published.filter((post) => seedById.has(post.id)).map((post) => post.id));
  // Plan §10 §4 Unpublish and Delete: a stored row that is no longer published,
  // or is soft-deleted, takes its seeded story off the reader too. Without this
  // an Admin who unpublished a seed would still see it live on /blogs.
  const withdrawn = new Set(posts
    .filter((post) => seedById.has(post.id) && (post.status !== 'Published' || Boolean(post.deletedAt)))
    .map((post) => post.id));

  // A seed Admin has taken over keeps its slug (fixed after first publish, so a
  // shared link keeps working) and its rating, distance and favourites, which
  // the editor does not collect and a reader would notice going blank.
  const replaced = published
    .filter((post) => seedById.has(post.id))
    .map((post) => {
      const seed = seedById.get(post.id)!;
      return {
        ...adminPostToReader(post, new Set()),
        slug: seed.slug,
        rating: seed.rating,
        distanceKm: seed.distanceKm,
        favoriteCount: seed.favoriteCount,
      };
    });

  const added = published
    .filter((post) => !seedById.has(post.id))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .map((post) => adminPostToReader(post, taken));

  const keptSeeds = seeds.filter((seed) => !overriding.has(seed.id) && !withdrawn.has(seed.id));
  return [...replaced, ...added, ...keptSeeds];
}

/** Duration from the first and last stop, in whole hours, at least one. */
function durationOf(stops: GuideStop[]): { en: string; mm: string } {
  const minutes = stops
    .map((stop) => minutesOfDay(stop.time))
    .filter((value): value is number => value !== null);
  if (minutes.length === 0) return { en: '1 hour', mm: '၁ နာရီ' };
  const hours = Math.max(1, Math.round((Math.max(...minutes) - Math.min(...minutes)) / 60));
  return { en: `${hours} hour${hours === 1 ? '' : 's'}`, mm: `${hours} နာရီ` };
}

export function adminGuideToReader(guide: AdminGuide): TravelGuideStory {
  const stops: GuideStop[] = [...guide.stops]
    .sort((a, b) => (minutesOfDay(a.time) ?? 0) - (minutesOfDay(b.time) ?? 0))
    .map((stop) => ({
      time: stop.time,
      // The reader's place text is derived from the listing, never typed.
      place: stop.listingId ? listingTitle(stop.listingId) : stop.titleEn,
      ...(stop.listingId ? { listingId: stop.listingId } : {}),
      ...(stop.imageUrl ? { imageUrl: stop.imageUrl } : {}),
      title: { en: stop.titleEn, mm: stop.titleMm },
      description: { en: stop.descriptionEn, mm: stop.descriptionMm },
    }));

  return {
    id: guide.id,
    title: guide.titleEn,
    localizedTitle: { en: guide.titleEn, mm: guide.titleMm },
    subtitle: guide.excerptEn,
    summary: { en: guide.excerptEn, mm: guide.excerptMm },
    category: guide.category as GuideCategory,
    imageUrl: guide.coverUrl,
    rating: 0,
    distanceKm: 0,
    isFavorited: false,
    views: guide.views,
    publishedAt: guide.publishedAt,
    author: { en: guide.author, mm: guide.author },
    duration: durationOf(stops),
    href: `/travel-guide/${guide.id}`,
    stops,
  };
}

/** Published guides, with a seeded guide replaced when the editor has taken it over. */
export function publishedGuides(guides: AdminGuide[], seeds: TravelGuideStory[]): TravelGuideStory[] {
  const seedIds = new Set(seeds.map((seed) => seed.id));
  const published = guides.filter((guide) => guide.status === 'Published' && !guide.deletedAt);
  const overriding = new Set(published.filter((guide) => seedIds.has(guide.id)).map((guide) => guide.id));
  const withdrawn = new Set(guides
    .filter((guide) => seedIds.has(guide.id) && (guide.status !== 'Published' || Boolean(guide.deletedAt)))
    .map((guide) => guide.id));

  // A seed guide keeps its rating and distance, which the editor does not
  // collect; a reader would see them drop to zero the moment Admin edits it.
  const seedById = new Map(seeds.map((seed) => [seed.id, seed]));
  const replaced = published
    .filter((guide) => seedIds.has(guide.id))
    .map((guide) => {
      const seed = seedById.get(guide.id)!;
      return { ...adminGuideToReader(guide), rating: seed.rating, distanceKm: seed.distanceKm };
    });
  const added = published
    .filter((guide) => !seedIds.has(guide.id))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .map(adminGuideToReader);

  const keptSeeds = seeds.filter((seed) => !overriding.has(seed.id) && !withdrawn.has(seed.id));
  return [...replaced, ...added, ...keptSeeds];
}
