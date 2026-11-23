import { describe, expect, it } from 'vitest';
import {
  isStaleSave,
  nextVersion,
  restorePost,
  softDeletePost,
  unpublishPost,
} from './contentLifecycle';
import { seedPosts, type AdminPost } from './contentStore';

const post = (): AdminPost => seedPosts()[0];

describe('content lifecycle (Plan §10 §4, §7 acceptance 5)', () => {
  it('unpublish returns a post to Draft and clears the publish date', () => {
    const before = { ...post(), status: 'Published' as const, publishedAt: '2026-11-01', scheduledFor: '2026-11-01T02:30:00.000Z' };
    const after = unpublishPost(before);
    expect(after.status).toBe('Draft');
    expect(after.publishedAt).toBe('');
    expect(after.scheduledFor).toBeNull();
  });

  it('unpublish keeps the content, so the post is not lost', () => {
    const before = { ...post(), status: 'Published' as const };
    expect(unpublishPost(before).blocks).toEqual(before.blocks);
    expect(unpublishPost(before).titleEn).toBe(before.titleEn);
  });

  it('delete is a soft delete that keeps the row for the audit trail', () => {
    const after = softDeletePost(post(), '2026-11-24T10:00:00.000Z');
    expect(after.deletedAt).toBe('2026-11-24T10:00:00.000Z');
    expect(after.titleEn).toBe(post().titleEn);
  });

  it('restoring a deleted post clears only the delete marker', () => {
    const deleted = softDeletePost(post(), '2026-11-24T10:00:00.000Z');
    const restored = restorePost(deleted);
    expect(restored.deletedAt).toBeNull();
    expect(restored.status).toBe(deleted.status);
  });

  it('every lifecycle change bumps the version', () => {
    const start = { ...post(), version: 4 };
    expect(nextVersion(start).version).toBe(5);
    expect(unpublishPost(start).version).toBe(5);
    expect(softDeletePost(start, '2026-11-24T10:00:00.000Z').version).toBe(5);
    expect(restorePost(start).version).toBe(5);
  });

  it('a save from an older version is stale, so the second editor is refused', () => {
    const stored = { ...post(), version: 3 };
    expect(isStaleSave(stored, 2)).toBe(true);
    expect(isStaleSave(stored, 3)).toBe(false);
  });

  it('a row that is gone is not a conflict, because the editor is creating it', () => {
    expect(isStaleSave(undefined, 3)).toBe(false);
  });
});
