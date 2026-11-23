import { beforeEach, describe, expect, it } from 'vitest';
import { pushAdminNotice, pushFeedNotice, unreadAdminNoticeCount } from './adminNotices';
import { canSee, readFeed } from './notificationFeed';
import { readStaffNotifications } from './rentalNotifications';

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

describe('admin notices (Plan §16B.3)', () => {
  it('puts a notice in the same bell the rental staff notices use', () => {
    pushAdminNotice({ title: 'New admin account', message: 'Khin Su was created as Ads Admin' });
    const rows = readStaffNotifications();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ title: 'New admin account', read: false });
  });

  it('counts only unread rows, so the badge clears once they are read', () => {
    pushAdminNotice({ title: 'Guide earning paid', message: '25 USD paid for Bagan' });
    expect(unreadAdminNoticeCount()).toBe(1);
  });

  it('writes the bell row and the addressed feed row in one call', () => {
    pushFeedNotice('owner_application', { title: 'New application', message: 'Mandalay · hotel' });
    expect(readStaffNotifications()).toHaveLength(1);
    const rows = readFeed();
    expect(rows).toHaveLength(1);
    expect(canSee(rows[0], { role: 'Super Admin' })).toBe(true);
    expect(canSee(rows[0], { role: 'Rental Admin' })).toBe(false);
  });

  it('keeps every notice separate even when two land in the same millisecond', () => {
    const at = new Date('2026-11-23T09:00:00.000Z');
    pushAdminNotice({ title: 'A', message: 'first' }, at);
    pushAdminNotice({ title: 'B', message: 'second' }, at);
    expect(readStaffNotifications()).toHaveLength(2);
  });
});
