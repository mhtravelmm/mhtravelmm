import { createCollection } from './collection';
import { myanmarToday, addDaysToDay } from './myanmarTime';

/**
 * Plan §3A.8, ticket O-70. The Applications and Owners tabs. The two are one
 * module because an approved application opens the Create owner form
 * pre-filled, and the owners list is where that form's result appears.
 */

export type ApplicationStatus = 'new' | 'contacted' | 'approved' | 'rejected';

export const APPLICATION_STATUSES: ApplicationStatus[] = ['new', 'contacted', 'approved', 'rejected'];

export interface OwnerApplicationRow {
  id: string;
  applicant_name: string;
  business_name: string;
  category: string;
  city: string;
  phone: string;
  address: string;
  notes: string;
  status: ApplicationStatus;
  handled_by: string | null;
  note: string;
  created_at: string;
  updated_at: string;
}

export const ownerApplications = createCollection<OwnerApplicationRow>({
  key: 'mh-travel-admin-owner-applications',
  seed: [] as OwnerApplicationRow[],
  id: (row) => row.id,
  isRow: (value): value is OwnerApplicationRow => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<OwnerApplicationRow>;
    return typeof row.id === 'string' && typeof row.business_name === 'string';
  },
  normalize: (row, seed) => ({ ...(seed ?? row), ...row, note: row.note ?? '', notes: row.notes ?? '' }),
});

/** §3A.8: new → contacted → approved or rejected. A decided row is final. */
const APPLICATION_NEXT: Record<ApplicationStatus, ApplicationStatus[]> = {
  new: ['contacted', 'approved', 'rejected'],
  contacted: ['approved', 'rejected'],
  approved: [],
  rejected: [],
};

export function applicationCanFollow(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return APPLICATION_NEXT[from].includes(to);
}

export function applicationNextStatuses(from: ApplicationStatus): ApplicationStatus[] {
  return APPLICATION_NEXT[from];
}

export function handleApplication(
  row: OwnerApplicationRow,
  status: ApplicationStatus,
  handledBy: string,
  note: string,
  now = new Date(),
): OwnerApplicationRow {
  return { ...row, status, handled_by: handledBy, note: note.trim() || row.note, updated_at: now.toISOString() };
}

export type OwnerStatus = 'pending' | 'active' | 'expired' | 'suspended';

export interface OwnerRow {
  id: string;
  owner_name: string;
  shop_name: string;
  username: string;
  email: string;
  phone: string;
  city: string;
  category: string;
  status: OwnerStatus;
  /** `YYYY-MM-DD` in Myanmar Time. */
  subscription_end: string | null;
  commission_percent: number;
  monthly_fee_mmk: number;
  verified: boolean;
  listing_id: string | null;
  created_at: string;
}

export const owners = createCollection<OwnerRow>({
  key: 'mh-travel-admin-owners',
  seed: [] as OwnerRow[],
  id: (row) => row.id,
  isRow: (value): value is OwnerRow => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<OwnerRow>;
    return typeof row.id === 'string' && typeof row.shop_name === 'string';
  },
  normalize: (row, seed) => ({
    ...(seed ?? row),
    ...row,
    commission_percent: row.commission_percent ?? 10,
    monthly_fee_mmk: row.monthly_fee_mmk ?? 50000,
    verified: row.verified ?? false,
    subscription_end: row.subscription_end === undefined ? (seed?.subscription_end ?? null) : row.subscription_end,
  }),
});

export interface OwnerFilters {
  city: string | 'all';
  category: string | 'all';
  status: OwnerStatus | 'all';
  pendingOnly: boolean;
  query: string;
}

export const EMPTY_OWNER_FILTERS: OwnerFilters = {
  city: 'all',
  category: 'all',
  status: 'all',
  pendingOnly: false,
  query: '',
};

export function filterOwners(rows: OwnerRow[], filters: OwnerFilters): OwnerRow[] {
  const needle = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.pendingOnly && row.status !== 'pending') return false;
    if (filters.city !== 'all' && row.city !== filters.city) return false;
    if (filters.category !== 'all' && row.category !== filters.category) return false;
    if (filters.status !== 'all' && row.status !== filters.status) return false;
    if (!needle) return true;
    return `${row.owner_name} ${row.shop_name} ${row.username} ${row.city}`.toLowerCase().includes(needle);
  });
}

/** §3A.5 Needs attention: a subscription within 7 days of its end. */
export const SUBSCRIPTION_WARNING_DAYS = 7;

export function subscriptionsEndingSoon(rows: OwnerRow[], today = myanmarToday()): OwnerRow[] {
  const limit = addDaysToDay(today, SUBSCRIPTION_WARNING_DAYS);
  return rows.filter(
    (row) => row.subscription_end !== null && row.subscription_end >= today && row.subscription_end <= limit && row.status !== 'suspended',
  );
}

/** §3A.8: renewing records the payment and moves the end date forward. */
export function renewSubscription(row: OwnerRow, months = 1, today = myanmarToday()): OwnerRow {
  const base = row.subscription_end && row.subscription_end > today ? row.subscription_end : today;
  const date = new Date(`${base}T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return { ...row, subscription_end: date.toISOString().slice(0, 10), status: 'active' };
}

export function setOwnerStatus(row: OwnerRow, status: OwnerStatus): OwnerRow {
  return { ...row, status };
}

export function ownerSummary(rows: OwnerRow[]): { total: number; active: number; pending: number; expired: number } {
  return {
    total: rows.length,
    active: rows.filter((row) => row.status === 'active').length,
    pending: rows.filter((row) => row.status === 'pending').length,
    expired: rows.filter((row) => row.status === 'expired').length,
  };
}

/** §3A.8: a one-time link, shown once and never stored. */
export function oneTimeSignInLink(username: string, now = new Date()): string {
  const token = `${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `/admin/login?one_time=${token}&u=${encodeURIComponent(username)}`;
}
