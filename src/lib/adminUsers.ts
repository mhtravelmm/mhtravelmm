import { createCollection } from './collection';

/**
 * Plan §3A.6, ticket O-62. Every traveler account, for support and safety. The
 * rows are the browser stand-in for `admin_list_users()`; the shape is the
 * function's, so pointing this at the server changes the adapter and nothing
 * else (§16F.4).
 */

export type UserStatus = 'active' | 'suspended';

export interface AdminUserRow {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  /** `YYYY-MM-DD` in Myanmar Time, like every date on a dashboard screen. */
  joined_at: string;
  last_sign_in_at: string | null;
  language: 'mm' | 'en';
  status: UserStatus;
  suspended_reason: string | null;
  suspended_at: string | null;
  bookings: number;
  reviews: number;
  favorites: number;
  reports_against: number;
}

export const adminUsers = createCollection<AdminUserRow>({
  key: 'mh-travel-admin-users',
  seed: [] as AdminUserRow[],
  id: (row) => row.id,
  isRow: (value): value is AdminUserRow => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<AdminUserRow>;
    return typeof row.id === 'string' && typeof row.name === 'string' && typeof row.email === 'string';
  },
  normalize: (row, seed) => ({
    ...(seed ?? row),
    ...row,
    status: row.status === 'suspended' ? 'suspended' : 'active',
    bookings: row.bookings ?? 0,
    reviews: row.reviews ?? 0,
    favorites: row.favorites ?? 0,
    reports_against: row.reports_against ?? 0,
  }),
});

export type UserFilter = 'all' | UserStatus;

/**
 * The list's search box: name, username, email or phone (§3A.6). The phone is
 * compared with its spaces and dashes removed, so `09771` finds
 * `+95 9 771 000 101`.
 */
export function filterUsers(rows: AdminUserRow[], query: string, filter: UserFilter): AdminUserRow[] {
  const needle = query.trim().toLowerCase();
  const digits = needle.replace(/[\s-]/g, '');
  return rows.filter((row) => {
    if (filter !== 'all' && row.status !== filter) return false;
    if (!needle) return true;
    const haystack = `${row.name} ${row.username} ${row.email}`.toLowerCase();
    if (haystack.includes(needle)) return true;
    return digits.length > 0 && row.phone.replace(/[\s-]/g, '').includes(digits);
  });
}

/**
 * §3A.6: a suspended user cannot sign in, book or review, and their sessions are
 * revoked at once. Existing paid bookings stay valid, so nothing here touches
 * `bookings`.
 */
export function suspendUser(row: AdminUserRow, reason: string, now = new Date()): AdminUserRow {
  return {
    ...row,
    status: 'suspended',
    suspended_reason: reason.trim(),
    suspended_at: now.toISOString(),
  };
}

export function restoreUser(row: AdminUserRow): AdminUserRow {
  return { ...row, status: 'active', suspended_reason: null, suspended_at: null };
}

/**
 * §3A.6 `admin_process_deletion`: the profile is anonymized and the bookings
 * stay as "Deleted user" for 24 months, so the row keeps its id and counts and
 * loses everything that identifies the person.
 */
export function anonymizeUser(row: AdminUserRow): AdminUserRow {
  return {
    ...row,
    name: 'Deleted user',
    username: `deleted-${row.id}`,
    email: '',
    phone: '',
    language: 'en',
    status: 'active',
    suspended_reason: null,
    suspended_at: null,
  };
}

export function userSummary(rows: AdminUserRow[]): { total: number; active: number; suspended: number } {
  return {
    total: rows.length,
    active: rows.filter((row) => row.status === 'active').length,
    suspended: rows.filter((row) => row.status === 'suspended').length,
  };
}

/** §3A.6 export: the user's own data as JSON, which the browser downloads. */
export function userExportJson(row: AdminUserRow): string {
  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      profile: {
        id: row.id,
        name: row.name,
        username: row.username,
        email: row.email,
        phone: row.phone,
        language: row.language,
        joined_at: row.joined_at,
        status: row.status,
      },
      counts: { bookings: row.bookings, reviews: row.reviews, favorites: row.favorites },
    },
    null,
    2,
  );
}
