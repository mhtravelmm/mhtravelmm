/**
 * Plan §16B.6: `media_objects` is one row per stored object, carrying when a
 * row last referenced it. The nightly job removes what nothing has referenced
 * for 30 days (`orphanCandidates` in `mediaRules.ts`). This module is the
 * browser stand-in for that table, so the job does real work before
 * `supabase/migrations/20261123000500_media_objects.sql` is applied; the same
 * three calls become `register_media_object()`, `touch_media_object()` and
 * `orphan_media_objects(days)`.
 */
import { isOrphan, orphanCandidates, type MediaFolder } from './mediaRules';

export interface MediaObject {
  /** R2 key, e.g. `blog-posts/bagan.webp`. */
  key: string;
  /** What the content row stores, so a save can find its object again. */
  url: string;
  folder: MediaFolder;
  bytes: number;
  contentType: string;
  createdAt: string;
  lastReferencedAt: string;
}

const STORAGE_KEY = 'mh-travel-media-objects';
const CHANGED_EVENT = 'mh-travel-media-objects-changed';

function read(): MediaObject[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? (parsed as MediaObject[]).filter((row) => typeof row?.key === 'string') : [];
  } catch {
    return [];
  }
}

function write(rows: MediaObject[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function listMediaObjects(): MediaObject[] {
  return read();
}

/**
 * Called once per upload. Only an object that reached R2 is registered: a
 * preview data URL is not in the bucket, so a row for it would describe nothing.
 */
export function registerMediaObject(object: Omit<MediaObject, 'createdAt' | 'lastReferencedAt'>): void {
  const rows = read().filter((row) => row.key !== object.key);
  const now = new Date().toISOString();
  write([...rows, { ...object, createdAt: now, lastReferencedAt: now }]);
}

/**
 * Called by a content save with every key that save still uses. A key that is
 * not registered is ignored: the object may predate this store, and inventing
 * a row for it would make it immortal.
 */
export function touchMediaObjects(keys: readonly string[]): void {
  const wanted = new Set(keys.filter(Boolean));
  if (wanted.size === 0) return;
  const now = new Date().toISOString();
  let changed = false;
  const rows = read().map((row) => {
    if (!wanted.has(row.key) || row.lastReferencedAt === now) return row;
    changed = true;
    return { ...row, lastReferencedAt: now };
  });
  if (changed) write(rows);
}

/** The key behind a stored URL, for a content save that only kept the URL. */
export function keyForUrl(url: string): string | null {
  if (!url) return null;
  return read().find((row) => row.url === url)?.key ?? null;
}

/** A save passes the URLs it still uses; unregistered ones are ignored. */
export function touchMediaUrls(urls: readonly string[]): void {
  touchMediaObjects(urls.map(keyForUrl).filter((key): key is string => key !== null));
}

export function orphansAt(now: Date, days?: number): MediaObject[] {
  return orphanCandidates(read(), now, days) as MediaObject[];
}

/**
 * The nightly job's work. It reports the keys it removed, so the panel shows a
 * number rather than a silent success; a second run finds nothing because the
 * rows are gone.
 */
export function cleanupOrphanMedia(now: Date = new Date()): string[] {
  const rows = read();
  const orphans = orphanCandidates(rows, now) as MediaObject[];
  if (orphans.length === 0) return [];
  const removed = new Set(orphans.map((object) => object.key));
  write(rows.filter((row) => !removed.has(row.key)));
  return [...removed];
}

/** For a test or a settings view: is this object still inside the 30-day window? */
export function isReferenced(key: string, now: Date = new Date()): boolean {
  const row = read().find((object) => object.key === key);
  return row ? !isOrphan(row, now) : false;
}
