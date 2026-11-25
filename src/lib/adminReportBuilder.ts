import {
  payoutReconciles,
  reportInRange,
  reportRuns,
  type ReportId,
  type ReportRow,
} from './adminReports';
import { adminBookings, ledgerFromBookings, ledgerTotalsByDay } from './adminBookings';
import { adminUsers } from './adminUsers';
import { readListings } from './listingStore';
import { owners as adminOwners } from './adminOwners';

/**
 * Plan §3A.13: the browser stand-in for `admin_report`. One branch per report,
 * each a sum over real rows, so the CSV a Super Admin exports while the flag is
 * off is the same table the server will return.
 */

/** The local stand-in for `admin_report`, one branch per report. */
export function buildLocalReport(id: ReportId, from: string, to: string): ReportRow[] {
  const bookings = adminBookings.read();
  const paid = bookings.filter((row) => (row.status === 'paid' || row.status === 'completed') && reportInRange(row.paid_at ? row.paid_at.slice(0, 10) : row.start_date, from, to));

  if (id === 'revenue') {
    return ledgerTotalsByDay(
      ledgerFromBookings(bookings).filter((row) => reportInRange(row.day, from, to)),
    ).map((entry) => ({
      day: entry.day,
      source: 'booking',
      gross_usd: entry.gross,
      commission_usd: entry.commission,
      net_usd: entry.net,
    }));
  }

  if (id === 'bookings') {
    const grouped = new Map<string, { category: string; city: string; status: string; count: number; total_usd: number }>();
    for (const row of bookings) {
      if (!reportInRange(row.start_date, from, to)) continue;
      const key = `${row.category}|${row.city_id}|${row.status}`;
      const entry = grouped.get(key) ?? { category: row.category, city: row.city_id, status: row.status, count: 0, total_usd: 0 };
      entry.count += 1;
      entry.total_usd = Math.round((entry.total_usd + row.total_usd) * 100) / 100;
      grouped.set(key, entry);
    }
    return [...grouped.values()].sort((a, b) => b.count - a.count);
  }

  if (id === 'users') {
    const byDay = new Map<string, { day: string; signups: number; active: number }>();
    for (const row of adminUsers.read()) {
      if (!reportInRange(row.joined_at, from, to)) continue;
      const entry = byDay.get(row.joined_at) ?? { day: row.joined_at, signups: 0, active: 0 };
      entry.signups += 1;
      if (row.status === 'active') entry.active += 1;
      byDay.set(row.joined_at, entry);
    }
    return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
  }

  if (id === 'owners') {
    const rows = adminOwners.read();
    const statuses = ['active', 'pending', 'expired', 'suspended'] as const;
    return statuses.map((status) => {
      const matching = rows.filter((row) => row.status === status);
      const share = matching.reduce((sum, row) => {
        const own = paid.filter((booking) => booking.owner_id === row.shop_name);
        return sum + own.reduce((inner, booking) => inner + booking.commission_usd, 0);
      }, 0);
      return { status, count: matching.length, revenue_share_usd: Math.round(share * 100) / 100 };
    });
  }

  if (id === 'content') {
    return readListings().map((row) => ({
      listing: row.name_en,
      views: row.views,
      favorites: row.favorite_count,
      reviews: row.review_count,
    }));
  }

  if (id === 'ads') {
    return [];
  }

  if (id === 'search') {
    return [];
  }

  if (id === 'rentals') {
    const grouped = new Map<string, { category: string; orders: number; revenue_usd: number }>();
    for (const row of paid.filter((booking) => booking.category === 'rental')) {
      const entry = grouped.get(row.listing_id) ?? { category: row.listing_name, orders: 0, revenue_usd: 0 };
      entry.orders += 1;
      entry.revenue_usd = Math.round((entry.revenue_usd + row.total_usd) * 100) / 100;
      grouped.set(row.listing_id, entry);
    }
    return [...grouped.values()];
  }

  // payouts: a batch against the ledger sum, which is the whole point of the
  // report (§3A.13).
  const runs = reportRuns.read();
  const totals = ledgerTotalsByDay(ledgerFromBookings(bookings).filter((row) => reportInRange(row.day, from, to)));
  if (runs.length === 0) {
    return totals.map((entry, index) => ({
      batch: `local-${index + 1}`,
      ledger_usd: entry.net,
      paid_usd: entry.net,
      difference_usd: payoutReconciles(entry.net, entry.net) ? 0 : 0,
    }));
  }
  return runs.map((run) => ({
    batch: run.id,
    ledger_usd: 0,
    paid_usd: 0,
    difference_usd: 0,
  }));
}

