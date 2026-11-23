import { beforeEach, describe, expect, it } from 'vitest';
import {
  appendStaffNotifications,
  appendTravelerNotices,
  noticesForChange,
  noticeAudiences,
  readStaffNotifications,
  readTravelerNotices,
  staffNotificationFor,
  timeAgoLabel,
  travelerNoticeItem,
  writeStaffNotifications,
} from './rentalNotifications';
import { STAFF_NOTIFICATIONS_KEY } from './rentalNotifications';
import type { RentalOrder } from './rentalOrders';

function order(overrides: Partial<RentalOrder> = {}): RentalOrder {
  return {
    id: 'o1',
    requestCode: 'RNT-261120-0001',
    userId: 'traveler-1',
    customerName: 'Aung Aung',
    phone: '+959123456789',
    cityId: 'yangon',
    categoryId: 'bicycle',
    variantId: null,
    startDate: '2026-12-01',
    endDate: '2026-12-02',
    originalStartDate: '2026-12-01',
    days: 2,
    participants: 1,
    customerType: 'citizen',
    fulfillment: 'branch',
    branchId: 'yangon-downtown',
    deliveryAddress: '',
    specialRequests: '',
    termsVersion: '2026-11-22',
    rateUsd: 8,
    totalUsd: 16,
    displayCurrency: 'MMK',
    fxMmkPerUsd: 4500,
    status: 'requested',
    acceptedAt: null,
    paymentDeadline: null,
    paymentMethod: null,
    paymentReceivedAt: null,
    voucherVersion: 0,
    rescheduledCount: 0,
    adminNote: '',
    createdAt: '2026-11-20T03:00:00.000Z',
    updatedAt: '2026-11-20T03:00:00.000Z',
    events: [],
    ...overrides,
  };
}

const at = new Date('2026-11-20T05:00:00.000Z');

function fakeWindow() {
  const map = new Map<string, string>();
  const store: Storage = {
    get length() { return map.size; },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => { map.delete(key); },
    setItem: (key: string, value: string) => { map.set(key, value); },
  };
  const listeners = new Map<string, Set<() => void>>();
  (globalThis as { window?: unknown }).window = {
    localStorage: store,
    dispatchEvent: (event: Event) => {
      for (const listener of listeners.get(event.type) ?? []) listener();
      return true;
    },
    addEventListener: (type: string, listener: () => void) => {
      const set = listeners.get(type) ?? new Set<() => void>();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener: (type: string, listener: () => void) => {
      listeners.get(type)?.delete(listener);
    },
  };
  return store;
}

beforeEach(() => {
  fakeWindow();
});

describe('who hears about a status change', () => {
  it('sends Requested to staff only', () => {
    expect(noticeAudiences('requested')).toEqual(['staff']);
  });

  it('sends Accepted, Paid, Expired and Cancelled to the traveler', () => {
    for (const status of ['accepted', 'paid', 'expired', 'cancelled'] as const) {
      expect(noticeAudiences(status)).toEqual(['traveler']);
    }
  });

  it('sends nothing for Completed, which the traveler just lived through', () => {
    expect(noticeAudiences('completed')).toEqual([]);
  });

  it('sends a reschedule to staff', () => {
    const notices = noticesForChange(order(), 'rescheduled', at);
    expect(notices).toHaveLength(1);
    expect(notices[0].audience).toBe('staff');
    expect(notices[0].kind).toBe('rescheduled');
  });

  it('links the traveler to their own voucher', () => {
    const notices = noticesForChange(order({ status: 'accepted' }), 'accepted', at);
    expect(notices[0].href).toBe('/account/bookings/RNT-261120-0001');
  });
});

describe('staff bell', () => {
  it('names the traveler and the request code on a new request', () => {
    const notice = noticesForChange(order(), 'requested', at)[0];
    const item = staffNotificationFor(notice, order());
    expect(item.title).toBe('New rental request');
    expect(item.message).toContain('Aung Aung');
    expect(item.message).toContain('RNT-261120-0001');
    expect(item.read).toBe(false);
  });

  it('still writes a usable row when the order is gone', () => {
    const notice = noticesForChange(order(), 'requested', at)[0];
    expect(staffNotificationFor(notice).message).toContain('A traveler');
  });

  it('keeps the newest first and drops a repeated id', () => {
    const notice = noticesForChange(order(), 'requested', at)[0];
    const first = staffNotificationFor(notice, order());
    const older = { ...first, id: 'older', createdAt: '2026-11-19T00:00:00.000Z' };
    const merged = appendStaffNotifications([older, first, first]);
    expect(merged.map((item) => item.id)).toEqual([first.id, 'older']);
  });

  it('caps the bell so it cannot grow without bound', () => {
    const rows = Array.from({ length: 60 }, (_, index) => ({
      id: `n${index}`,
      title: 't',
      message: 'm',
      createdAt: new Date(Date.UTC(2026, 10, 20, 0, index)).toISOString(),
      read: false,
    }));
    expect(appendStaffNotifications(rows).length).toBe(50);
    writeStaffNotifications(appendStaffNotifications(rows));
    expect(readStaffNotifications()).toHaveLength(50);
    expect(window.localStorage.getItem(STAFF_NOTIFICATIONS_KEY)).toBeTruthy();
  });
});

describe('traveler notices', () => {
  it('keeps one account notices out of the next account scope', () => {
    const notices = noticesForChange(order({ status: 'paid' }), 'paid', at);
    appendTravelerNotices('traveler-1', notices);
    expect(readTravelerNotices('traveler-1')).toHaveLength(1);
    expect(readTravelerNotices('traveler-2')).toEqual([]);
  });

  it('writes the same notice twice without duplicating it', () => {
    const notices = noticesForChange(order({ status: 'paid' }), 'paid', at);
    appendTravelerNotices('traveler-1', notices);
    appendTravelerNotices('traveler-1', notices);
    expect(readTravelerNotices('traveler-1')).toHaveLength(1);
  });
});

describe('feed rows', () => {
  it('renders the notice in the chosen language with the request code', () => {
    const notice = noticesForChange(order({ status: 'accepted' }), 'accepted', at)[0];
    expect(travelerNoticeItem(notice, 'en', at).title).toContain('pay within 12 hours');
    expect(travelerNoticeItem(notice, 'mm', at).title).toContain('RNT-261120-0001');
  });

  it('labels the age in minutes, hours and days', () => {
    expect(timeAgoLabel('2026-11-20T04:59:40.000Z', at)).toBe('just now');
    expect(timeAgoLabel('2026-11-20T04:58:00.000Z', at)).toBe('2 minutes ago');
    expect(timeAgoLabel('2026-11-20T03:00:00.000Z', at)).toBe('2 hours ago');
    expect(timeAgoLabel('2026-11-18T05:00:00.000Z', at)).toBe('2 days ago');
  });
});
