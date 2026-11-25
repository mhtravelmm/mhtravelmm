import { createCollection } from './collection';
import { myanmarDay } from './myanmarTime';

/**
 * Plan §6.1 and §3A.9, ticket O-63. One booking list across hotels,
 * restaurants, events and rentals. The statuses are §6.1's, so a rental order
 * and a hotel booking move through the same six and a screen can show them
 * together.
 */

export type BookingStatus = 'requested' | 'accepted' | 'paid' | 'completed' | 'expired' | 'cancelled';

export const BOOKING_STATUSES: BookingStatus[] = [
  'requested',
  'accepted',
  'paid',
  'completed',
  'expired',
  'cancelled',
];

export type BookingCategory = 'hotel' | 'restaurant' | 'event' | 'rental' | 'ticket' | 'plan';

export const BOOKING_CATEGORIES: BookingCategory[] = [
  'hotel',
  'restaurant',
  'event',
  'rental',
  'ticket',
  'plan',
];

export type BookingFlow = 'full_manual' | 'instant';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile_wallet';

export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'bank_transfer', 'mobile_wallet'];

export interface BookingEvent {
  at: string;
  status: BookingStatus;
  by: string;
  note?: string;
}

export interface AdminBookingRow {
  /** The request code the traveler reads over the phone, e.g. `MHR-20261122-001`. */
  code: string;
  id: string;
  category: BookingCategory;
  listing_id: string;
  listing_name: string;
  city_id: string;
  owner_id: string | null;
  traveler_name: string;
  traveler_phone: string;
  /** `YYYY-MM-DD` in Myanmar Time. */
  start_date: string;
  end_date: string;
  guests: number;
  total_usd: number;
  commission_usd: number;
  status: BookingStatus;
  flow: BookingFlow;
  payment_method: PaymentMethod | null;
  paid_at: string | null;
  created_at: string;
  note: string;
  events: BookingEvent[];
}

/** §6.1: a move the table does not list is refused, so the set is explicit. */
export const BOOKING_NEXT: Record<BookingStatus, BookingStatus[]> = {
  requested: ['accepted', 'cancelled', 'expired'],
  accepted: ['paid', 'cancelled', 'expired'],
  paid: ['completed', 'cancelled'],
  completed: [],
  expired: [],
  cancelled: [],
};

export function bookingCanFollow(from: BookingStatus, to: BookingStatus): boolean {
  return BOOKING_NEXT[from].includes(to);
}

export function bookingNextStatuses(from: BookingStatus): BookingStatus[] {
  return BOOKING_NEXT[from];
}

export function bookingIsTerminal(status: BookingStatus): boolean {
  return BOOKING_NEXT[status].length === 0;
}

/** §6.1: only a `paid` booking may be rescheduled, and that is an event, not a status. */
export function bookingCanReschedule(row: AdminBookingRow): boolean {
  return row.status === 'paid';
}

export const adminBookings = createCollection<AdminBookingRow>({
  key: 'mh-travel-admin-bookings',
  seed: [] as AdminBookingRow[],
  id: (row) => row.id,
  isRow: (value): value is AdminBookingRow => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<AdminBookingRow>;
    return typeof row.id === 'string' && typeof row.code === 'string' && typeof row.status === 'string';
  },
  normalize: (row, seed) => ({
    ...(seed ?? row),
    ...row,
    events: Array.isArray(row.events) ? row.events : (seed?.events ?? []),
    commission_usd: row.commission_usd ?? 0,
  }),
});

export interface BookingFilters {
  category: BookingCategory | 'all';
  status: BookingStatus | 'all';
  city: string | 'all';
  owner: string | 'all';
  from: string | null;
  to: string | null;
  query: string;
}

export const EMPTY_BOOKING_FILTERS: BookingFilters = {
  category: 'all',
  status: 'all',
  city: 'all',
  owner: 'all',
  from: null,
  to: null,
  query: '',
};

/**
 * §3A.9: the filters the list offers, and the same set the export uses — an
 * export writes exactly the rows its filters show (§3A.14).
 */
export function filterBookings(rows: AdminBookingRow[], filters: BookingFilters): AdminBookingRow[] {
  const needle = filters.query.trim().toLowerCase();
  const digits = needle.replace(/[\s-]/g, '');
  return rows.filter((row) => {
    if (filters.category !== 'all' && row.category !== filters.category) return false;
    if (filters.status !== 'all' && row.status !== filters.status) return false;
    if (filters.city !== 'all' && row.city_id !== filters.city) return false;
    if (filters.owner !== 'all' && row.owner_id !== filters.owner) return false;
    if (filters.from && row.start_date < filters.from) return false;
    if (filters.to && row.start_date > filters.to) return false;
    if (!needle) return true;
    const haystack = `${row.code} ${row.traveler_name} ${row.listing_name}`.toLowerCase();
    if (haystack.includes(needle)) return true;
    return digits.length > 0 && row.traveler_phone.replace(/[\s-]/g, '').includes(digits);
  });
}

/**
 * §6.1: a status move, with the reason and the actor recorded as an event. The
 * caller has already checked `bookingCanFollow()`; this function only writes.
 */
export function moveBooking(
  row: AdminBookingRow,
  status: BookingStatus,
  by: string,
  now = new Date(),
  note = '',
): AdminBookingRow {
  return {
    ...row,
    status,
    note: note.trim() ? note.trim() : row.note,
    paid_at: status === 'paid' ? now.toISOString() : row.paid_at,
    payment_method: status === 'paid' ? (row.payment_method ?? 'cash') : row.payment_method,
    events: [...row.events, { at: now.toISOString(), status, by, ...(note.trim() ? { note: note.trim() } : {}) }],
  };
}

/** §6.2: recording a payment also snapshots the commission, which never moves again. */
export function recordBookingPayment(
  row: AdminBookingRow,
  method: PaymentMethod,
  by: string,
  now = new Date(),
): AdminBookingRow {
  const next = moveBooking(row, 'paid', by, now);
  return { ...next, payment_method: method, paid_at: now.toISOString() };
}

/**
 * §3A.9's summary strip. Gross and commission count only rows that are paid or
 * completed, so the figure here and the Overview's revenue agree (§3A.16
 * criterion 3); `value` is the whole filtered list, which is what the traveler
 * asked for, paid or not.
 */
export function bookingSummary(rows: AdminBookingRow[]): {
  total: number;
  paid: number;
  requested: number;
  gross: number;
  commission: number;
  value: number;
} {
  const settled = rows.filter((row) => row.status === 'paid' || row.status === 'completed');
  const round = (value: number) => Math.round(value * 100) / 100;
  return {
    total: rows.length,
    paid: settled.length,
    requested: rows.filter((row) => row.status === 'requested').length,
    gross: round(settled.reduce((sum, row) => sum + row.total_usd, 0)),
    commission: round(settled.reduce((sum, row) => sum + row.commission_usd, 0)),
    value: round(rows.reduce((sum, row) => sum + row.total_usd, 0)),
  };
}

/** The cities and owners the filter offers, taken from the rows themselves. */
export function bookingFacets(rows: AdminBookingRow[]): { cities: string[]; owners: string[] } {
  return {
    cities: [...new Set(rows.map((row) => row.city_id))].sort(),
    owners: [...new Set(rows.map((row) => row.owner_id).filter((id): id is string => id !== null))].sort(),
  };
}

/** §3A.9 payments view: one ledger row per booking, keyed by the day it paid. */
export interface PaymentLedgerRow {
  id: string;
  day: string;
  kind: 'booking' | 'rental' | 'commission' | 'subscription' | 'template' | 'ad' | 'guide';
  reference: string;
  owner: string;
  gross_usd: number;
  commission_usd: number;
  net_usd: number;
}

export const PAYMENT_KINDS: PaymentLedgerRow['kind'][] = [
  'booking',
  'rental',
  'commission',
  'subscription',
  'template',
  'ad',
  'guide',
];

/** Only a paid booking is money; everything else is a promise. */
export function ledgerFromBookings(rows: AdminBookingRow[]): PaymentLedgerRow[] {
  return rows
    .filter((row) => row.status === 'paid' || row.status === 'completed')
    .map((row) => ({
      id: `led-${row.id}`,
      day: row.paid_at ? myanmarDay(row.paid_at) : row.start_date,
      kind: row.category === 'rental' ? 'rental' : 'booking',
      reference: row.code,
      owner: row.owner_id ?? 'MH Travel',
      gross_usd: row.total_usd,
      commission_usd: row.commission_usd,
      net_usd: Math.round((row.total_usd - row.commission_usd) * 100) / 100,
    }));
}

/**
 * §3A.9: "totals per day that must equal the sum of the ledger entries" — this
 * is that check, so a screen can show the reconciliation line per day.
 */
export function ledgerTotalsByDay(rows: PaymentLedgerRow[]): { day: string; gross: number; commission: number; net: number }[] {
  const byDay = new Map<string, { day: string; gross: number; commission: number; net: number }>();
  for (const row of rows) {
    const entry = byDay.get(row.day) ?? { day: row.day, gross: 0, commission: 0, net: 0 };
    entry.gross += row.gross_usd;
    entry.commission += row.commission_usd;
    entry.net += row.net_usd;
    byDay.set(row.day, entry);
  }
  return [...byDay.values()]
    .map((entry) => ({
      ...entry,
      gross: Math.round(entry.gross * 100) / 100,
      commission: Math.round(entry.commission * 100) / 100,
      net: Math.round(entry.net * 100) / 100,
    }))
    .sort((a, b) => b.day.localeCompare(a.day));
}

/** True when the day's gross equals commission plus net, to the cent. */
export function ledgerDayReconciles(entry: { gross: number; commission: number; net: number }): boolean {
  return Math.abs(entry.gross - (entry.commission + entry.net)) < 0.005;
}
