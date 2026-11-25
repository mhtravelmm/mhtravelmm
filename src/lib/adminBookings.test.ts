import { describe, expect, it } from 'vitest';
import {
  EMPTY_BOOKING_FILTERS,
  bookingCanFollow,
  bookingCanReschedule,
  bookingIsTerminal,
  bookingNextStatuses,
  bookingSummary,
  filterBookings,
  ledgerDayReconciles,
  ledgerFromBookings,
  ledgerTotalsByDay,
  moveBooking,
  recordBookingPayment,
  type AdminBookingRow,
} from './adminBookings';

/**
 * Plan §6.1, §3A.9. The booking status machine and the ledger are the two places
 * a dashboard mistake costs money, so both are tested on plain rows: a move the
 * table does not list is refused, and a day reconciles only when gross equals
 * commission plus net.
 */

function booking(overrides: Partial<AdminBookingRow> = {}): AdminBookingRow {
  return {
    id: 'b1', code: 'BKG-1', category: 'hotel', listing_id: 'l1', listing_name: 'Inya Hotel',
    city_id: 'yangon', owner_id: 'ow-1', traveler_name: 'Thar Thar', traveler_phone: '+95 9 000',
    start_date: '2026-11-20', end_date: '2026-11-21', guests: 2, total_usd: 100, commission_usd: 10,
    status: 'requested', flow: 'full_manual', payment_method: null, paid_at: null,
    note: '', created_at: '2026-11-19T02:00:00.000Z',
    events: [{ status: 'requested', at: '2026-11-19T02:00:00.000Z', by: 'traveler', note: '' }],
    ...overrides,
  };
}

describe('the booking status machine (§6.1)', () => {
  it('lets a requested booking be accepted or cancelled, and expire it when nobody answers', () => {
    expect(bookingNextStatuses('requested')).toEqual(['accepted', 'cancelled', 'expired']);
    expect(bookingCanFollow('requested', 'paid')).toBe(false);
  });

  it('lets an accepted booking be paid or cancelled, never completed directly', () => {
    expect(bookingNextStatuses('accepted')).toEqual(['paid', 'cancelled', 'expired']);
    expect(bookingCanFollow('accepted', 'completed')).toBe(false);
  });

  it('treats completed, expired and cancelled as terminal', () => {
    for (const status of ['completed', 'expired', 'cancelled'] as const) {
      expect(bookingNextStatuses(status), status).toEqual([]);
    }
  });

  it('stamps the event trail and the paid day when a payment is recorded', () => {
    const at = new Date('2026-11-20T04:00:00.000Z');
    const next = moveBooking(booking({ status: 'accepted' }), 'paid', 'staff', at);
    expect(next.status).toBe('paid');
    expect(next.paid_at).toBe(at.toISOString());
    expect(next.events).toHaveLength(2);
    expect(next.events[1]).toMatchObject({ status: 'paid', by: 'staff' });
  });

  it('keeps a terminal booking terminal, so a cancelled order cannot be revived', () => {
    for (const status of ['completed', 'expired', 'cancelled'] as const) {
      expect(bookingIsTerminal(status), status).toBe(true);
      expect(bookingCanFollow(status, 'paid'), status).toBe(false);
    }
  });

  it('records the payment method and the commission on the row', () => {
    const next = recordBookingPayment(booking({ status: 'accepted' }), 'bank_transfer', 'staff');
    expect(next.status).toBe('paid');
    expect(next.payment_method).toBe('bank_transfer');
    expect(next.commission_usd).toBe(10);
  });

  it('allows a reschedule only after payment, because it is an event not a status (§6.3)', () => {
    expect(bookingCanReschedule(booking({ status: 'paid' }))).toBe(true);
    expect(bookingCanReschedule(booking({ status: 'requested' }))).toBe(false);
    expect(bookingCanReschedule(booking({ status: 'cancelled' }))).toBe(false);
  });
});

describe('the booking list (§3A.9)', () => {
  it('filters by category, status, city, owner and start date together', () => {
    const rows = [
      booking({ id: 'b1', code: 'BKG-1', status: 'paid' }),
      booking({ id: 'b2', code: 'BKG-2', city_id: 'bagan', category: 'rental', start_date: '2026-12-01' }),
    ];
    expect(filterBookings(rows, { ...EMPTY_BOOKING_FILTERS, status: 'paid' }).map((row) => row.id)).toEqual(['b1']);
    expect(filterBookings(rows, { ...EMPTY_BOOKING_FILTERS, city: 'bagan' }).map((row) => row.id)).toEqual(['b2']);
    expect(filterBookings(rows, { ...EMPTY_BOOKING_FILTERS, from: '2026-12-01', to: '2026-12-31' }).map((row) => row.id)).toEqual(['b2']);
  });

  it('searches the code, the traveler name and the phone', () => {
    const rows = [booking({ code: 'BKG-77', traveler_name: 'May Myat' })];
    expect(filterBookings(rows, { ...EMPTY_BOOKING_FILTERS, query: 'bkg-77' })).toHaveLength(1);
    expect(filterBookings(rows, { ...EMPTY_BOOKING_FILTERS, query: 'may' })).toHaveLength(1);
    expect(filterBookings(rows, { ...EMPTY_BOOKING_FILTERS, query: 'zzz' })).toHaveLength(0);
  });

  it('counts only paid and completed rows into the gross and the commission', () => {
    const summary = bookingSummary([
      booking({ id: 'b1', status: 'paid', total_usd: 100, commission_usd: 10 }),
      booking({ id: 'b2', status: 'completed', total_usd: 50, commission_usd: 5 }),
      booking({ id: 'b3', status: 'requested', total_usd: 999, commission_usd: 99 }),
    ]);
    expect(summary.gross).toBe(150);
    expect(summary.commission).toBe(15);
    expect(summary.paid).toBe(2);
    expect(summary.requested).toBe(1);
    // The requested row still counts toward the value of the filtered list.
    expect(summary.value).toBe(1149);
  });
});

describe('the ledger (§3A.9)', () => {
  it('writes gross, commission and net so they add up', () => {
    const [row] = ledgerFromBookings([booking({ status: 'paid', total_usd: 100, commission_usd: 10 })]);
    expect(row.gross_usd).toBe(100);
    expect(row.commission_usd).toBe(10);
    expect(row.net_usd).toBe(90);
  });

  it('keeps only paid rows, because a requested booking is not money yet', () => {
    expect(ledgerFromBookings([booking({ status: 'requested' })])).toHaveLength(0);
  });

  it('reconciles a day whose gross equals commission plus net', () => {
    const totals = ledgerTotalsByDay(ledgerFromBookings([
      booking({ id: 'b1', status: 'paid', total_usd: 100, commission_usd: 10 }),
      booking({ id: 'b2', status: 'paid', total_usd: 200, commission_usd: 20 }),
    ]));
    expect(totals).toHaveLength(1);
    expect(totals[0]).toMatchObject({ gross: 300, commission: 30, net: 270 });
    expect(ledgerDayReconciles(totals[0])).toBe(true);
  });

  it('refuses a day that does not add up', () => {
    expect(ledgerDayReconciles({ gross: 300, commission: 30, net: 200 })).toBe(false);
  });
});
