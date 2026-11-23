import { describe, expect, it } from 'vitest';
import {
  expireOverdueOrders,
  markPaid,
  nextStatuses,
  ordersForUser,
  PAYMENT_WINDOW_HOURS,
  paymentDeadlineFor,
  paymentTimeLeft,
  rentalRequestCode,
  rescheduleOrder,
  statusCanFollow,
  type RentalOrder,
} from './rentalOrders';

function baseOrder(overrides: Partial<RentalOrder> = {}): RentalOrder {
  return {
    id: '1-1',
    requestCode: 'RNT-261120-0001',
    userId: 'traveler-1',
    customerName: 'Aung Aung',
    phone: '+959123456789',
    cityId: 'yangon',
    categoryId: 'bicycle',
    variantId: null,
    startDate: '2026-12-01',
    endDate: '2026-12-02',
    originalStartDate: '2026-12-01',
    days: 2,
    participants: 1,
    customerType: 'citizen',
    fulfillment: 'branch',
    branchId: 'yangon-downtown',
    deliveryAddress: '',
    specialRequests: '',
    termsVersion: '2026-11-22',
    rateUsd: 8,
    totalUsd: 16,
    displayCurrency: 'MMK',
    fxMmkPerUsd: 4500,
    status: 'requested',
    acceptedAt: null,
    paymentDeadline: null,
    paymentMethod: null,
    paymentReceivedAt: null,
    voucherVersion: 0,
    rescheduledCount: 0,
    adminNote: '',
    createdAt: '2026-11-20T09:00:00.000Z',
    updatedAt: '2026-11-20T09:00:00.000Z',
    events: [],
    ...overrides,
  };
}

describe('request code', () => {
  it('formats as RNT-YYMMDD-####', () => {
    expect(rentalRequestCode(new Date(2026, 10, 20), 1)).toBe('RNT-261120-0001');
    expect(rentalRequestCode(new Date(2026, 0, 5), 42)).toBe('RNT-260105-0042');
  });

  it('never drops below sequence 1', () => {
    expect(rentalRequestCode(new Date(2026, 10, 20), 0)).toBe('RNT-261120-0001');
  });
});

describe('order lifecycle', () => {
  it('allows only the Plan §8.5 transitions', () => {
    expect(statusCanFollow('requested', 'accepted')).toBe(true);
    expect(statusCanFollow('requested', 'cancelled')).toBe(true);
    expect(statusCanFollow('requested', 'paid')).toBe(false);
    expect(statusCanFollow('accepted', 'paid')).toBe(true);
    expect(statusCanFollow('accepted', 'expired')).toBe(true);
    expect(statusCanFollow('paid', 'completed')).toBe(true);
    expect(statusCanFollow('completed', 'cancelled')).toBe(false);
    expect(statusCanFollow('cancelled', 'accepted')).toBe(false);
  });

  it('offers no next status once terminal', () => {
    expect(nextStatuses('completed')).toEqual([]);
    expect(nextStatuses('expired')).toEqual([]);
    expect(nextStatuses('cancelled')).toEqual([]);
    expect(nextStatuses('requested')).toEqual(['accepted', 'cancelled']);
  });
});

describe('payment window', () => {
  it('is 12 hours after acceptance', () => {
    const acceptedAt = new Date('2026-11-20T09:00:00.000Z');
    const deadline = paymentDeadlineFor(acceptedAt);
    expect(new Date(deadline).getTime() - acceptedAt.getTime()).toBe(PAYMENT_WINDOW_HOURS * 3600000);
  });

  it('reports the time left, and zero once closed', () => {
    const deadline = '2026-11-20T21:00:00.000Z';
    expect(paymentTimeLeft(deadline, new Date('2026-11-20T20:00:00.000Z'))).toBe(3600000);
    expect(paymentTimeLeft(deadline, new Date('2026-11-20T22:00:00.000Z'))).toBe(0);
    expect(paymentTimeLeft(null, new Date())).toBe(0);
  });

  it('expires an unpaid accepted order past the deadline', () => {
    const order = baseOrder({ status: 'accepted', acceptedAt: '2026-11-20T09:00:00.000Z', paymentDeadline: '2026-11-20T21:00:00.000Z' });
    const [expired] = expireOverdueOrders([order], new Date('2026-11-20T22:00:00.000Z'));
    expect(expired.status).toBe('expired');
    expect(expired.events[expired.events.length - 1]).toMatchObject({ from: 'accepted', to: 'expired', actor: 'system' });
  });

  it('leaves an order inside its window alone', () => {
    const order = baseOrder({ status: 'accepted', paymentDeadline: '2026-11-20T21:00:00.000Z' });
    const orders = [order];
    expect(expireOverdueOrders(orders, new Date('2026-11-20T20:00:00.000Z'))).toBe(orders);
  });

  it('is safe to run twice', () => {
    const order = baseOrder({ status: 'accepted', paymentDeadline: '2026-11-20T21:00:00.000Z' });
    const now = new Date('2026-11-20T22:00:00.000Z');
    const once = expireOverdueOrders([order], now);
    const twice = expireOverdueOrders(once, now);
    expect(twice).toBe(once);
    expect(twice[0].events).toHaveLength(1);
  });
});

describe('reschedule', () => {
  const now = new Date('2026-11-20T09:00:00.000Z');

  it('moves a paid order once, keeping the same number of days', () => {
    const order = baseOrder({ status: 'paid', startDate: '2026-12-01', endDate: '2026-12-03', days: 3 });
    const result = rescheduleOrder(order, '2026-12-10', now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.startDate).toBe('2026-12-10');
    expect(result.order.endDate).toBe('2026-12-12');
    expect(result.order.rescheduledCount).toBe(1);
  });

  it('refuses a second reschedule', () => {
    const order = baseOrder({ status: 'paid', rescheduledCount: 1 });
    expect(rescheduleOrder(order, '2026-12-10', now)).toEqual({ ok: false, reason: 'reschedule_limit' });
  });

  it('refuses an unpaid order', () => {
    expect(rescheduleOrder(baseOrder({ status: 'accepted' }), '2026-12-10', now)).toEqual({ ok: false, reason: 'reschedule_not_paid' });
  });

  it('refuses a change inside the 24-hour notice', () => {
    const order = baseOrder({ status: 'paid', originalStartDate: '2026-11-21', startDate: '2026-11-21', endDate: '2026-11-22' });
    expect(rescheduleOrder(order, '2026-11-25', now)).toEqual({ ok: false, reason: 'reschedule_too_late' });
  });

  it('refuses a start date that is not at least tomorrow', () => {
    const order = baseOrder({ status: 'paid' });
    expect(rescheduleOrder(order, '2026-11-20', now)).toEqual({ ok: false, reason: 'reschedule_too_soon' });
  });

  it('refuses a start date that has not changed', () => {
    const order = baseOrder({ status: 'paid', startDate: '2026-12-01' });
    expect(rescheduleOrder(order, '2026-12-01', now)).toEqual({ ok: false, reason: 'reschedule_unchanged' });
  });
});

describe('per-account visibility', () => {
  it('shows a traveler only their own orders', () => {
    const mine = baseOrder({ id: 'a', userId: 'traveler-1', createdAt: '2026-11-20T09:00:00.000Z' });
    const theirs = baseOrder({ id: 'b', userId: 'traveler-2', createdAt: '2026-11-20T10:00:00.000Z' });
    expect(ordersForUser([mine, theirs], 'traveler-1').map((order) => order.id)).toEqual(['a']);
    expect(ordersForUser([mine, theirs], null)).toEqual([]);
  });

  it('sorts newest first', () => {
    const older = baseOrder({ id: 'a', createdAt: '2026-11-20T09:00:00.000Z' });
    const newer = baseOrder({ id: 'b', createdAt: '2026-11-20T10:00:00.000Z' });
    expect(ordersForUser([older, newer], 'traveler-1').map((order) => order.id)).toEqual(['b', 'a']);
  });
});

describe('voucher version', () => {
  const now = new Date('2026-11-20T09:00:00.000Z');

  it('issues version 1 when payment is recorded', () => {
    const order = baseOrder({ status: 'accepted' });
    const paid = markPaid(order, 'cash', now);
    expect(paid?.voucherVersion).toBe(1);
  });

  it('issues the next version after a reschedule', () => {
    const paid = markPaid(baseOrder({ status: 'accepted' }), 'cash', now);
    expect(paid).not.toBeNull();
    const result = rescheduleOrder({ ...paid!, voucherVersion: 1 }, '2026-12-05', now);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.order.voucherVersion).toBe(2);
  });
});
