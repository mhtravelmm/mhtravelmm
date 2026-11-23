import { appendStaffNotifications, readStaffNotifications, writeStaffNotifications } from './rentalNotifications';
import { pushFeedEvent, type FeedEventId, type FeedInput } from './notificationFeed';

/**
 * Plan §16B.3: one service, shared feed rows plus per-user read state. The
 * admin bell already holds the rental notices, so a platform event that names
 * an admin recipient lands in the same list rather than a second one.
 */
export type AdminNotice = { title: string; message: string };

export function pushAdminNotice(notice: AdminNotice, at = new Date()): void {
  if (typeof window === 'undefined') return;
  const row = {
    id: `admin-notice-${at.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    title: notice.title,
    message: notice.message,
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
