import { describe, expect, it } from 'vitest';
import {
  buildRentalReport,
  medianAcceptHours,
  myanmarDay,
  ordersToCsv,
  paidConversion,
  settledValue,
  tallyByCity,
  tallyByDay,
  tallyByStatus,
} from './rentalReports';
import type { RentalOrder } from './rentalOrders';

function order(overrides: Partial<RentalOrder> = {}): RentalOrder {
  return {
    id: 'o1',
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
    createdAt: '2026-11-20T03:00:00.000Z',
    updatedAt: '2026-11-20T03:00:00.000Z',
    events: [],
    ...overrides,
  };
}

describe('Myanmar Time day bucketing', () => {
  it('moves an instant past midnight UTC+6:30 into the next day', () => {
    expect(myanmarDay('2026-11-20T03:00:00.000Z')).toBe('2026-11-20');
    // 18:00Z is 00:30 the next day in Myanmar.
    expect(myanmarDay('2026-11-20T18:00:00.000Z')).toBe('2026-11-21');
  });

  it('keeps an instant just before the Myanmar midnight on the same day', () => {
    expect(myanmarDay('2026-11-20T17:29:00.000Z')).toBe('2026-11-20');
    expect(myanmarDay('2026-11-20T17:31:00.000Z')).toBe('2026-11-21');
  });
});

describe('status and grouping tallies', () => {
  it('reports every status, including the ones with no orders', () => {
    const rows = tallyByStatus([order(), order({ id: 'o2', status: 'paid', totalUsd: 24 })]);
    expect(rows.find((row) => row.status === 'requested')).toEqual({ status: 'requested', count: 1, totalUsd: 16 });
    expect(rows.find((row) => row.status === 'paid')).toEqual({ status: 'paid', count: 1, totalUsd: 24 });
    expect(rows.find((row) => row.status === 'completed')).toEqual({ status: 'completed', count: 0, totalUsd: 0 });
  });

  it('groups by city, most orders first', () => {
    const rows = tallyByCity([
      order({ id: 'a', cityId: 'bagan' }),
      order({ id: 'b', cityId: 'yangon' }),
      order({ id: 'c', cityId: 'yangon', totalUsd: 10 }),
    ]);
    expect(rows).toEqual([
      { key: 'yangon', count: 2, totalUsd: 26 },
      { key: 'bagan', count: 1, totalUsd: 16 },
    ]);
  });

  it('groups by Myanmar day, oldest first', () => {
    const rows = tallyByDay([
      order({ id: 'a', createdAt: '2026-11-21T03:00:00.000Z' }),
      order({ id: 'b', createdAt: '2026-11-20T03:00:00.000Z' }),
      order({ id: 'c', createdAt: '2026-11-20T20:00:00.000Z' }),
    ]);
    expect(rows.map((row) => row.key)).toEqual(['2026-11-20', '2026-11-21']);
    // 20:00Z is already 02:30 the next day in Myanmar, so it joins 21 November.
    expect(rows[0].count).toBe(1);
    expect(rows[1].count).toBe(2);
  });
});

describe('conversion, speed and settled value', () => {
  it('counts a completed order as paid, because it was paid first', () => {
    const result = paidConversion([
      order({ id: 'a', status: 'paid' }),
      order({ id: 'b', status: 'completed' }),
      order({ id: 'c', status: 'cancelled' }),
      order({ id: 'd', status: 'requested' }),
    ]);
    expect(result).toEqual({ requested: 4, paid: 2, ratio: 0.5 });
  });

  it('returns a zero ratio for an empty list instead of dividing by zero', () => {
    expect(paidConversion([])).toEqual({ requested: 0, paid: 0, ratio: 0 });
  });

  it('takes the median of the accepted spans, ignoring unaccepted orders', () => {
    const hours = medianAcceptHours([
      order({ id: 'a', createdAt: '2026-11-20T00:00:00.000Z', acceptedAt: '2026-11-20T02:00:00.000Z' }),
      order({ id: 'b', createdAt: '2026-11-20T00:00:00.000Z', acceptedAt: '2026-11-20T04:00:00.000Z' }),
      order({ id: 'c', createdAt: '2026-11-20T00:00:00.000Z', acceptedAt: '2026-11-20T09:00:00.000Z' }),
      order({ id: 'd' }),
    ]);
    expect(hours).toBe(4);
  });

  it('returns null when no order was accepted', () => {
    expect(medianAcceptHours([order()])).toBeNull();
  });

  it('values only Paid and Completed orders, at each order own rate', () => {
    const result = settledValue([
      order({ id: 'a', status: 'paid', totalUsd: 100, fxMmkPerUsd: 4500 }),
      order({ id: 'b', status: 'completed', totalUsd: 50, fxMmkPerUsd: 4000 }),
      order({ id: 'c', status: 'requested', totalUsd: 999 }),
    ]);
    expect(result).toEqual({ usd: 150, mmk: 650000 });
  });

  it('builds one report object from the whole order list', () => {
    const report = buildRentalReport([order({ status: 'paid', acceptedAt: '2026-11-20T05:00:00.000Z' })]);
    expect(report.statuses.length).toBe(6);
    expect(report.cities).toEqual([{ key: 'yangon', count: 1, totalUsd: 16 }]);
    expect(report.conversion.ratio).toBe(1);
    expect(report.medianAcceptHours).toBe(2);
    expect(report.settled.usd).toBe(16);
  });
});

describe('CSV export', () => {
  it('writes a header and one line per order', () => {
    const csv = ordersToCsv([order(), order({ id: 'o2', requestCode: 'RNT-261120-0002' })]);
    const lines = csv.split('\n');
    expect(lines.length).toBe(3);
    expect(lines[0].startsWith('request_code,created_at,status')).toBe(true);
    expect(lines[1].startsWith('RNT-261120-0001,')).toBe(true);
  });

  it('quotes a name holding a comma and doubles an inner quote', () => {
    const csv = ordersToCsv([order({ customerName: 'Aung, "A A"' })]);
    expect(csv.split('\n')[1]).toContain('"Aung, ""A A"""');
  });

  it('leaves an absent variant and payment method empty rather than printing null', () => {
    const csv = ordersToCsv([order()]);
    const cells = csv.split('\n')[1].split(',');
    expect(cells).not.toContain('null');
  });
});
