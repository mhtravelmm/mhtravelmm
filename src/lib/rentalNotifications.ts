import { useEffect, useState } from 'react';
import type { NotificationItem } from '../data/notifications';
import { useAuth } from './auth';
import { readScoped, writeScoped } from './userScope';
import type { RentalOrder, RentalOrderStatus } from './rentalOrders';

/**
 * Plan §8.9: Requested goes to the Rental Admin; Accepted, Paid, Expired and
 * Cancelled go to the traveler; a reschedule goes back to the Rental Admin.
 * The order timeline already records every change — this module is what
 * actually hands the change to a person.
 */

export type RentalNoticeAudience = 'staff' | 'traveler';

/** Statuses that notify somebody, and whom. */
export const NOTICE_AUDIENCE: Partial<Record<RentalOrderStatus, RentalNoticeAudience[]>> = {
  requested: ['staff'],
  accepted: ['traveler'],
  paid: ['traveler'],
  expired: ['traveler'],
  cancelled: ['traveler'],
};

export type RentalNotice = {
  id: string;
  orderId: string;
  requestCode: string;
  audience: RentalNoticeAudience;
  /** Set for the reschedule notice, which is not a status change. */
  kind: RentalOrderStatus | 'rescheduled' | 'extra';
  createdAt: string;
  href: string;
};

export const STAFF_NOTIFICATIONS_KEY = 'mh-travel-admin-notifications';
export const STAFF_NOTIFICATIONS_EVENT = 'mh-travel-admin-notifications-changed';
const TRAVELER_STORAGE_BASE = 'rental-notification';
const TRAVELER_EVENT = 'mh-travel-rental-notices-changed';

export type StaffNotification = { id: string; title: string; message: string; createdAt: string; read: boolean };

/** Plan §8.9: who hears about this transition, and nothing for Completed. */
export function noticeAudiences(to: RentalOrderStatus): RentalNoticeAudience[] {
  return NOTICE_AUDIENCE[to] ?? [];
}

function noticeId(orderId: string, kind: string, at: string): string {
  return `rental-${orderId}-${kind}-${at}`;
}

/**
 * Builds the notices one change produces. A reschedule is passed as
 * `kind: 'rescheduled'` because it does not move the status.
 */
export function noticesForChange(order: RentalOrder, kind: RentalNotice['kind'], at: Date): RentalNotice[] {
  const audiences: RentalNoticeAudience[] =
    kind === 'rescheduled'
      ? ['staff']
      : kind === 'extra'
        ? ['traveler']
        : noticeAudiences(kind as RentalOrderStatus);
  const stamp = at.toISOString();
  return audiences.map((audience) => ({
    id: noticeId(order.id, kind, stamp),
    orderId: order.id,
    requestCode: order.requestCode,
    audience,
    kind,
    createdAt: stamp,
    href: `/account/bookings/${order.requestCode}`,
  }));
}

/**
 * Staff notices reuse the admin bell's own record shape, so the Super Admin
 * page shows them without a second list. Titles stay in English there, which
 * is how the admin chrome already reads.
 */
const STAFF_TITLE: Record<RentalNotice['kind'], string> = {
  requested: 'New rental request',
  accepted: 'Rental order accepted',
  paid: 'Rental payment recorded',
  completed: 'Rental order completed',
  expired: 'Rental order expired',
  cancelled: 'Rental order cancelled',
  rescheduled: 'Rental order rescheduled',
  extra: 'Rental costs added',
};

export function staffNotificationFor(notice: RentalNotice, order?: RentalOrder): StaffNotification {
  const who = order ? `${order.customerName} (${order.phone})` : 'A traveler';
  const detail =
    notice.kind === 'requested'
      ? `${who} asked for a rental. Open ${notice.requestCode} to accept or decline.`
      : notice.kind === 'rescheduled'
        ? `${who} moved ${notice.requestCode} to a new start date.`
        : notice.kind === 'extra'
          ? `Guide costs were added to ${notice.requestCode}.`
          : `${notice.requestCode} is now ${notice.kind}.`;
  return {
    id: notice.id,
    title: STAFF_TITLE[notice.kind],
    message: detail,
    createdAt: notice.createdAt,
    read: false,
  };
}

export function readStaffNotifications(): StaffNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(STAFF_NOTIFICATIONS_KEY) || '[]');
    return Array.isArray(stored) ? (stored as StaffNotification[]) : [];
  } catch {
    return [];
  }
}

/** Newest first, capped so the bell never grows without bound. */
export function appendStaffNotifications(next: StaffNotification[], limit = 50): StaffNotification[] {
  const seen = new Set<string>();
  const merged = [...next, ...readStaffNotifications()].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  return merged
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function writeStaffNotifications(items: StaffNotification[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STAFF_NOTIFICATIONS_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(STAFF_NOTIFICATIONS_EVENT));
}

export function readTravelerNotices(owner: string | null): RentalNotice[] {
  return readScoped<RentalNotice[]>(TRAVELER_STORAGE_BASE, owner, []);
}

export function writeTravelerNotices(owner: string | null, notices: RentalNotice[]): void {
  writeScoped(TRAVELER_STORAGE_BASE, owner, notices);
}

/** Plan §8.9: the traveler's own bell, capped like the staff one. */
export function appendTravelerNotices(owner: string | null, next: RentalNotice[], limit = 50): RentalNotice[] {
  const seen = new Set<string>();
  const merged = [...next, ...readTravelerNotices(owner)].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  const capped = merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  writeTravelerNotices(owner, capped);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(TRAVELER_EVENT));
  return capped;
}

const TRAVELER_TITLE: Record<RentalNotice['kind'], { mm: string; en: string }> = {
  requested: { mm: 'ငှားရမ်းမှု တောင်းဆိုချက် ပို့ပြီးပါပြီ', en: 'Rental request sent' },
  accepted: { mm: 'ငှားရမ်းမှု လက်ခံပြီး — ၁၂ နာရီအတွင်း ငွေပေးပါ', en: 'Rental accepted — pay within 12 hours' },
  paid: { mm: 'ငွေပေးချေမှု မှတ်တမ်းတင်ပြီး — ဘောက်ချာ အသင့်ဖြစ်ပါပြီ', en: 'Payment recorded — your voucher is ready' },
  completed: { mm: 'ငှားရမ်းမှု ပြီးစီးပါပြီ', en: 'Rental completed' },
  expired: { mm: 'ငွေမပေးချေသဖြင့် Order သက်တမ်းကုန်ပါပြီ', en: 'Order expired because payment was not received' },
  cancelled: { mm: 'Order ကို ပယ်ဖျက်ပါပြီ', en: 'Order cancelled' },
  rescheduled: { mm: 'ရက်ပြောင်းပြီးပါပြီ', en: 'Start date changed' },
  extra: { mm: 'ငှားရမ်းမှု ကုန်ကျစရိတ် ထပ်တိုးပါပြီ', en: 'Rental costs were added' },
};

/** Minutes, hours, then days — the same shape the seeded feed uses. */
export function timeAgoLabel(iso: string, now: Date): string {
  const minutes = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** Turns a stored notice into a bell row, so the shared feed can show it. */
export function travelerNoticeItem(notice: RentalNotice, language: 'mm' | 'en', now: Date): NotificationItem {
  const title = TRAVELER_TITLE[notice.kind];
  return {
    id: notice.id,
    title: `${title[language]} · ${notice.requestCode}`,
    thumbnailFrom: '#1d6fa5',
    thumbnailTo: '#0b2b45',
    timeAgo: timeAgoLabel(notice.createdAt, now),
    isRead: false,
    href: notice.href,
  };
}

/**
 * The traveler's rental notices as bell rows. Read-state is left to the shared
 * feed, which owns the per-account read map for every notification id.
 */
export function useRentalNoticeItems(language: 'mm' | 'en'): NotificationItem[] {
  const { user } = useAuth();
  const owner = user?.id ?? null;
  const [notices, setNotices] = useState<RentalNotice[]>(() => readTravelerNotices(owner));

  useEffect(() => {
    setNotices(readTravelerNotices(owner));
    const sync = () => setNotices(readTravelerNotices(owner));
    window.addEventListener(TRAVELER_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(TRAVELER_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [owner]);

  const now = new Date();
  return notices.map((notice) => travelerNoticeItem(notice, language, now));
}
