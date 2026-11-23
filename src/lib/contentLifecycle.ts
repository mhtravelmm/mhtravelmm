import type { AdminGuide, AdminPost } from './contentStore';

/**
 * Plan §10 §4 Unpublish, Delete and Restore, and §7 acceptance 5 (two editors
 * saving one post). Kept out of the panels so the rules are the same for Blog
 * and Travel Guide and can be tested without rendering an editor.
 */

type Versioned = { version: number };

/** Every save bumps the version, which is what makes a stale save detectable. */
export function nextVersion<T extends Versioned>(row: T): T {
  return { ...row, version: row.version + 1 };
}

/**
 * True when the row moved on since the editor loaded it. A row that is gone
 * from the store is not a conflict: the editor is creating it again.
 */
export function isStaleSave(row: Versioned | undefined, loadedVersion: number): boolean {
  if (!row) return false;
  return row.version !== loadedVersion;
}

/** Unpublish returns a post to Draft and clears the date it went live. */
export function unpublishPost(post: AdminPost): AdminPost {
  return nextVersion({ ...post, status: 'Draft', publishedAt: '', scheduledFor: null });
}

export function unpublishGuide(guide: AdminGuide): AdminGuide {
  return nextVersion({ ...guide, status: 'Draft', publishedAt: '', scheduledFor: null, scheduledDate: '', scheduledTime: '' });
}

/**
 * A soft delete: the row keeps its content and audit trail, and `deletedAt`
 * is what takes it off the reader. The store never drops a row, so a deleted
 * post can be restored with its history intact.
 */
export function softDeletePost(post: AdminPost, at: string): AdminPost {
  return nextVersion({ ...post, deletedAt: at });
}

export function softDeleteGuide(guide: AdminGuide, at: string): AdminGuide {
  return nextVersion({ ...guide, deletedAt: at });
}

export function restorePost(post: AdminPost): AdminPost {
  return nextVersion({ ...post, deletedAt: null });
}

export function restoreGuide(guide: AdminGuide): AdminGuide {
  return nextVersion({ ...guide, deletedAt: null });
}
