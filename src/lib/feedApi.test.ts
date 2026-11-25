import { describe, expect, it } from 'vitest';
import { fromRemoteFeedRow, readRemoteFeed } from './feedApi';
import { canSee, feedFor, type FeedRow } from './notificationFeed';

/**
 * Plan §16B.3 and ticket O-02. The bell reads one feed; the browser store and
 * `notification_feed` have to arrive in the same shape or a row the server sends
 * would be filtered out by the client's own recipient check.
 */

describe('a notification_feed row in the reader shape (§16B.3)', () => {
  it('carries the recipient so the client filter can keep it', () => {
    const row = fromRemoteFeedRow({
      id: 'f1',
      event: 'rental_requested',
      title: 'New rental request',
      body: 'MHR-20261202-001',
      href: '/super-admin',
      recipient_kind: 'role',
      recipient_value: 'Rental Admin',
      created_at: '2026-12-02T02:00:00.000Z',
      expires_at: '2027-03-02T02:00:00.000Z',
    });
    expect(row.recipients).toEqual([{ kind: 'role', value: 'Rental Admin' }]);
    expect(canSee(row, { role: 'Rental Admin' })).toBe(true);
    expect(canSee(row, { role: 'Ads Admin' })).toBe(false);
  });

  it('shows one title in both language slots, so a reader never sees a blank', () => {
    const row = fromRemoteFeedRow({
      id: 'f2',
      event: 'admin_notice',
      title: 'အသိပေးချက်',
      body: 'စာသား',
      href: '/',
      recipient_kind: 'everyone',
      recipient_value: '',
      created_at: '2026-12-02T02:00:00.000Z',
      expires_at: '2027-03-02T02:00:00.000Z',
    });
    expect(row.title).toEqual({ mm: 'အသိပေးချက်', en: 'အသိပေးချက်' });
    expect(row.message).toEqual({ mm: 'စာသား', en: 'စာသား' });
  });

  it('reads an unknown recipient kind as everyone rather than dropping the row', () => {
    const row = fromRemoteFeedRow({
      id: 'f3',
      event: 'admin_notice',
      title: 't',
      body: 'b',
      href: '/',
      recipient_kind: 'a_kind_from_a_later_build',
      recipient_value: '',
      created_at: '2026-12-02T02:00:00.000Z',
      expires_at: '2027-03-02T02:00:00.000Z',
    });
    expect(row.recipients).toEqual([{ kind: 'everyone' }]);
  });

  it('names a user and an author by their value, so the byline still matches', () => {
    const user = fromRemoteFeedRow({
      id: 'f4', event: 'booking_status', title: 't', body: 'b', href: '/',
      recipient_kind: 'user', recipient_value: 'u-1',
      created_at: '2026-12-02T02:00:00.000Z', expires_at: '2027-03-02T02:00:00.000Z',
    });
    expect(user.recipients).toEqual([{ kind: 'user', value: 'u-1' }]);
    expect(canSee(user, { userId: 'u-1' })).toBe(true);

    const author = fromRemoteFeedRow({
      id: 'f5', event: 'guide_earning', title: 't', body: 'b', href: '/',
      recipient_kind: 'author', recipient_value: 'Daw Mya',
      created_at: '2026-12-02T02:00:00.000Z', expires_at: '2027-03-02T02:00:00.000Z',
    });
    expect(canSee(author, { name: 'daw mya' })).toBe(true);
  });
});

describe('the feed read with no Supabase configured', () => {
  // `null` is "could not answer", which keeps the browser rows. An empty array
  // would wipe the bell, which is the wrong reading of a missing table.
  it('answers null so the caller keeps its own rows', async () => {
    expect(await readRemoteFeed()).toBeNull();
  });

  it('still filters a merged list by the viewer, server rows included', () => {
    const rows: FeedRow[] = [
      {
        id: 'server', event: 'admin_notice', title: { mm: 'a', en: 'a' }, message: { mm: 'b', en: 'b' },
        href: '/', recipients: [{ kind: 'role', value: 'Admin' }], createdAt: '2026-12-02T02:00:00.000Z',
      },
      {
        id: 'browser', event: 'blog_published', title: { mm: 'a', en: 'a' }, message: { mm: 'b', en: 'b' },
        href: '/blogs/x', recipients: [{ kind: 'everyone' }], createdAt: '2026-12-01T02:00:00.000Z',
      },
    ];
    const forAdmin = feedFor(rows, { role: 'Admin' }, new Date('2026-12-03T00:00:00.000Z'));
    expect(forAdmin.map((row) => row.id)).toEqual(['server', 'browser']);
    const forTraveler = feedFor(rows, {}, new Date('2026-12-03T00:00:00.000Z'));
    expect(forTraveler.map((row) => row.id)).toEqual(['browser']);
  });
});
