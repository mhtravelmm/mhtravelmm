import type { TranslationKey } from './i18n';

/**
 * Shared content infrastructure for Blog and Travel Guide (Plan §10 item 3).
 * Status and scheduling already live in each editor; this adds the revision
 * trail and the audit log both content types record on every save.
 */

export type ContentKind = 'blog' | 'guide';

export type ContentAction = 'created' | 'saved' | 'published' | 'scheduled' | 'restored' | 'unpublished' | 'deleted';

export interface Revision<T> {
  id: string;
  contentId: string;
  savedAt: string;
  status: string;
  snapshot: T;
}

export interface AuditEntry {
  id: string;
  contentId: string;
  action: ContentAction;
  at: string;
  actor: string;
}

/** Older revisions drop off once this many are kept for one item. */
export const MAX_REVISIONS_PER_ITEM = 20;

export function actionForSave(status: string, isNew: boolean): ContentAction {
  if (isNew) return 'created';
  if (status === 'Published') return 'published';
  if (status === 'Scheduled') return 'scheduled';
  return 'saved';
}

export function recordRevision<T>(revisions: Revision<T>[], revision: Revision<T>): Revision<T>[] {
  const forItem = [revision, ...revisions.filter((item) => item.contentId === revision.contentId)];
  const others = revisions.filter((item) => item.contentId !== revision.contentId);
  return [...forItem.slice(0, MAX_REVISIONS_PER_ITEM), ...others];
}

export function revisionsFor<T>(revisions: Revision<T>[], contentId: string): Revision<T>[] {
  return revisions.filter((item) => item.contentId === contentId);
}

export function appendAudit(log: AuditEntry[], entry: AuditEntry): AuditEntry[] {
  return [entry, ...log];
}

export function auditFor(log: AuditEntry[], contentId: string): AuditEntry[] {
  return log.filter((entry) => entry.contentId === contentId);
}

/** The audit line is rendered through `t()`, so it resolves to a key, not English. */
export function actionLabelKey(action: ContentAction): TranslationKey {
  switch (action) {
    case 'created': return 'cw_action_created';
    case 'published': return 'cw_action_published';
    case 'scheduled': return 'cw_action_scheduled';
    case 'restored': return 'cw_action_restored';
    case 'unpublished': return 'cw_action_unpublished';
    case 'deleted': return 'cw_action_deleted';
    default: return 'cw_action_saved';
  }
}
