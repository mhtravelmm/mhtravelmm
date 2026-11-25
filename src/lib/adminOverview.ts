import { adminBookings, type AdminBookingRow } from './adminBookings';
import { adminUsers, type AdminUserRow } from './adminUsers';
import { adminReviews } from './adminReviews';
import { adminCities } from './adminCities';
import { planRequests } from './adminCities';
import { readListings } from './listingStore';
import { myanmarToday, addDaysToDay } from './myanmarTime';
import { serverAvailable, rpcOrLocal } from './backend';
import type { AdminRole } from './adminRoles';

/**
 * Plan §3A.5, ticket O-61. `admin_get_overview` returns the KPIs, the series,
 * the distribution, the popular cities and the two recent lists; the screen
 * never types a number in. Until the function exists this module computes the
 * same shape from the browser stores, so §3A.2 rule 4 holds either way: an
 * empty store renders zero, never a sample.
 */

export type OverviewPeriod = 7 | 30 | 90 | 365;

export const OVERVIEW_PERIODS: OverviewPeriod[] = [7, 30, 90, 365];

export interface KpiValue {
  /** The figure for the period. */
  value: number;
  /** The total beside it, when the Plan shows one. */
  total?: number;
  /** The change against the previous period of the same length, as a ratio. */
  change: number;
}

export interface OverviewSeriesPoint {
  day: string;
  users: number;
  bookings: number;
  revenue: number;
}

export interface OverviewDistributionEntry {
  category: string;
  count: number;
}

export interface OverviewCityEntry {
  city_id: string;
  name_en: string;
  name_mm: string;
  views: number;
  change: number;
}

export interface OverviewRecentBooking {
  id: string;
  code: string;
  traveler_name: string;
  listing_name: string;
  category: string;
  start_date: string;
  status: string;
}

export interface OverviewRecentUser {
  id: string;
  name: string;
  joined_at: string;
  status: string;
}

export interface OverviewData {
  kpis: {
    users: KpiValue;
    bookings: KpiValue;
    plan_requests: KpiValue;
    revenue: KpiValue;
    reviews: KpiValue;
  };
  /** §3A.5: the gross value passing through, shown beneath revenue. */
  gross_through_usd: number;
  average_rating: number;
  series: OverviewSeriesPoint[];
  distribution: OverviewDistributionEntry[];
  popular_cities: OverviewCityEntry[];
  recent_bookings: OverviewRecentBooking[];
  recent_users: OverviewRecentUser[];
}

/** The window a period covers, in Myanmar days, both ends inclusive. */
export function periodWindow(period: OverviewPeriod, today = myanmarToday()): { from: string; to: string; previousFrom: string } {
  const to = today;
  const from = addDaysToDay(today, -(period - 1));
  const previousFrom = addDaysToDay(from, -period);
  return { from, to, previousFrom };
}

function ratio(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 1;
  return Math.round(((current - previous) / previous) * 1000) / 1000;
}

function inWindow(day: string, from: string, to: string): boolean {
  return day >= from && day <= to;
}

function bookingDay(row: AdminBookingRow): string {
  return row.paid_at ? row.paid_at.slice(0, 10) : row.start_date;
}

/**
 * The whole Overview from the rows. Every figure is a sum over rows, which is
 * what §3A.16 criterion 3 asks for; nothing is estimated.
 */
export function computeOverview(
  input: {
    users: AdminUserRow[];
    bookings: AdminBookingRow[];
    reviews: { id: string; rating: number; created_at: string; status: string; listing_id: string }[];
    cities: { city_id: string; name_en: string; name_mm: string; views: number }[];
    planRequests: { created_at: string; status: string }[];
    listingsPending: number;
  },
  period: OverviewPeriod,
  today = myanmarToday(),
): OverviewData {
  const { from, to, previousFrom } = periodWindow(period, today);
  const previousTo = addDaysToDay(from, -1);

  const usersNow = input.users.filter((row) => inWindow(row.joined_at, from, to));
  const usersBefore = input.users.filter((row) => inWindow(row.joined_at, previousFrom, previousTo));

  const paidNow = input.bookings.filter((row) => (row.status === 'paid' || row.status === 'completed') && inWindow(bookingDay(row), from, to));
  const paidBefore = input.bookings.filter((row) => (row.status === 'paid' || row.status === 'completed') && inWindow(bookingDay(row), previousFrom, previousTo));

  const revenueNow = paidNow.reduce((sum, row) => sum + row.commission_usd, 0);
  const revenueBefore = paidBefore.reduce((sum, row) => sum + row.commission_usd, 0);

  const requestsNow = input.planRequests.filter((row) => inWindow(row.created_at.slice(0, 10), from, to));
  const requestsBefore = input.planRequests.filter((row) => inWindow(row.created_at.slice(0, 10), previousFrom, previousTo));

  const reviewsNow = input.reviews.filter((row) => row.status !== 'deleted' && inWindow(row.created_at.slice(0, 10), from, to));
  const reviewsBefore = input.reviews.filter((row) => row.status !== 'deleted' && inWindow(row.created_at.slice(0, 10), previousFrom, previousTo));

  // The series covers the period, one point per day, with zero on a quiet day
  // rather than a gap — a line chart with holes reads as missing data.
  const series: OverviewSeriesPoint[] = [];
  for (let offset = 0; offset < period; offset += 1) {
    const day = addDaysToDay(from, offset);
    series.push({
      day,
      users: input.users.filter((row) => row.joined_at === day).length,
      bookings: input.bookings.filter((row) => (row.status === 'paid' || row.status === 'completed') && bookingDay(row) === day).length,
      revenue: Math.round(input.bookings.filter((row) => (row.status === 'paid' || row.status === 'completed') && bookingDay(row) === day).reduce((sum, row) => sum + row.commission_usd, 0) * 100) / 100,
    });
  }

  const byCategory = new Map<string, number>();
  for (const row of paidNow) byCategory.set(row.category, (byCategory.get(row.category) ?? 0) + 1);
  const distribution = [...byCategory.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const popular_cities = input.cities
    .map((city) => ({ ...city, change: 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const recent_bookings = [...input.bookings]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5)
    .map((row) => ({
      id: row.id,
      code: row.code,
      traveler_name: row.traveler_name,
      listing_name: row.listing_name,
      category: row.category,
      start_date: row.start_date,
      status: row.status,
    }));

  const recent_users = [...input.users]
    .sort((a, b) => b.joined_at.localeCompare(a.joined_at))
    .slice(0, 5)
    .map((row) => ({ id: row.id, name: row.name, joined_at: row.joined_at, status: row.status }));

  const rated = input.reviews.filter((row) => row.status === 'visible');

  return {
    kpis: {
      users: { value: usersNow.length, total: input.users.length, change: ratio(usersNow.length, usersBefore.length) },
      bookings: { value: paidNow.length, change: ratio(paidNow.length, paidBefore.length) },
      plan_requests: { value: requestsNow.length, change: ratio(requestsNow.length, requestsBefore.length) },
      revenue: {
        value: Math.round(revenueNow * 100) / 100,
        change: ratio(revenueNow, revenueBefore),
      },
      reviews: { value: reviewsNow.length, change: ratio(reviewsNow.length, reviewsBefore.length) },
    },
    gross_through_usd: Math.round(paidNow.reduce((sum, row) => sum + row.total_usd, 0) * 100) / 100,
    average_rating: rated.length === 0 ? 0 : Math.round((rated.reduce((sum, row) => sum + row.rating, 0) / rated.length) * 10) / 10,
    series,
    distribution,
    popular_cities,
    recent_bookings,
    recent_users,
  };
}

/** §3A.5 Needs attention: the twelve counts, each with the section it opens. */
export type AttentionKey =
  | 'owner_applications'
  | 'rental_requests'
  | 'ad_creatives'
  | 'reviews'
  | 'listing_reports'
  | 'support'
  | 'jobs'
  | 'subscriptions'
  | 'payouts'
  | 'guide_earnings'
  | 'translations'
  | 'listings';

export interface AttentionItem {
  key: AttentionKey;
  count: number;
  /** The workspace section the row links to. */
  section: string;
}

export interface AttentionInput {
  ownerApplications: number;
  rentalRequests: number;
  adCreatives: number;
  reviews: number;
  listingReports: number;
  support: number;
  failedJobs: number;
  subscriptionsEnding: number;
  payoutsDue: number;
  guideEarningsUnpriced: number;
  translationsToReview: number;
  listingsPending: number;
}

const ATTENTION_SECTIONS: Record<AttentionKey, string> = {
  owner_applications: 'owners',
  rental_requests: 'rentalOrders',
  ad_creatives: 'ads',
  reviews: 'reviews',
  listing_reports: 'reviews',
  support: 'support',
  jobs: 'jobs',
  subscriptions: 'owners',
  payouts: 'payouts',
  guide_earnings: 'guideEarnings',
  translations: 'translations',
  listings: 'listings',
};

/**
 * §3A.16 criterion 4: Needs attention shows only what the viewer may open, and
 * a count of zero is not shown at all — a list of zeros is noise.
 */
export function needsAttention(input: AttentionInput, canOpen: (section: string) => boolean): AttentionItem[] {
  const entries: { key: AttentionKey; count: number }[] = [
    { key: 'owner_applications', count: input.ownerApplications },
    { key: 'rental_requests', count: input.rentalRequests },
    { key: 'ad_creatives', count: input.adCreatives },
    { key: 'reviews', count: input.reviews },
    { key: 'listing_reports', count: input.listingReports },
    { key: 'support', count: input.support },
    { key: 'jobs', count: input.failedJobs },
    { key: 'subscriptions', count: input.subscriptionsEnding },
    { key: 'payouts', count: input.payoutsDue },
    { key: 'guide_earnings', count: input.guideEarningsUnpriced },
    { key: 'translations', count: input.translationsToReview },
    { key: 'listings', count: input.listingsPending },
  ];
  return entries
    .filter((entry) => entry.count > 0 && canOpen(ATTENTION_SECTIONS[entry.key]))
    .map((entry) => ({ ...entry, section: ATTENTION_SECTIONS[entry.key] }));
}

export function attentionSection(key: AttentionKey): string {
  return ATTENTION_SECTIONS[key];
}

/** The local stand-in for `admin_get_overview` and `admin_needs_attention`. */
export function localOverview(period: OverviewPeriod): OverviewData {
  return computeOverview(
    {
      users: adminUsers.read(),
      bookings: adminBookings.read(),
      reviews: adminReviews.read(),
      cities: adminCities.read().map((city) => ({ city_id: city.id, name_en: city.name_en, name_mm: city.name_mm, views: city.views })),
      planRequests: planRequests.read(),
      listingsPending: readListings().filter((row) => row.status === 'pending').length,
    },
    period,
  );
}

/**
 * The screen's data call. `admin_get_overview(p_from, p_to)` on the server,
 * the local computation while the flag is off (§16G.5).
 */
export async function loadOverview(period: OverviewPeriod, today = myanmarToday()) {
  const { from, to } = periodWindow(period, today);
  if (!serverAvailable('admin')) return { ok: true as const, data: localOverview(period) };
  return rpcOrLocal<OverviewData>('admin', 'admin_get_overview', { p_from: from, p_to: to }, () => localOverview(period));
}

/** The roles §3A.4 gives the Overview to. */
export function canSeeOverview(role: AdminRole | undefined): boolean {
  return role === 'Super Admin';
}
