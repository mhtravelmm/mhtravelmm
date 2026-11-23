import type { RentalOrder, RentalOrderStatus } from './rentalOrders';
import { RENTAL_ORDER_STATUSES } from './rentalOrders';

/**
 * Plan §8.9: the Rental Admin reports. Everything here is a pure function of
 * the order list so the panel, the CSV export and the tests read the same
 * numbers, and so a report can be recomputed without a server round trip.
 */

/** Myanmar Time is UTC+6:30 all year, so the day boundary is fixed. */
const MYANMAR_OFFSET_MINUTES = 6 * 60 + 30;

/** The calendar day an instant falls on in Myanmar Time, as `YYYY-MM-DD`. */
export function myanmarDay(iso: string): string {
  const shifted = new Date(new Date(iso).getTime() + MYANMAR_OFFSET_MINUTES * 60000);
  return shifted.toISOString().slice(0, 10);
}

export type StatusTally = { status: RentalOrderStatus; count: number; totalUsd: number };

export function tallyByStatus(orders: RentalOrder[]): StatusTally[] {
  return RENTAL_ORDER_STATUSES.map((status) => {
    const rows = orders.filter((order) => order.status === status);
    return {
      status,
      count: rows.length,
      totalUsd: round2(rows.reduce((sum, order) => sum + order.totalUsd, 0)),
    };
  });
}

export type GroupTally = { key: string; count: number; totalUsd: number };

function groupBy(orders: RentalOrder[], keyOf: (order: RentalOrder) => string): GroupTally[] {
  const totals = new Map<string, GroupTally>();
  for (const order of orders) {
    const key = keyOf(order);
    const row = totals.get(key) ?? { key, count: 0, totalUsd: 0 };
    row.count += 1;
    row.totalUsd += order.totalUsd;
    totals.set(key, row);
  }
  return [...totals.values()]
    .map((row) => ({ ...row, totalUsd: round2(row.totalUsd) }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function tallyByCity(orders: RentalOrder[]): GroupTally[] {
  return groupBy(orders, (order) => order.cityId);
}

export function tallyByCategory(orders: RentalOrder[]): GroupTally[] {
  return groupBy(orders, (order) => order.categoryId);
}

/** Orders per Myanmar day, oldest first, so the panel can draw a trend. */
export function tallyByDay(orders: RentalOrder[]): GroupTally[] {
  return groupBy(orders, (order) => myanmarDay(order.createdAt)).sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Plan §8.9: the share of Requested orders that reached Paid. Cancelled and
 * expired orders count against the share, because they were requested and did
 * not pay.
 */
export function paidConversion(orders: RentalOrder[]): { requested: number; paid: number; ratio: number } {
  const requested = orders.length;
  const paid = orders.filter((order) => order.status === 'paid' || order.status === 'completed').length;
  return { requested, paid, ratio: requested === 0 ? 0 : Math.round((paid / requested) * 1000) / 1000 };
}

/** Median hours from Requested to Accepted, over the orders that were accepted. */
export function medianAcceptHours(orders: RentalOrder[]): number | null {
  const spans = orders
    .filter((order) => order.acceptedAt)
    .map((order) => (new Date(order.acceptedAt as string).getTime() - new Date(order.createdAt).getTime()) / 3600000)
    .filter((hours) => hours >= 0)
    .sort((a, b) => a - b);
  if (spans.length === 0) return null;
  const middle = Math.floor(spans.length / 2);
  const median = spans.length % 2 === 0 ? (spans[middle - 1] + spans[middle]) / 2 : spans[middle];
  return Math.round(median * 10) / 10;
}

/**
 * Plan §8.9: value of Paid and Completed orders. MMK uses each order's own
 * snapshotted rate, so a later exchange-rate change never rewrites history.
 */
export function settledValue(orders: RentalOrder[]): { usd: number; mmk: number } {
  const settled = orders.filter((order) => order.status === 'paid' || order.status === 'completed');
  return {
    usd: round2(settled.reduce((sum, order) => sum + order.totalUsd, 0)),
    mmk: Math.round(settled.reduce((sum, order) => sum + order.totalUsd * order.fxMmkPerUsd, 0)),
  };
}

export type RentalReport = {
  statuses: StatusTally[];
  cities: GroupTally[];
  categories: GroupTally[];
  days: GroupTally[];
  conversion: { requested: number; paid: number; ratio: number };
  medianAcceptHours: number | null;
  settled: { usd: number; mmk: number };
};

export function buildRentalReport(orders: RentalOrder[]): RentalReport {
  return {
    statuses: tallyByStatus(orders),
    cities: tallyByCity(orders),
    categories: tallyByCategory(orders),
    days: tallyByDay(orders),
    conversion: paidConversion(orders),
    medianAcceptHours: medianAcceptHours(orders),
    settled: settledValue(orders),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Plan §8.9: the CSV export. Quoting follows RFC 4180 so a comma in a name is safe. */
function csvCell(value: string | number | null): string {
  if (value === null) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const ORDER_CSV_COLUMNS = [
  'request_code',
  'created_at',
  'status',
  'customer_name',
  'phone',
  'city_id',
  'category_id',
  'variant_id',
  'start_date',
  'end_date',
  'days',
  'participants',
  'customer_type',
  'fulfillment',
  'rate_usd',
  'total_usd',
  'display_currency',
  'fx_mmk_per_usd',
  'payment_method',
  'payment_received_at',
  'voucher_version',
] as const;

export function ordersToCsv(orders: RentalOrder[]): string {
  const header = ORDER_CSV_COLUMNS.join(',');
  const rows = orders.map((order) =>
    [
      order.requestCode,
      order.createdAt,
      order.status,
      order.customerName,
      order.phone,
      order.cityId,
      order.categoryId,
      order.variantId,
      order.startDate,
      order.endDate,
      order.days,
      order.participants,
      order.customerType,
      order.fulfillment,
      order.rateUsd,
      order.totalUsd,
      order.displayCurrency,
      order.fxMmkPerUsd,
      order.paymentMethod,
      order.paymentReceivedAt,
      order.voucherVersion,
    ]
      .map(csvCell)
      .join(','),
  );
  return [header, ...rows].join('\n');
}
