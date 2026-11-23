import { beforeEach, describe, expect, it } from 'vitest';
import { readAdminAudit } from './adminAudit';
import { readFeed } from './notificationFeed';
import { readSubscriptions, writeSubscriptions } from './ownerSubscriptionStore';
import { runRenewalReminders, runSubscriptionExpiry } from './subscriptionJobs';
import type { OwnerSubscription } from './ownerSubscriptions';

/** The store, the feed and the audit log are all browser storage. */
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

beforeEach(() => { fakeWindow(); });

describe('subscription expiry job (Plan §16B.7)', () => {
  it('moves a lapsed row to grace and records it once', () => {
    writeSubscriptions([sub({ periodEnd: '2026-11-18T00:00:00.000Z' })]);
    expect(runSubscriptionExpiry(NOW).moved).toBe(1);
    expect(readSubscriptions(NOW)[0].status).toBe('grace');
    expect(readAdminAudit()).toHaveLength(1);
    expect(readAdminAudit()[0]).toMatchObject({ actor: 'system', action: 'updated', objectType: 'shop_owner' });
  });

  it('is safe to run twice: the second pass changes nothing', () => {
    writeSubscriptions([sub({ periodEnd: '2026-11-18T00:00:00.000Z' })]);
    runSubscriptionExpiry(NOW);
    expect(runSubscriptionExpiry(NOW).moved).toBe(0);
    expect(readAdminAudit()).toHaveLength(1);
  });

  it('leaves an active row untouched', () => {
    writeSubscriptions([sub()]);
    expect(runSubscriptionExpiry(NOW).moved).toBe(0);
    expect(readAdminAudit()).toHaveLength(0);
  });
});

describe('renewal reminders (Plan §16B.3)', () => {
  it('writes one bilingual feed row for the owner at three days', () => {
    writeSubscriptions([sub()]);
    expect(runRenewalReminders(NOW)).toBe(1);
    const rows = readFeed();
    expect(rows).toHaveLength(1);
    expect(rows[0].event).toBe('subscription_ending');
    expect(rows[0].recipients).toEqual([{ kind: 'author', value: 'The Rangoon House' }]);
    // §16B.4: the row carries both languages, so the owner's later choice wins.
    expect(rows[0].title.mm).toContain('3');
    expect(rows[0].title.en).toContain('3');
    expect(rows[0].message.en).toContain('3,000 MMK');
  });

  it('does not send the same reminder twice', () => {
    writeSubscriptions([sub()]);
    expect(runRenewalReminders(NOW)).toBe(1);
    expect(runRenewalReminders(NOW)).toBe(0);
    expect(readFeed()).toHaveLength(1);
  });

  it('sends nothing on a day that is not a threshold', () => {
    writeSubscriptions([sub({ periodEnd: '2026-11-25T00:00:00.000Z' })]);
    expect(runRenewalReminders(NOW)).toBe(0);
    expect(readFeed()).toHaveLength(0);
  });
});
