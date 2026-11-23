import { beforeEach, describe, expect, it } from 'vitest';
import { readAdminAudit } from './adminAudit';
import { readFeed } from './notificationFeed';
import { readBlogPosts, readGuides, seedGuides, seedPosts, writeBlogPosts, writeGuides } from './contentStore';
import { publishDueContent } from './scheduledPublishing';

/** A localStorage with the event hooks the stores and the feed use. */
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

const at = (iso: string) => new Date(iso);

describe('publish_due_content (Plan §16B.7, §10 §4)', () => {
  it('publishes a scheduled post when its instant arrives and clears the schedule', () => {
    const posts = seedPosts();
    posts.unshift({
      ...seedPosts()[0],
      id: 'scheduled-1',
      titleEn: 'Scheduled story',
      status: 'Scheduled',
      publishedAt: '',
      scheduledFor: '2026-11-25T02:30:00.000Z',
    });
    writeBlogPosts(posts);

    const run = publishDueContent(at('2026-11-25T02:30:00.000Z'));

    expect(run).toEqual({ blog: 1, guide: 0 });
    const published = readBlogPosts().find((post) => post.id === 'scheduled-1');
    expect(published?.status).toBe('Published');
    expect(published?.scheduledFor).toBeNull();
    expect(published?.publishedAt).toBe('2026-11-25');
  });

  it('leaves a post alone until its time, so nothing goes live early', () => {
    const posts = seedPosts();
    posts.unshift({
      ...seedPosts()[0],
      id: 'scheduled-2',
      status: 'Scheduled',
      publishedAt: '',
      scheduledFor: '2026-11-25T02:30:00.000Z',
    });
    writeBlogPosts(posts);

    expect(publishDueContent(at('2026-11-25T02:29:59.000Z'))).toEqual({ blog: 0, guide: 0 });
    expect(readBlogPosts().find((post) => post.id === 'scheduled-2')?.status).toBe('Scheduled');
  });

  it('does not publish the same post twice when the job runs again', () => {
    const posts = seedPosts();
    posts.unshift({
      ...seedPosts()[0],
      id: 'scheduled-3',
      status: 'Scheduled',
      publishedAt: '',
      scheduledFor: '2026-11-25T02:30:00.000Z',
    });
    writeBlogPosts(posts);

    const now = at('2026-11-25T03:00:00.000Z');
    expect(publishDueContent(now).blog).toBe(1);
    expect(publishDueContent(now).blog).toBe(0);
  });

  it('records the publish with the actor system and one feed row', () => {
    const posts = seedPosts();
    posts.unshift({
      ...seedPosts()[0],
      id: 'scheduled-4',
      titleEn: 'System published story',
      status: 'Scheduled',
      publishedAt: '',
      scheduledFor: '2026-11-25T02:30:00.000Z',
    });
    writeBlogPosts(posts);

    publishDueContent(at('2026-11-25T02:30:00.000Z'));

    const audit = readAdminAudit().filter((row) => row.objectId === 'scheduled-4');
    expect(audit).toHaveLength(1);
    expect(audit[0].actor).toBe('system');
    expect(audit[0].action).toBe('published');

    const feed = readFeed().filter((row) => row.event === 'blog_published');
    expect(feed).toHaveLength(1);
    // §16B.4: the row is written in both languages, because the reader picks.
    expect(feed[0].message.en).toContain('System published story');
    expect(feed[0].message.mm).toContain('System published story');
    expect(feed[0].href).toBe('/blogs/scheduled-4');
  });

  it('publishes a scheduled guide, creates its earning row once and notifies', () => {
    const guides = seedGuides();
    guides.unshift({
      ...seedGuides()[0],
      id: 'guide-scheduled',
      titleEn: 'Scheduled route',
      authorEn: 'Min Htet',
      authorMm: 'မင်းထက်',
      status: 'Scheduled',
      publishedAt: '',
      scheduledFor: '2026-11-25T02:30:00.000Z',
    });
    writeGuides(guides);

    const now = at('2026-11-25T02:30:00.000Z');
    expect(publishDueContent(now)).toEqual({ blog: 0, guide: 1 });
    expect(publishDueContent(now)).toEqual({ blog: 0, guide: 0 });

    const published = readGuides().find((guide) => guide.id === 'guide-scheduled');
    expect(published?.status).toBe('Published');
    // Plan §10 §2: the first publish fixes the slug, and the feed links through it.
    expect(published?.slug).toBe('scheduled-route');
    const feed = readFeed().filter((row) => row.event === 'guide_published');
    expect(feed).toHaveLength(1);
    expect(feed[0].href).toBe('/travel-guide/scheduled-route');
  });

  it('does not resurrect a deleted post whose schedule came due', () => {
    const posts = seedPosts();
    posts.unshift({
      ...seedPosts()[0],
      id: 'deleted-1',
      status: 'Scheduled',
      publishedAt: '',
      scheduledFor: '2026-11-25T02:30:00.000Z',
      deletedAt: '2026-11-24T10:00:00.000Z',
    });
    writeBlogPosts(posts);

    expect(publishDueContent(at('2026-11-26T00:00:00.000Z')).blog).toBe(0);
    const row = readBlogPosts().find((post) => post.id === 'deleted-1');
    // Skipped, not dropped: the row keeps its delete marker for the audit trail.
    expect(row?.deletedAt).toBe('2026-11-24T10:00:00.000Z');
    expect(row?.status).toBe('Scheduled');
  });

  it('bumps the version when the job publishes, so an open editor is told it is stale', () => {
    const base = seedPosts()[0];
    writeBlogPosts([
      { ...base, id: 'scheduled-version', status: 'Scheduled', publishedAt: '', version: 3, scheduledFor: '2026-11-25T02:30:00.000Z' },
    ]);

    publishDueContent(at('2026-11-25T02:30:00.000Z'));
    expect(readBlogPosts().find((post) => post.id === 'scheduled-version')?.version).toBe(4);
  });

  it('never publishes a draft, even one carrying a schedule', () => {
    const posts = seedPosts();
    posts.unshift({
      ...seedPosts()[0],
      id: 'draft-1',
      status: 'Draft',
      scheduledFor: '2026-11-01T02:30:00.000Z',
    });
    writeBlogPosts(posts);

    expect(publishDueContent(at('2026-12-01T00:00:00.000Z')).blog).toBe(0);
    expect(readBlogPosts().find((post) => post.id === 'draft-1')?.status).toBe('Draft');
  });
});
