import { appendStaffNotifications, readStaffNotifications, writeStaffNotifications } from './rentalNotifications';
import { pushFeedEvent, type FeedEventId, type FeedInput } from './notificationFeed';
import { localizedOrFallback, type LocalizedTextLike } from './translationCache';

/**
 * Plan §16B.3: one service, shared feed rows plus per-user read state. The
 * admin bell already holds the rental notices, so a platform event that names
 * an admin recipient lands in the same list rather than a second one.
 */
export type AdminNotice = { title: LocalizedTextLike | string; message: LocalizedTextLike | string };

/**
 * The staff bell is one flat list, so a bilingual feed row is stored in the
 * language the admin chrome reads (§16B.4 keeps the source text, never blank).
 */
export function pushAdminNotice(notice: AdminNotice, at = new Date()): void {
  if (typeof window === 'undefined') return;
  const row = {
    id: `admin-notice-${at.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    title: localizedOrFallback(typeof notice.title === 'string' ? { mm: notice.title, en: notice.title } : notice.title, 'en'),
    message: localizedOrFallback(typeof notice.message === 'string' ? { mm: notice.message, en: notice.message } : notice.message, 'en'),
    createdAt: at.toISOString(),
    read: false,
  };
  writeStaffNotifications(appendStaffNotifications([row]));
}

/**
 * Writes the §16B.3 row as well as the bell row, so a recipient who is not the
 * one signed in still gets it when they open their own workspace.
 */
export function pushFeedNotice(event: FeedEventId, input: FeedInput): void {
  pushAdminNotice({ title: input.title, message: input.message }, input.at ?? new Date());
  pushFeedEvent(event, input);
}

export function unreadAdminNoticeCount(): number {
  return readStaffNotifications().filter((row) => !row.read).length;
}
