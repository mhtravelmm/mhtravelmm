import { useCallback, useEffect, useState } from 'react';
import { BLOG_POSTS } from '../data/blogsData';
import { LISTING_INDEX } from '../data/listingIndex';
import { TRAVEL_GUIDE_STORIES } from '../data/travelGuideData';
import type { BlogBlock, BlogPostStatus } from './blogBlocks';
import type { AuditEntry, Revision } from './contentWorkflow';
import type { GuideCategory } from '../data/travelGuideData';
import type { GuideDraft } from './guideItinerary';

/**
 * Plan §10: the editors used to hold their content in component state, so a
 * reload threw away a scheduled post before its time arrived and the
 * `publish_due_content` job had nothing to read. This store is the seam where
 * `blog_posts` and `travel_guides` replace browser storage; the panels and the
 * job read the same rows, so a schedule set in one place is visible in the
 * other without a reload.
 */

export type ContentKind = 'blog' | 'guide';

/** A post as the Admin table holds it. `scheduledFor` is UTC; see `scheduleRules`. */
export type AdminPost = {
  id: string;
  titleEn: string;
  titleMm: string;
  /** The card and reader summary; the editor requires both languages. */
  excerptEn: string;
  excerptMm: string;
  category: string;
  /** Plan §10 §2: author and location are bilingual, as the reader shows them. */
  authorEn: string;
  authorMm: string;
  locationEn: string;
  locationMm: string;
  imageUrl: string;
  blocks: BlogBlock[];
  seoTags: string;
  status: BlogPostStatus;
  /** Set when the post goes live, as `YYYY-MM-DD`. */
  publishedAt: string;
  /** The UTC instant a Scheduled post goes live; null for Draft and Published. */
  scheduledFor: string | null;
  /** Soft delete (Plan §10 §4): the row stays for the audit trail, the reader drops it. */
  deletedAt: string | null;
  /** Bumped on every save; a save carrying an older value is refused. */
  version: number;
  views: number;
  updatedAt: string;
};

/** A guide as the Admin table holds it; the draft fields come from the editor. */
export type AdminGuide = GuideDraft & {
  id: string;
  publishedAt: string;
  scheduledFor: string | null;
  deletedAt: string | null;
  version: number;
  views: number;
};

const BLOG_KEY = 'mh-travel-blog-posts';
const GUIDE_KEY = 'mh-travel-guides';
const REVISION_KEY: Record<ContentKind, string> = {
  blog: 'mh-travel-blog-revisions',
  guide: 'mh-travel-guide-revisions',
};
const CONTENT_AUDIT_KEY: Record<ContentKind, string> = {
  blog: 'mh-travel-blog-content-audit',
  guide: 'mh-travel-guide-content-audit',
};
const changedEvent = (key: string) => `${key}-changed`;

function emit(key: string): void {
  window.dispatchEvent(new Event(changedEvent(key)));
}

function readJson<T>(key: string): T[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) || 'null');
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, rows: T[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(rows));
  emit(key);
}

/** The five seeded posts the panel has always shown, now with a schedule field. */
export function seedPosts(): AdminPost[] {
  return BLOG_POSTS.slice(0, 5).map((post) => ({
    id: post.id,
    titleEn: post.title.en,
    titleMm: post.title.mm,
    excerptEn: post.excerpt.en,
    excerptMm: post.excerpt.mm,
    category: post.category,
    authorEn: post.author.en,
    authorMm: post.author.mm,
    locationEn: post.location.en,
    locationMm: post.location.mm,
    imageUrl: post.imageUrl ?? '',
    blocks: [{ id: `${post.id}-text`, type: 'text', textEn: post.excerpt.en, textMm: post.excerpt.mm }],
    seoTags: post.seoTags.join(', '),
    status: 'Published',
    publishedAt: post.publishedAt,
    scheduledFor: null,
    deletedAt: null,
    version: 1,
    views: post.views,
    updatedAt: post.publishedAt,
  }));
}

/**
 * Seeded stops predate the editor, so a stop is linked only when its place
 * name matches a listing that exists in MH Travel.
 */
function matchListing(place: string, title: string): string {
  const needle = (place || title).trim().toLowerCase();
  if (!needle) return '';
  return LISTING_INDEX.find((listing) => listing.title.trim().toLowerCase() === needle)?.id ?? '';
}

/** Every seeded guide is published, so the reader and the editor agree at first load. */
export function seedGuides(): AdminGuide[] {
  return TRAVEL_GUIDE_STORIES.map((guide) => ({
    id: guide.id,
    titleEn: guide.localizedTitle.en,
    titleMm: guide.localizedTitle.mm,
    excerptEn: guide.summary.en,
    excerptMm: guide.summary.mm,
    category: guide.category as GuideCategory,
    coverUrl: guide.imageUrl ?? '',
    author: guide.author.en,
    stops: guide.stops.map((stop) => ({
      id: `${guide.id}-${stop.time}`,
      time: stop.time,
      listingId: stop.listingId ?? matchListing(stop.place, stop.title.en),
      titleEn: stop.title.en,
      titleMm: stop.title.mm,
      descriptionEn: stop.description.en,
      descriptionMm: stop.description.mm,
      imageUrl: stop.imageUrl ?? '',
    })),
    status: 'Published',
    scheduledDate: '',
    scheduledTime: '',
    publishedAt: guide.publishedAt,
    scheduledFor: null,
    deletedAt: null,
    version: 1,
    views: guide.views,
  }));
}

function isPost(value: unknown): value is AdminPost {
  if (!value || typeof value !== 'object') return false;
  const post = value as Partial<AdminPost>;
  return typeof post.id === 'string' && typeof post.titleEn === 'string' && Array.isArray(post.blocks);
}

/**
 * Plan §10 §2: author and location used to be one string. A row saved before
 * they were bilingual keeps its value in both languages rather than losing it,
 * which is what a reader of the other language saw anyway.
 */
function legacyAuthorLocation(post: AdminPost & { author?: string; location?: string }) {
  return {
    authorEn: post.authorEn ?? post.author ?? '',
    authorMm: post.authorMm ?? post.author ?? '',
    locationEn: post.locationEn ?? post.location ?? '',
    locationMm: post.locationMm ?? post.location ?? '',
  };
}

/** An image block saved before captions were bilingual keeps its caption in both. */
function normalizeBlock(block: BlogBlock): BlogBlock {
  if (block.type !== 'image') return block;
  const legacy = block as BlogBlock & { caption?: string };
  return {
    ...block,
    captionEn: block.captionEn ?? legacy.caption ?? '',
    captionMm: block.captionMm ?? legacy.caption ?? '',
  };
}

/**
 * A row saved before `scheduledFor` existed kept its schedule in `publishedAt`.
 * Moving it across here is what lets an older browser record still publish.
 */
function normalizePost(post: AdminPost): AdminPost {
  const scheduledFor = post.scheduledFor
    ?? (post.status === 'Scheduled' && post.publishedAt ? new Date(post.publishedAt).toISOString() : null);
  // Plan §10 §2 removes `galleryUrls`; the spread would carry a stored one
  // forward, so it is dropped here rather than left for a reader to trip on.
  const rest: Record<string, unknown> = { ...post };
  delete rest.galleryUrls;
  return {
    ...(rest as unknown as AdminPost),
    excerptEn: post.excerptEn ?? '',
    excerptMm: post.excerptMm ?? '',
    ...legacyAuthorLocation(post),
    blocks: post.blocks.map(normalizeBlock),
    seoTags: post.seoTags ?? '',
    scheduledFor: Number.isNaN(new Date(scheduledFor ?? '').getTime()) ? null : scheduledFor,
    deletedAt: post.deletedAt ?? null,
    version: post.version ?? 1,
    views: post.views ?? 0,
    updatedAt: post.updatedAt ?? post.publishedAt,
  };
}

function isGuide(value: unknown): value is AdminGuide {
  if (!value || typeof value !== 'object') return false;
  const guide = value as Partial<AdminGuide>;
  return typeof guide.id === 'string' && typeof guide.titleEn === 'string' && Array.isArray(guide.stops);
}

function normalizeGuide(guide: AdminGuide): AdminGuide {
  const scheduledFor = guide.scheduledFor
    ?? (guide.status === 'Scheduled' && guide.scheduledDate && guide.scheduledTime
      ? new Date(`${guide.scheduledDate}T${guide.scheduledTime}`).toISOString()
      : null);
  return {
    ...guide,
    scheduledDate: guide.scheduledDate ?? '',
    scheduledTime: guide.scheduledTime ?? '',
    scheduledFor: Number.isNaN(new Date(scheduledFor ?? '').getTime()) ? null : scheduledFor,
    deletedAt: guide.deletedAt ?? null,
    version: guide.version ?? 1,
    views: guide.views ?? 0,
  };
}

export function readBlogPosts(): AdminPost[] {
  const stored = readJson<AdminPost>(BLOG_KEY);
  if (!stored) return seedPosts();
  return stored.filter(isPost).map(normalizePost);
}

export function writeBlogPosts(posts: AdminPost[]): void {
  writeJson(BLOG_KEY, posts);
}

export function readGuides(): AdminGuide[] {
  const stored = readJson<AdminGuide>(GUIDE_KEY);
  if (!stored) return seedGuides();
  return stored.filter(isGuide).map(normalizeGuide);
}

export function writeGuides(guides: AdminGuide[]): void {
  writeJson(GUIDE_KEY, guides);
}

export function readRevisions<T>(kind: ContentKind): Revision<T>[] {
  return (readJson<Revision<T>>(REVISION_KEY[kind]) ?? []).filter(
    (row) => Boolean(row) && typeof row.contentId === 'string',
  );
}

export function writeRevisions<T>(kind: ContentKind, revisions: Revision<T>[]): void {
  writeJson(REVISION_KEY[kind], revisions);
}

export function readContentAudit(kind: ContentKind): AuditEntry[] {
  return (readJson<AuditEntry>(CONTENT_AUDIT_KEY[kind]) ?? []).filter(
    (row) => Boolean(row) && typeof row.contentId === 'string',
  );
}

export function writeContentAudit(kind: ContentKind, entries: AuditEntry[]): void {
  writeJson(CONTENT_AUDIT_KEY[kind], entries);
}

function useStored<T>(key: string, read: () => T, write: (value: T) => void) {
  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    const sync = () => setValue(read());
    window.addEventListener(changedEvent(key), sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(changedEvent(key), sync);
      window.removeEventListener('storage', sync);
    };
  }, [key, read]);

  // The panels update from the previous value (`current => next`), so `save`
  // accepts the same updater form React's setter does.
  const save = useCallback((next: T | ((current: T) => T)) => {
    setValue((current) => {
      const resolved = typeof next === 'function' ? (next as (current: T) => T)(current) : next;
      write(resolved);
      return resolved;
    });
  }, [write]);

  return [value, save] as const;
}

export function useBlogPosts() {
  return useStored(BLOG_KEY, readBlogPosts, writeBlogPosts);
}

export function useGuides() {
  return useStored(GUIDE_KEY, readGuides, writeGuides);
}

export function useRevisions<T>(kind: ContentKind) {
  const read = useCallback(() => readRevisions<T>(kind), [kind]);
  const write = useCallback((rows: Revision<T>[]) => writeRevisions(kind, rows), [kind]);
  return useStored(REVISION_KEY[kind], read, write);
}

export function useContentAudit(kind: ContentKind) {
  const read = useCallback(() => readContentAudit(kind), [kind]);
  const write = useCallback((rows: AuditEntry[]) => writeContentAudit(kind, rows), [kind]);
  return useStored(CONTENT_AUDIT_KEY[kind], read, write);
}
