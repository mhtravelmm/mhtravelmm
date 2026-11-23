import { beforeEach, describe, expect, it } from 'vitest';
import {
  addRentalExtra,
  expireOverdueNow,
  extrasTotalUsd,
  orderTotalUsd,
  expireOverdueOrders,
  readAllOrders,
  writeAllOrders,
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
import { readTravelerNotices } from './rentalNotifications';
import { readRentalAudit } from './rentalAudit';
import { deliverRentalNotices } from './rentalOrders';

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
    extras: [],
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

describe('the expiry job', () => {
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
      setInterval: () => 0,
      clearInterval: () => undefined,
    };
  }

  beforeEach(() => {
    fakeWindow();
  });

  it('expires an overdue order in storage and reports it', () => {
    const overdue = baseOrder({ status: 'accepted', paymentDeadline: '2026-11-20T21:00:00.000Z' });
    writeAllOrders([overdue]);
    expect(expireOverdueNow(new Date('2026-11-20T22:00:00.000Z'))).toBe(1);
    expect(readAllOrders()[0].status).toBe('expired');
  });

  it('notifies the traveler, who is the one who lost the window', () => {
    const overdue = baseOrder({ status: 'accepted', paymentDeadline: '2026-11-20T21:00:00.000Z' });
    writeAllOrders([overdue]);
    expireOverdueNow(new Date('2026-11-20T22:00:00.000Z'));
    const notices = readTravelerNotices(overdue.userId);
    expect(notices).toHaveLength(1);
    expect(notices[0].kind).toBe('expired');
  });

  it('reports nothing on a second run and does not repeat the notice', () => {
    const overdue = baseOrder({ status: 'accepted', paymentDeadline: '2026-11-20T21:00:00.000Z' });
    writeAllOrders([overdue]);
    const at = new Date('2026-11-20T22:00:00.000Z');
    expect(expireOverdueNow(at)).toBe(1);
    expect(expireOverdueNow(at)).toBe(0);
    expect(readTravelerNotices(overdue.userId)).toHaveLength(1);
  });

  it('leaves a paid order alone however old the deadline is', () => {
    const paid = baseOrder({ status: 'paid', paymentDeadline: '2026-11-20T21:00:00.000Z' });
    writeAllOrders([paid]);
    expect(expireOverdueNow(new Date('2026-11-30T22:00:00.000Z'))).toBe(0);
    expect(readAllOrders()[0].status).toBe('paid');
  });
});

describe('guide costs (Plan §16)', () => {
  it('charges nothing extra until a cost is added', () => {
    const order = baseOrder();
    expect(extrasTotalUsd(order)).toBe(0);
    expect(orderTotalUsd(order)).toBe(16);
  });

  it('adds the cost to the amount due', () => {
    const order = addRentalExtra(baseOrder(), { description: 'Lodging', amountUsd: 30 }, 'guide@mhtravel.com', new Date('2026-11-25T10:00:00.000Z'));
    expect(extrasTotalUsd(order)).toBe(30);
    expect(orderTotalUsd(order)).toBe(46);
  });

  it('keeps each cost as its own row with who added it', () => {
    const once = addRentalExtra(baseOrder(), { description: 'Lodging', amountUsd: 30 }, 'a@mhtravel.com', new Date('2026-11-25T10:00:00.000Z'));
    const twice = addRentalExtra(once, { description: 'Food', amountUsd: 12.5 }, 'b@mhtravel.com', new Date('2026-11-25T11:00:00.000Z'));
    expect(twice.extras).toHaveLength(2);
    expect(twice.extras[1]).toMatchObject({ description: 'Food', amountUsd: 12.5, addedBy: 'b@mhtravel.com' });
    expect(orderTotalUsd(twice)).toBe(58.5);
  });

  it('rounds a fractional cost so the total never drifts', () => {
    const order = addRentalExtra(baseOrder(), { description: 'Fuel', amountUsd: 10.005 }, 'a@mhtravel.com', new Date('2026-11-25T10:00:00.000Z'));
    expect(order.extras[0].amountUsd).toBe(10.01);
  });

  it('records the change on the timeline', () => {
    const order = addRentalExtra(baseOrder(), { description: 'Lodging', amountUsd: 30 }, 'a@mhtravel.com', new Date('2026-11-25T10:00:00.000Z'));
    expect(order.events[order.events.length - 1].note).toBe('extra:Lodging:30');
  });
});

describe('the extra notice and its audit row', () => {
  beforeEach(() => {
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
  });

  it('tells the traveler and logs one row, not a status change', () => {
    const order = baseOrder({ status: 'paid' });
    writeAllOrders([order]);
    const before = readTravelerNotices(order.userId).length;
    const updated = addRentalExtra(order, { description: 'Lodging', amountUsd: 30 }, 'staff@mhtravel.com', new Date('2026-11-25T10:00:00.000Z'));
    writeAllOrders([updated]);
    deliverRentalNotices(updated, 'extra', new Date('2026-11-25T10:00:00.000Z'));
    expect(readTravelerNotices(order.userId).length).toBe(before + 1);
    expect(readTravelerNotices(order.userId)[0].kind).toBe('extra');
    const rows = readRentalAudit().filter((entry) => entry.orderCode === order.requestCode);
    expect(rows).toEqual([]);
  });
});
