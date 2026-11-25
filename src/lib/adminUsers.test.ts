import { describe, expect, it } from 'vitest';
import {
  anonymizeUser,
  filterUsers,
  restoreUser,
  suspendUser,
  userExportJson,
  userSummary,
  type AdminUserRow,
} from './adminUsers';

/**
 * Plan §3A.6. Suspending, restoring and anonymising a traveler are the three
 * writes this screen has, and the export is the reader's own copy of their
 * data, so each is tested on a plain row.
 */

function user(overrides: Partial<AdminUserRow> = {}): AdminUserRow {
  return {
    id: 'u1', name: 'Moe Thu', username: 'moe_thu', email: 'moe@example.com',
    phone: '+95 9 771 100 001', joined_at: '2026-11-20', last_sign_in_at: '2026-11-20T01:00:00.000Z',
    language: 'mm', status: 'active', bookings: 2, reviews: 1, favorites: 3,
    reports_against: 0, suspended_reason: null, suspended_at: null,
    ...overrides,
  };
}

describe('the users list (§3A.6)', () => {
  it('searches by name, username, email and phone', () => {
    const rows = [user()];
    expect(filterUsers(rows, 'moe', 'all')).toHaveLength(1);
    expect(filterUsers(rows, 'moe_thu', 'all')).toHaveLength(1);
    expect(filterUsers(rows, 'example.com', 'all')).toHaveLength(1);
    expect(filterUsers(rows, '771 100', 'all')).toHaveLength(1);
    expect(filterUsers(rows, 'nobody', 'all')).toHaveLength(0);
  });

  it('filters by status', () => {
    const rows = [user({ id: 'u1' }), user({ id: 'u2', status: 'suspended' })];
    expect(filterUsers(rows, '', 'active').map((row) => row.id)).toEqual(['u1']);
    expect(filterUsers(rows, '', 'suspended').map((row) => row.id)).toEqual(['u2']);
  });

  it('suspends with a reason, because the reader is told why', () => {
    const next = suspendUser(user(), 'Spam in reviews');
    expect(next.status).toBe('suspended');
    expect(next.suspended_reason).toBe('Spam in reviews');
  });

  it('restores and clears the reason, so the next suspension starts clean', () => {
    const next = restoreUser(user({ status: 'suspended', suspended_reason: 'Spam' }));
    expect(next.status).toBe('active');
    expect(next.suspended_reason).toBeNull();
    expect(next.suspended_at).toBeNull();
  });

  it('anonymises the personal fields, keeps the id and the counts', () => {
    const next = anonymizeUser(user());
    expect(next.id).toBe('u1');
    expect(next.name).toBe('Deleted user');
    expect(next.username).toBe('deleted-u1');
    expect(next.email).toBe('');
    expect(next.phone).toBe('');
    // The bookings stay as "Deleted user" for 24 months (§3A.6).
    expect(next.bookings).toBe(2);
    expect(next.status).toBe('active');
  });

  it('summarises total, active and suspended', () => {
    const summary = userSummary([
      user({ id: 'u1' }),
      user({ id: 'u2' }),
      user({ id: 'u3', status: 'suspended' }),
    ]);
    expect(summary).toEqual({ total: 3, active: 2, suspended: 1 });
  });

  it('exports the reader own data as JSON, profile and counts apart', () => {
    const parsed = JSON.parse(userExportJson(user())) as {
      exported_at: string;
      profile: Record<string, unknown>;
      counts: Record<string, number>;
    };
    expect(parsed.profile.id).toBe('u1');
    expect(parsed.profile.name).toBe('Moe Thu');
    expect(parsed.profile.email).toBe('moe@example.com');
    expect(parsed.profile.joined_at).toBe('2026-11-20');
    expect(parsed.counts).toEqual({ bookings: 2, reviews: 1, favorites: 3 });
    expect(parsed.exported_at).toBeTruthy();
  });
});
