import { beforeEach, describe, expect, it } from 'vitest';
import {
  FEED_EVENTS,
  FEED_RETENTION_DAYS,
  buildFeedRow,
  canSee,
  feedFor,
  fillTemplate,
  pruneFeed,
  pushFeedEvent,
  readFeed,
  type FeedRow,
} from './notificationFeed';

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
  (globalThis as { window?: unknown }).window = {
    localStorage: store,
    dispatchEvent: () => true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
  return store;
}

const at = new Date('2026-11-23T03:00:00.000Z');

beforeEach(() => {
  fakeWindow();
});

describe('the Plan §16B.3 event table', () => {
  it('gives every event a link template', () => {
    for (const definition of Object.values(FEED_EVENTS)) {
      expect(definition.href.startsWith('/')).toBe(true);
      expect(definition.id).toBeDefined();
    }
  });

  it('sends a published blog to everyone and a job failure to Super Admin only', () => {
    expect(canSee(buildFeedRow('blog_published', { title: 't', message: 'm' }, at), {})).toBe(true);
    const failure = buildFeedRow('job_failed', { title: 't', message: 'm' }, at);
    expect(canSee(failure, { role: 'Super Admin' })).toBe(true);
    expect(canSee(failure, { role: 'Ads Admin' })).toBe(false);
  });

  it('keeps an ad approval away from a Rental Admin', () => {
    const row = buildFeedRow('ad_pending_approval', { title: 't', message: 'm' }, at);
    expect(canSee(row, { role: 'Rental Admin' })).toBe(false);
    expect(canSee(row, { role: 'Super Admin' })).toBe(true);
  });

  it('addresses a rental request to the Rental Admin', () => {
    const row = buildFeedRow('rental_requested', { title: 't', message: 'm' }, at);
    expect(canSee(row, { role: 'Rental Admin' })).toBe(true);
    expect(canSee(row, { role: 'Ads Admin' })).toBe(false);
  });

  it('sends an owner application to Admin and Super Admin', () => {
    const row = buildFeedRow('owner_application', { title: 't', message: 'm' }, at);
    expect(canSee(row, { role: 'Admin' })).toBe(true);
    expect(canSee(row, { role: 'Super Admin' })).toBe(true);
    expect(canSee(row, { role: 'Owner Admin' })).toBe(false);
  });
});

describe('recipients', () => {
  it('never shows a named user row to another account', () => {
    const row = buildFeedRow('rental_status', {
      title: 't',
      message: 'm',
      recipients: [{ kind: 'user', value: 'traveler-1' }],
    }, at);
    expect(canSee(row, { userId: 'traveler-1' })).toBe(true);
    expect(canSee(row, { userId: 'traveler-2' })).toBe(false);
    expect(canSee(row, {})).toBe(false);
  });

  it('matches an author by name without caring about case or padding', () => {
    const row = buildFeedRow('guide_earning', {
      title: 't',
      message: 'm',
      recipients: [{ kind: 'author', value: '  Thazin Win ' }],
    }, at);
    expect(canSee(row, { name: 'thazin win' })).toBe(true);
    expect(canSee(row, { name: 'Aung Ko' })).toBe(false);
  });

  it('refuses an author row to a viewer with no name', () => {
    const row = buildFeedRow('guide_earning', {
      title: 't',
      message: 'm',
      recipients: [{ kind: 'author', value: 'Thazin Win' }],
    }, at);
    expect(canSee(row, {})).toBe(false);
  });
});

describe('links', () => {
  it('fills the booking code into the traveler link', () => {
    const row = buildFeedRow('rental_status', {
      title: 't',
      message: 'm',
      recipients: [{ kind: 'user', value: 'u1' }],
      link: { code: 'RNT-261120-0001' },
    }, at);
    expect(row.href).toBe('/account/bookings/RNT-261120-0001');
  });

  it('leaves an unknown placeholder alone rather than printing undefined', () => {
    expect(fillTemplate('/blogs/{slug}', {})).toBe('/blogs/{slug}');
    expect(fillTemplate('/blogs/{slug}', { slug: 'bagan' })).toBe('/blogs/bagan');
  });
});

describe('writing and reading', () => {
  it('writes one row and reads it back', () => {
    pushFeedEvent('blog_published', { title: 'New post', message: 'Bagan at dawn', link: { slug: 'bagan' }, at });
    const rows = readFeed();
    expect(rows).toHaveLength(1);
    expect(rows[0].href).toBe('/blogs/bagan');
    expect(rows[0].event).toBe('blog_published');
  });

  it('writes nothing for an event with no recipient', () => {
    const row = pushFeedEvent('rental_status', { title: 't', message: 'm', at });
    expect(row.recipients).toEqual([]);
    expect(readFeed()).toEqual([]);
  });

  it('survives a corrupted store instead of throwing', () => {
    window.localStorage.setItem('mh-travel-notification-feed', '{not json');
    expect(readFeed()).toEqual([]);
  });

  it('drops a row past the retention window', () => {
    const old = buildFeedRow('blog_published', { title: 't', message: 'm' }, new Date('2026-01-01T00:00:00.000Z'));
    const fresh = buildFeedRow('blog_published', { title: 't', message: 'm' }, at);
    const kept = pruneFeed([old, fresh], at);
    expect(kept.map((row) => row.id)).toEqual([fresh.id]);
    expect(FEED_RETENTION_DAYS).toBe(90);
  });
});

describe('one viewer feed', () => {
  function row(id: string, createdAt: string, recipients: FeedRow['recipients']): FeedRow {
    return { id, event: 'job_failed', title: id, message: '', href: '/super-admin', recipients, createdAt };
  }

  it('keeps only the rows the viewer may see, newest first', () => {
    const rows = [
      row('older', '2026-11-22T00:00:00.000Z', [{ kind: 'role', value: 'Super Admin' }]),
      row('newer', '2026-11-23T00:00:00.000Z', [{ kind: 'role', value: 'Super Admin' }]),
      row('rental', '2026-11-23T01:00:00.000Z', [{ kind: 'role', value: 'Rental Admin' }]),
    ];
    expect(feedFor(rows, { role: 'Super Admin' }, at).map((item) => item.id)).toEqual(['newer', 'older']);
    expect(feedFor(rows, { role: 'Rental Admin' }, at).map((item) => item.id)).toEqual(['rental']);
  });
});
