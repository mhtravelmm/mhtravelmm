import { describe, expect, it } from 'vitest';
import {
  applyExpiry,
  blocksBooking,
  daysUntilEnd,
  deriveStatus,
  dueReminders,
  graceDaysLeft,
  latestSubscription,
  markReminded,
  reminderKey,
  subscriptionForOwner,
  type OwnerSubscription,
} from './ownerSubscriptions';

/** A fixed clock in Myanmar Time, so the day arithmetic never follows the host. */
const NOW = new Date('2026-11-20T03:00:00.000Z');

function sub(overrides: Partial<OwnerSubscription> = {}): OwnerSubscription {
  return {
    id: 'sub-1',
    kind: 'owner',
    shopId: 'rangoon_house',
    shopName: 'The Rangoon House',
    ownerName: 'The Rangoon House',
    amountMmk: 3000,
    periodStart: '2026-10-24T00:00:00.000Z',
    periodEnd: '2026-11-23T00:00:00.000Z',
    status: 'active',
    graceDays: 7,
    remindedKeys: [],
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

describe('owner subscription lifecycle (Plan §9, §4)', () => {
  it('is active before the period ends', () => {
    expect(deriveStatus(sub(), NOW)).toBe('active');
  });

  it('is in grace after the period ends and before the grace period runs out', () => {
    expect(deriveStatus(sub({ periodEnd: '2026-11-18T00:00:00.000Z' }), NOW)).toBe('grace');
  });

  it('is expired once the grace period has passed', () => {
    expect(deriveStatus(sub({ periodEnd: '2026-11-10T00:00:00.000Z' }), NOW)).toBe('expired');
  });

  it('treats an unreadable period end as expired rather than free service', () => {
    expect(deriveStatus(sub({ periodEnd: 'not-a-date' }), NOW)).toBe('expired');
  });

  it('counts the days left on the Myanmar calendar, not on hours', () => {
    expect(daysUntilEnd(sub({ periodEnd: '2026-11-23T00:00:00.000Z' }), NOW)).toBe(3);
    expect(daysUntilEnd(sub({ periodEnd: 'not-a-date' }), NOW)).toBeNull();
  });

  it('moves only the rows whose status changed, so a rerun is silent', () => {
    const rows = [sub(), sub({ id: 'sub-2', periodEnd: '2026-11-18T00:00:00.000Z' })];
    const first = applyExpiry(rows, NOW);
    expect(first.moved).toBe(1);
    expect(first.rows[1].status).toBe('grace');

    const second = applyExpiry(first.rows, NOW);
    expect(second.moved).toBe(0);
  });

  it('blocks booking only when the subscription has expired', () => {
    expect(blocksBooking(sub(), NOW)).toBe(false);
    expect(blocksBooking(sub({ periodEnd: '2026-11-18T00:00:00.000Z' }), NOW)).toBe(false);
    expect(blocksBooking(sub({ periodEnd: '2026-11-10T00:00:00.000Z' }), NOW)).toBe(true);
  });

  it('reports the grace days left, and zero once they are gone', () => {
    expect(graceDaysLeft(sub({ periodEnd: '2026-11-18T00:00:00.000Z' }), NOW)).toBe(5);
    expect(graceDaysLeft(sub({ periodEnd: '2026-11-10T00:00:00.000Z' }), NOW)).toBe(0);
  });
});

describe('renewal reminders (Plan §16B.3)', () => {
  it('raises a reminder only at 7, 3 and 1 days', () => {
    const rows = [
      sub({ id: 'seven', periodEnd: '2026-11-27T00:00:00.000Z' }),
      sub({ id: 'three', periodEnd: '2026-11-23T00:00:00.000Z' }),
      sub({ id: 'one', periodEnd: '2026-11-21T00:00:00.000Z' }),
      sub({ id: 'ten', periodEnd: '2026-11-30T00:00:00.000Z' }),
    ];
    expect(dueReminders(rows, NOW).map((row) => row.daysLeft)).toEqual([7, 3, 1]);
  });

  it('never repeats a reminder for the same period', () => {
    const row = sub({ periodEnd: '2026-11-23T00:00:00.000Z' });
    const sent = markReminded(row, 3, NOW);
    expect(sent.remindedKeys).toEqual([reminderKey(row, 3)]);
    expect(dueReminders([sent], NOW)).toHaveLength(0);
  });

  it('keeps reminding for a new period, because the key carries the end date', () => {
    const old = sub({ periodEnd: '2026-11-23T00:00:00.000Z' });
    const renewed = { ...old, periodEnd: '2026-11-27T00:00:00.000Z', remindedKeys: [reminderKey(old, 3)] };
    expect(renewed.remindedKeys).toEqual(['sub-1:2026-11-23T00:00:00.000Z:3']);
    expect(dueReminders([renewed], NOW).map((row) => row.daysLeft)).toEqual([7]);
  });

  it('stays quiet once the subscription has expired', () => {
    expect(dueReminders([sub({ periodEnd: '2026-11-10T00:00:00.000Z' })], NOW)).toHaveLength(0);
  });

  it('picks the newest period per shop and kind', () => {
    const rows = [
      sub({ id: 'old', periodEnd: '2026-10-23T00:00:00.000Z' }),
      sub({ id: 'new', periodEnd: '2026-12-23T00:00:00.000Z' }),
      sub({ id: 'template', kind: 'template', periodEnd: '2026-12-01T00:00:00.000Z' }),
    ];
    expect(latestSubscription(rows, 'rangoon_house', 'owner')?.id).toBe('new');
    expect(latestSubscription(rows, 'rangoon_house', 'template')?.id).toBe('template');
    expect(latestSubscription(rows, 'unknown', 'owner')).toBeUndefined();
  });

  it('shows an owner only their own row, never another shop', () => {
    const rows = [
      sub({ id: 'mine', ownerName: 'The Rangoon House' }),
      sub({ id: 'theirs', ownerName: 'Mandalay Book Nook', shopId: 'mandalay_booknook', periodEnd: '2026-12-31T00:00:00.000Z' }),
    ];
    expect(subscriptionForOwner(rows, 'the rangoon house')?.id).toBe('mine');
    expect(subscriptionForOwner(rows, 'Someone Else')).toBeUndefined();
    expect(subscriptionForOwner(rows, undefined)).toBeUndefined();
    expect(subscriptionForOwner(rows, '   ')).toBeUndefined();
  });
});
