import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabase';
import { normalizeTags } from './tagList';
import type { BlogBlock, BlogPostStatus } from './blogBlocks';
import type { AdminPost } from './contentStore';

/**
 * Plan §10 and ticket O-21. `blog_posts` and `blog_blocks` are the tables the
 * editor and the `publish_due_content` job share (§16B.7). The browser store in
 * `contentStore.ts` is the twin; this module reads the tables into the same
 * `AdminPost` shape so `/blogs` shows the server's published posts whether or
 * not this browser ever opened the editor.
 *
 * What the mapping has to get right:
 *
 *  - the reader shows only `Published` rows that are not soft-deleted. The
 *    policy is the second gate, not the only one, so a scheduled post cannot
 *    appear early because a policy was written too loosely;
 *  - a block's position is its order in the body, and an unknown kind is
 *    dropped rather than rendered as an empty paragraph;
 *  - `seo_tags` is one text column holding a list, so it goes through the same
 *    `normalizeTags()` the editor uses or the tags would differ by source.
 */

export interface RemoteBlockRow {
  post_id: string;
  position: number;
  kind: string;
  text_en: string | null;
  text_mm: string | null;
  image_url: string | null;
  alt_en: string | null;
  alt_mm: string | null;
  caption_en: string | null;
  caption_mm: string | null;
  credit: string | null;
}

export interface RemotePostRow {
  id: string;
  slug: string;
  status: string;
  category: string;
  title_en: string;
  title_mm: string;
  excerpt_en: string | null;
  excerpt_mm: string | null;
  author_name: string;
  author_name_mm: string | null;
  location: string | null;
  location_mm: string | null;
  cover_url: string | null;
  seo_tags: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  views: number | null;
  version: number | null;
  updated_at: string | null;
  deleted_at: string | null;
  blog_blocks?: RemoteBlockRow[] | null;
}

/** One block row → the editor's block, or `null` for a kind this build does not know. */
export function fromRemoteBlock(row: RemoteBlockRow): BlogBlock | null {
  const id = `${row.post_id}-b${row.position}`;
  if (row.kind === 'text') {
    return { id, type: 'text', textEn: row.text_en ?? '', textMm: row.text_mm ?? '' };
  }
  if (row.kind === 'image') {
    return {
      id,
      type: 'image',
      imageUrl: row.image_url ?? '',
      altEn: row.alt_en ?? '',
      altMm: row.alt_mm ?? '',
      captionEn: row.caption_en ?? '',
      captionMm: row.caption_mm ?? '',
      credit: row.credit ?? '',
    };
  }
  if (row.kind === 'ad') return { id, type: 'ad' };
  return null;
}

function asStatus(value: string): BlogPostStatus {
  return value === 'Published' || value === 'Scheduled' ? value : 'Draft';
}

/** One `blog_posts` row, with its blocks, → the store's `AdminPost`. */
export function fromRemotePost(row: RemotePostRow): AdminPost {
  const blocks = (row.blog_blocks ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(fromRemoteBlock)
    .filter((block): block is BlogBlock => block !== null);

  return {
    id: row.id,
    titleEn: row.title_en,
    titleMm: row.title_mm,
    excerptEn: row.excerpt_en ?? '',
    excerptMm: row.excerpt_mm ?? '',
    category: row.category,
    authorEn: row.author_name,
    authorMm: row.author_name_mm || row.author_name,
    locationEn: row.location || 'Myanmar',
    locationMm: row.location_mm || row.location || 'Myanmar',
    imageUrl: row.cover_url ?? '',
    blocks,
    seoTags: normalizeTags(row.seo_tags ?? ''),
    status: asStatus(row.status),
    // A Published row must carry its date (the table's own check), so an empty
    // value here is a Draft that will not reach the reader anyway.
    publishedAt: row.published_at ?? '',
    scheduledFor: row.scheduled_for,
    deletedAt: row.deleted_at,
    version: row.version ?? 1,
    views: row.views ?? 0,
    updatedAt: row.updated_at ?? new Date(0).toISOString(),
  };
}

const POST_COLUMNS = [
  'id', 'slug', 'status', 'category', 'title_en', 'title_mm', 'excerpt_en', 'excerpt_mm',
  'author_name', 'author_name_mm', 'location', 'location_mm', 'cover_url', 'seo_tags',
  'scheduled_for', 'published_at', 'views', 'version', 'updated_at', 'deleted_at',
].join(', ');

const BLOCK_COLUMNS = [
  'post_id', 'position', 'kind', 'text_en', 'text_mm', 'image_url',
  'alt_en', 'alt_mm', 'caption_en', 'caption_mm', 'credit',
].join(', ');

/**
 * The posts the server holds, published first and newest first. `null` means the
 * table could not answer — no Supabase, no session, or M-23 unapplied — and the
 * caller keeps the browser rows. An empty array is a real answer: the project
 * has published nothing, which is not the same as an unreachable table.
 */
export async function readRemoteBlogPosts(): Promise<AdminPost[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    // `Published` and not `Scheduled`: the table's own read policy says the same,
    // and asking for both would show an editor a future post in the reader.
    const { data, error } = await supabase
      .from('blog_posts')
      .select(POST_COLUMNS)
      .is('deleted_at', null)
      .eq('status', 'Published')
      .order('published_at', { ascending: false });
    if (error || !data) return null;
    const rows = data as unknown as RemotePostRow[];
    if (rows.length === 0) return [];

    // One query for every block, then grouped in memory: a post is small, and a
    // query per post would make the reader's first paint wait on N round trips.
    const ids = rows.map((row) => row.id);
    const { data: blockData, error: blockError } = await supabase
      .from('blog_blocks')
      .select(BLOCK_COLUMNS)
      .in('post_id', ids)
      .order('position');
    if (blockError) return null;

    const byPost = new Map<string, RemoteBlockRow[]>();
    for (const block of (blockData ?? []) as unknown as RemoteBlockRow[]) {
      const list = byPost.get(block.post_id) ?? [];
      list.push(block);
      byPost.set(block.post_id, list);
    }

    return rows.map((row) => fromRemotePost({ ...row, blog_blocks: byPost.get(row.id) ?? [] }));
  } catch {
    return null;
  }
}

/** Only the rows the reader may show. Kept beside the read so both use one rule. */
export function publishedOnly(posts: AdminPost[]): AdminPost[] {
  return posts.filter((post) => post.status === 'Published' && !post.deletedAt && post.publishedAt);
}

/**
 * The reader's posts from the table, or `null` while it cannot answer. A hook
 * rather than a call so `/blogs` re-renders once, and only when there is
 * something to show. `kind` is here because a guide reader needs the same seam;
 * this build reads blog rows only, so a guide asks for its own read.
 */
export function useRemoteContent(kind: 'blog' | 'guide'): AdminPost[] | null {
  const [rows, setRows] = useState<AdminPost[] | null>(null);
  useEffect(() => {
    if (kind !== 'blog') return;
    let active = true;
    void readRemoteBlogPosts().then((next) => {
      if (active) setRows(next);
    });
    return () => { active = false; };
  }, [kind]);
  return rows;
}
