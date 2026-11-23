import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './auth';
import type { AdminRole } from './adminRoles';
import { isSupabaseConfigured, supabase } from './supabase';
import type { RentalCatalog } from '../data/rentalCatalog';
import { readRentalCatalog } from './rentalCatalogStore';
import {
  quoteRentalOrder,
  RENTAL_SUBMIT_LIMIT_PER_HOUR,
  validateRentalOrder,
  type RentalOrderErrorCode,
} from './rentalOrderRules';
import { recordOrderAudit } from './rentalAudit';
import { addDaysToDay, myanmarDay, myanmarDayStartMs, myanmarToday } from './myanmarTime';
import {
  appendStaffNotifications,
  appendTravelerNotices,
  noticesForChange,
  staffNotificationFor,
  writeStaffNotifications,
  type RentalNotice,
} from './rentalNotifications';

/**
 * Plan §8.5: a rental order is a record with a lifecycle, not a one-off form
 * submission. The statuses and their transitions are the authority here, so
 * the page, the voucher and the Rental Admin panel cannot disagree about what
 * a status means or what may follow it.
 */

export type RentalOrderStatus =
  | 'requested'
  | 'accepted'
  | 'paid'
  | 'completed'
  | 'expired'
  | 'cancelled';

export const RENTAL_ORDER_STATUSES: RentalOrderStatus[] = [
  'requested',
  'accepted',
  'paid',
  'completed',
  'expired',
  'cancelled',
];

/** Plan §8.5: a terminal status has no next status. */
export const TERMINAL_STATUSES: RentalOrderStatus[] = ['completed', 'expired', 'cancelled'];

/** Plan §8.5: Accepted opens a 12-hour window in which the traveler must pay. */
export const PAYMENT_WINDOW_HOURS = 12;

/** Plan §8.5: reschedule once, at least 24 hours before the original start. */
export const RESCHEDULE_NOTICE_HOURS = 24;
export const RESCHEDULE_LIMIT = 1;

export type RentalFulfillment = 'delivery' | 'branch';

export type RentalPaymentMethod = 'cash' | 'bank_transfer' | 'mobile_wallet';

/**
 * Plan §16: a travel guide's lodging, food and travel costs are charged on top
 * of the daily rate, so they are rows on the order rather than a bigger rate.
 */
export type RentalOrderExtra = {
  id: string;
  description: string;
  amountUsd: number;
  addedBy: string;
  at: string;
};

export type RentalOrderEvent = {
  at: string;
  from: RentalOrderStatus | null;
  to: RentalOrderStatus;
  actor: 'traveler' | 'staff' | 'system';
  note: string;
};

export type RentalOrder = {
  id: string;
  requestCode: string;
  userId: string;
  customerName: string;
  phone: string;
  cityId: string;
  categoryId: string;
  variantId: string | null;
  startDate: string;
  endDate: string;
  originalStartDate: string;
  days: number;
  participants: number;
  customerType: 'citizen' | 'foreigner';
  fulfillment: RentalFulfillment;
  branchId: string | null;
  deliveryAddress: string;
  specialRequests: string;
  termsVersion: string;
  /** Snapshotted at submission, so a later rate change never rewrites this order. */
  rateUsd: number;
  totalUsd: number;
  displayCurrency: 'MMK' | 'USD';
  fxMmkPerUsd: number;
  status: RentalOrderStatus;
  acceptedAt: string | null;
  paymentDeadline: string | null;
  paymentMethod: RentalPaymentMethod | null;
  paymentReceivedAt: string | null;
  /** Plan §8.5: recording payment issues the voucher; a reschedule issues the next version. */
  voucherVersion: number;
  rescheduledCount: number;
  adminNote: string;
  extras: RentalOrderExtra[];
  createdAt: string;
  updatedAt: string;
  events: RentalOrderEvent[];
};

export type CreateOrderResult =
  | { ok: true; order: RentalOrder }
  | { ok: false; code: RentalOrderErrorCode };

export const RENTAL_HOURLY_SUBMIT_LIMIT = RENTAL_SUBMIT_LIMIT_PER_HOUR;

export type RentalOrderInput = Omit<
  RentalOrder,
  | 'id'
  | 'requestCode'
  | 'status'
  | 'acceptedAt'
  | 'paymentDeadline'
  | 'paymentMethod'
  | 'paymentReceivedAt'
  | 'voucherVersion'
  | 'rescheduledCount'
  | 'adminNote'
  | 'extras'
  | 'createdAt'
  | 'updatedAt'
  | 'events'
>;

/**
 * Plan §8.3: staff read every order, a traveler reads only their own. The
 * browser has one record set and filters it by `userId`, which mirrors the RLS
 * split without needing two stores.
 */
const STORAGE_KEY = 'mh-travel-rental-orders';
const CHANGED_EVENT = 'mh-travel-rental-orders-changed';
const TABLE = 'rental_orders';

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}

/** Plan §8.12 acceptance 1: `RNT-YYMMDD-####`, stamped in Myanmar Time. */
export function rentalRequestCode(at: Date, sequence: number): string {
  const stamp = myanmarDay(at.toISOString()).replace(/-/g, '').slice(2);
  return `RNT-${stamp}-${pad(Math.max(1, sequence), 4)}`;
}

export function statusCanFollow(from: RentalOrderStatus, to: RentalOrderStatus): boolean {
  const allowed: Record<RentalOrderStatus, RentalOrderStatus[]> = {
    requested: ['accepted', 'cancelled'],
    accepted: ['paid', 'expired', 'cancelled'],
    paid: ['completed', 'cancelled'],
    completed: [],
    expired: [],
    cancelled: [],
  };
  return allowed[from].includes(to);
}

export function nextStatuses(from: RentalOrderStatus): RentalOrderStatus[] {
  return RENTAL_ORDER_STATUSES.filter((status) => statusCanFollow(from, status));
}

export function isTerminal(status: RentalOrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Plan §8.5: `payment_deadline = accepted_at + 12 hours`. */
export function paymentDeadlineFor(acceptedAt: Date): string {
  return new Date(acceptedAt.getTime() + PAYMENT_WINDOW_HOURS * 3600000).toISOString();
}

/** Whole milliseconds left, or 0 once the window has closed. */
export function paymentTimeLeft(deadline: string | null, now: Date): number {
  if (!deadline) return 0;
  return Math.max(0, new Date(deadline).getTime() - now.getTime());
}

/**
 * Plan §8.9: the 5-minute job moves an unpaid Accepted order to Expired. It is
 * safe to run twice because a second pass finds nothing to change.
 */
export function expireOverdueOrders(orders: RentalOrder[], now: Date): RentalOrder[] {
  let changed = false;
  const next = orders.map((order) => {
    if (order.status !== 'accepted' || !order.paymentDeadline) return order;
    if (paymentTimeLeft(order.paymentDeadline, now) > 0) return order;
    changed = true;
    return {
      ...order,
      status: 'expired' as RentalOrderStatus,
      updatedAt: now.toISOString(),
      events: [...order.events, { at: now.toISOString(), from: 'accepted' as RentalOrderStatus, to: 'expired' as RentalOrderStatus, actor: 'system' as const, note: 'payment_window_passed' }],
    };
  });
  return changed ? next : orders;
}

export type RescheduleResult = { ok: true; order: RentalOrder } | { ok: false; reason: string };

/**
 * Plan §8.5: after payment the traveler may move the date once, at least 24
 * hours before the original start, keeping the same number of days.
 */
export function rescheduleOrder(order: RentalOrder, nextStartDate: string, now: Date): RescheduleResult {
  if (order.status !== 'paid') return { ok: false, reason: 'reschedule_not_paid' };
  if (order.rescheduledCount >= RESCHEDULE_LIMIT) return { ok: false, reason: 'reschedule_limit' };
  // Plan §8.5: the notice is counted to the start of the rental day in Myanmar
  // Time, which is what `original_start_date - interval '24 hours'` means on
  // the server. A local-midnight parse would move the boundary with the browser.
  const noticeMs = RESCHEDULE_NOTICE_HOURS * 3600000;
  if (myanmarDayStartMs(order.originalStartDate) - now.getTime() < noticeMs) {
    return { ok: false, reason: 'reschedule_too_late' };
  }
  const tomorrow = addDaysToDay(myanmarToday(now), 1);
  if (nextStartDate < tomorrow) return { ok: false, reason: 'reschedule_too_soon' };
  if (nextStartDate === order.startDate) return { ok: false, reason: 'reschedule_unchanged' };

  const nextEnd = addDaysToDay(nextStartDate, order.days - 1);
  return {
    ok: true,
    order: {
      ...order,
      startDate: nextStartDate,
      endDate: nextEnd,
      rescheduledCount: order.rescheduledCount + 1,
      voucherVersion: Math.max(1, order.voucherVersion) + 1,
      updatedAt: now.toISOString(),
      events: [...order.events, { at: now.toISOString(), from: order.status, to: order.status, actor: 'traveler' as const, note: `rescheduled:${order.startDate}->${nextStartDate}` }],
    },
  };
}

/** Newest first, so the dashboard opens on the order just made. */
export function sortOrders(orders: RentalOrder[]): RentalOrder[] {
  return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}

export function ordersForUser(orders: RentalOrder[], userId: string | null): RentalOrder[] {
  if (!userId) return [];
  return sortOrders(orders.filter((order) => order.userId === userId));
}

/**
 * Plan §8.5: recording payment issues the voucher, so the version becomes 1
 * (or stays where a reschedule already put it).
 */
export function markPaid(
  order: RentalOrder,
  method: RentalPaymentMethod,
  now: Date,
  note = '',
): RentalOrder | null {
  if (!statusCanFollow(order.status, 'paid')) return null;
  return {
    ...order,
    status: 'paid',
    paymentMethod: method,
    paymentReceivedAt: now.toISOString(),
    voucherVersion: Math.max(1, order.voucherVersion),
    updatedAt: now.toISOString(),
    events: [...order.events, { at: now.toISOString(), from: order.status, to: 'paid', actor: 'staff', note: note || method }],
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** The extras charged on top of the daily rate. */
export function extrasTotalUsd(order: RentalOrder): number {
  return round2((order.extras ?? []).reduce((sum, extra) => sum + extra.amountUsd, 0));
}

/** Daily rate plus extras, which is what the traveler actually owes. */
export function orderTotalUsd(order: RentalOrder): number {
  return round2(order.totalUsd + extrasTotalUsd(order));
}

/**
 * Plan §16: after the rental, staff record the guide's actual costs. The
 * traveler owes the new total, so the change is appended to the timeline.
 */
export function addRentalExtra(
  order: RentalOrder,
  input: { description: string; amountUsd: number },
  addedBy: string,
  now: Date,
): RentalOrder {
  const description = input.description.trim();
  const amountUsd = round2(input.amountUsd);
  const extra: RentalOrderExtra = {
    id: `extra-${now.getTime()}-${(order.extras?.length ?? 0) + 1}`,
    description,
    amountUsd,
    addedBy,
    at: now.toISOString(),
  };
  return {
    ...order,
    extras: [...(order.extras ?? []), extra],
    updatedAt: now.toISOString(),
    events: [...order.events, { at: now.toISOString(), from: order.status, to: order.status, actor: 'staff' as const, note: `extra:${description}:${amountUsd}` }],
  };
}

export function findOrderByCode(orders: RentalOrder[], requestCode: string): RentalOrder | undefined {
  return orders.find((order) => order.requestCode === requestCode);
}

/**
 * Plan §8.6: "staff open the same page to print it". Rental Admin, Admin and
 * Payment Admin handle orders, so they read every voucher; a traveler reads
 * only their own, and a signed-out visitor reads none.
 */
export function canReadAllOrders(role: AdminRole | undefined, isSuperAdmin: boolean): boolean {
  return isSuperAdmin || role === 'Rental Admin' || role === 'Admin' || role === 'Payment Admin';
}

/**
 * Plan §8.12 acceptance 5: the voucher lookup. Staff read every order, a
 * traveler reads only their own, so a guessed `/account/bookings/<code>` URL
 * cannot reveal somebody else's booking.
 */
export function orderForViewer(
  allOrders: RentalOrder[],
  viewer: { userId: string | null; isStaff: boolean },
  requestCode: string,
): RentalOrder | undefined {
  const scoped = viewer.isStaff ? allOrders : ordersForUser(allOrders, viewer.userId);
  return findOrderByCode(scoped, requestCode);
}

async function persistRemote(order: RentalOrder) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from(TABLE).insert({
      request_code: order.requestCode,
      user_id: order.userId,
      customer_name: order.customerName,
      phone: order.phone,
      city_id: order.cityId,
      category_id: order.categoryId,
      variant_id: order.variantId,
      start_date: order.startDate,
      end_date: order.endDate,
      days: order.days,
      participants: order.participants,
      customer_type: order.customerType,
      fulfillment: order.fulfillment,
      branch_id: order.branchId,
      delivery_address: order.deliveryAddress,
      special_requests: order.specialRequests,
      terms_version: order.termsVersion,
      rate_usd: order.rateUsd,
      total_usd: order.totalUsd,
      display_currency: order.displayCurrency,
      fx_mmk_per_usd: order.fxMmkPerUsd,
      status: order.status,
    });
  } catch {
    // The local order already exists; a failed insert only means the back
    // office has not seen it yet, and the traveler must not lose the record.
  }
}

/** An order saved before `voucherVersion` or `extras` existed still opens and prints. */
function normalizeOrder(order: RentalOrder): RentalOrder {
  const withExtras = Array.isArray(order.extras) ? order : { ...order, extras: [] };
  if (typeof order.voucherVersion === 'number') return withExtras;
  return { ...withExtras, voucherVersion: order.paymentReceivedAt ? 1 : 0 };
}

export function readAllOrders(): RentalOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RentalOrder[]).map(normalizeOrder) : [];
  } catch {
    return [];
  }
}

export function writeAllOrders(orders: RentalOrder[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

/**
 * Plan §8.9: hands one change to the people who need it. Staff notices go to
 * the admin bell, traveler notices to the traveler's own scope, so one
 * account's notices never show up under the next account's badge.
 */
export function deliverRentalNotices(order: RentalOrder, kind: RentalNotice['kind'], at: Date, before = ''): void {
  if (typeof window === 'undefined') return;
  const notices = noticesForChange(order, kind, at);
  const staffNotices = notices.filter((notice) => notice.audience === 'staff');
  if (staffNotices.length > 0) {
    writeStaffNotifications(appendStaffNotifications(staffNotices.map((notice) => staffNotificationFor(notice, order))));
  }
  const travelerNotices = notices.filter((notice) => notice.audience === 'traveler');
  if (travelerNotices.length > 0) appendTravelerNotices(order.userId, travelerNotices);
  // Requested and extra are not status changes, and each already writes its
  // own audit row where the change is made.
  if (kind !== 'requested' && kind !== 'extra') {
    const field = kind === 'rescheduled' ? 'startDate' : 'status';
    recordOrderAudit(order.requestCode, field, before, kind === 'rescheduled' ? order.startDate : kind, 'staff', at);
  }
}

/**
 * Plan §8.9: the expiry job. Returns how many orders it moved, so a caller can
 * stay quiet when there was nothing to do.
 */
export function expireOverdueNow(now = new Date()): number {
  if (typeof window === 'undefined') return 0;
  const current = readAllOrders();
  const next = expireOverdueOrders(current, now);
  if (next === current) return 0;
  writeAllOrders(next);
  let expired = 0;
  for (const order of next) {
    const before = current.find((item) => item.id === order.id);
    if (before && before.status !== 'expired' && order.status === 'expired') {
      expired += 1;
      deliverRentalNotices(order, 'expired', now, before.status);
    }
  }
  return expired;
}

export const RENTAL_EXPIRY_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Runs the expiry check on the Plan's 5-minute cadence while the app is open,
 * and once on mount so a tab left overnight catches up as soon as it loads.
 * A browser cannot wake itself up, so the real schedule belongs to the server
 * job once orders move into the tables.
 */
export function useRentalExpiryJob(intervalMs = RENTAL_EXPIRY_INTERVAL_MS): void {
  useEffect(() => {
    expireOverdueNow();
    const timer = window.setInterval(() => expireOverdueNow(), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
}

/**
 * Plan §8.7: the client's total is ignored. The draft is re-checked against the
 * same rules the server runs, and the stored total is recomputed from the
 * catalog, so a tampered form cannot create a cheap order.
 */
export function buildRentalOrder(
  input: RentalOrderInput,
  catalog: RentalCatalog,
  existing: RentalOrder[],
  now: Date,
): CreateOrderResult {
  const hourAgo = now.getTime() - 3600000;
  const check = validateRentalOrder(
    {
      cityId: input.cityId,
      categoryId: input.categoryId,
      variantId: input.variantId,
      startDate: input.startDate,
      endDate: input.endDate,
      participants: input.participants,
      customerType: input.customerType,
      fulfillment: input.fulfillment,
      branchId: input.branchId,
      deliveryAddress: input.deliveryAddress,
      customerName: input.customerName,
      phone: input.phone,
      termsVersion: input.termsVersion,
    },
    {
      catalog,
      recentSubmissions: existing.filter(
        (order) => order.userId === input.userId && new Date(order.createdAt).getTime() > hourAgo,
      ).length,
      now,
    },
  );
  if (!check.ok) return check;
  const quote = quoteRentalOrder(input, catalog);
  // The sequence counts today's orders in Myanmar Time, the same day the code
  // is stamped with, so the two never disagree near midnight UTC.
  const day = myanmarToday(now);
  return {
    ok: true,
    order: {
      ...input,
      rateUsd: quote.rateUsd,
      totalUsd: quote.totalUsd,
      days: quote.days,
      id: `${now.getTime()}-${existing.length + 1}`,
      requestCode: rentalRequestCode(
        now,
        existing.filter((order) => myanmarDay(order.createdAt) === day).length + 1,
      ),
      status: 'requested',
      acceptedAt: null,
      paymentDeadline: null,
      paymentMethod: null,
      paymentReceivedAt: null,
      voucherVersion: 0,
      rescheduledCount: 0,
      adminNote: '',
      extras: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      events: [{ at: now.toISOString(), from: null, to: 'requested', actor: 'traveler', note: 'submitted' }],
    },
  };
}

export function useRentalOrders() {
  const { user } = useAuth();
  const owner = user?.id ?? null;
  const [allOrders, setAllOrders] = useState<RentalOrder[]>(readAllOrders);

  useEffect(() => {
    const sync = () => setAllOrders(readAllOrders());
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const write = useCallback((next: RentalOrder[]) => {
    writeAllOrders(next);
    setAllOrders(next);
  }, []);

  const createOrder = useCallback((input: RentalOrderInput): CreateOrderResult => {
    const current = readAllOrders();
    const now = new Date();
    const built = buildRentalOrder(input, readRentalCatalog(), current, now);
    if (!built.ok) return built;
    const order = built.order;
    write([...current, order]);
    if (owner) void persistRemote(order);
    deliverRentalNotices(order, 'requested', now);
    return { ok: true, order };
  }, [owner, write]);

  /** Staff action: move one order to a status the lifecycle allows. */
  const setStatus = useCallback((orderId: string, to: RentalOrderStatus, note = '', actor: RentalOrderEvent['actor'] = 'staff') => {
    const current = readAllOrders();
    const target = current.find((order) => order.id === orderId);
    if (!target || !statusCanFollow(target.status, to)) return null;
    const now = new Date();
    const updated: RentalOrder = {
      ...target,
      status: to,
      updatedAt: now.toISOString(),
      acceptedAt: to === 'accepted' ? now.toISOString() : target.acceptedAt,
      paymentDeadline: to === 'accepted' ? paymentDeadlineFor(now) : target.paymentDeadline,
      paymentReceivedAt: to === 'paid' ? now.toISOString() : target.paymentReceivedAt,
      voucherVersion: to === 'paid' ? Math.max(1, target.voucherVersion) : target.voucherVersion,
      events: [...target.events, { at: now.toISOString(), from: target.status, to, actor, note }],
    };
    write(current.map((order) => (order.id === orderId ? updated : order)));
    deliverRentalNotices(updated, to, now, target.status);
    return updated;
  }, [write]);

  const recordPayment = useCallback((orderId: string, method: RentalPaymentMethod, note = '') => {
    const current = readAllOrders();
    const target = current.find((order) => order.id === orderId);
    if (!target) return null;
    const now = new Date();
    const updated = markPaid(target, method, now, note);
    if (!updated) return null;
    write(current.map((order) => (order.id === orderId ? updated : order)));
    deliverRentalNotices(updated, 'paid', now, target.status);
    return updated;
  }, [write]);

  const reschedule = useCallback((orderId: string, nextStartDate: string): RescheduleResult => {
    const current = readAllOrders();
    const target = current.find((order) => order.id === orderId);
    if (!target) return { ok: false, reason: 'order_missing' };
    const now = new Date();
    const result = rescheduleOrder(target, nextStartDate, now);
    if (!result.ok) return result;
    write(current.map((order) => (order.id === orderId ? result.order : order)));
    deliverRentalNotices(result.order, 'rescheduled', now, target.startDate);
    return result;
  }, [write]);

  /** Plan §16: staff add the guide's lodging, food and travel costs after the rental. */
  const addExtra = useCallback((orderId: string, description: string, amountUsd: number, actor: string) => {
    const current = readAllOrders();
    const target = current.find((order) => order.id === orderId);
    if (!target) return null;
    const now = new Date();
    const updated = addRentalExtra(target, { description, amountUsd }, actor, now);
    write(current.map((order) => (order.id === orderId ? updated : order)));
    recordOrderAudit(updated.requestCode, 'extras', String(extrasTotalUsd(target)), String(extrasTotalUsd(updated)), actor, now);
    deliverRentalNotices(updated, 'extra', now);
    return updated;
  }, [write]);

  const noteOrder = useCallback((orderId: string, adminNote: string) => {
    const current = readAllOrders();
    write(current.map((order) => (order.id === orderId ? { ...order, adminNote, updatedAt: new Date().toISOString() } : order)));
  }, [write]);

  const expireOverdue = useCallback(() => {
    expireOverdueNow();
  }, []);

  return {
    /** The signed-in traveler's own orders; staff read `allOrders` instead. */
    orders: ordersForUser(allOrders, owner),
    allOrders: sortOrders(allOrders),
    createOrder,
    setStatus,
    recordPayment,
    reschedule,
    addExtra,
    noteOrder,
    expireOverdue,
  };
}
