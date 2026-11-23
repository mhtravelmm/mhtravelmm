import { appendStaffNotifications, readStaffNotifications, writeStaffNotifications } from './rentalNotifications';

/**
 * Plan §16B.3: one service, shared feed rows plus per-user read state. The
 * admin bell already holds the rental notices, so the platform events that
 * name an admin recipient land in the same list rather than a second one. The
 * feed is shared today; the per-recipient rows arrive with
 * `notification_feed`.
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

export function unreadAdminNoticeCount(): number {
  return readStaffNotifications().filter((row) => !row.read).length;
}
