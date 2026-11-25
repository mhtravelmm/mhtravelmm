import { createCollection } from './collection';

/**
 * Plan §3A.13 and §16H.11, ticket O-68. `admin_report` returns rows per report;
 * this module holds the shape of each report and the rules a report obeys, so
 * the screen, the CSV export and the tests read one definition.
 */

export type ReportId =
  | 'revenue'
  | 'bookings'
  | 'users'
  | 'owners'
  | 'content'
  | 'ads'
  | 'search'
  | 'rentals'
  | 'payouts';

export interface ReportDefinition {
  id: ReportId;
  /** The label key the sidebar and the report picker use. */
  labelKey: string;
  /** §3A.13's role column, as product role names. */
  roles: string[];
  /** The columns the table and the CSV share, in order. */
  columns: { key: string; labelKey: string }[];
}

/**
 * §3A.13, row by row. The roles are the product names in §16G.5, so a guard can
 * compare them without a translation step.
 */
export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: 'revenue',
    labelKey: 'sa_report_revenue',
    roles: ['Super Admin', 'Payment Admin'],
    columns: [
      { key: 'day', labelKey: 'sa_col_date' },
      { key: 'source', labelKey: 'sa_report_source' },
      { key: 'gross_usd', labelKey: 'sa_col_gross' },
      { key: 'commission_usd', labelKey: 'sa_col_commission' },
      { key: 'net_usd', labelKey: 'sa_col_net' },
    ],
  },
  {
    id: 'bookings',
    labelKey: 'sa_report_bookings',
    roles: ['Super Admin'],
    columns: [
      { key: 'category', labelKey: 'sa_col_category' },
      { key: 'city', labelKey: 'sa_col_city' },
      { key: 'status', labelKey: 'sa_col_status' },
      { key: 'count', labelKey: 'sa_col_count' },
      { key: 'total_usd', labelKey: 'sa_col_total' },
    ],
  },
  {
    id: 'users',
    labelKey: 'sa_report_users',
    roles: ['Super Admin', 'Admin'],
    columns: [
      { key: 'day', labelKey: 'sa_col_date' },
      { key: 'signups', labelKey: 'sa_report_signups' },
      { key: 'active', labelKey: 'sa_report_active_users' },
    ],
  },
  {
    id: 'owners',
    labelKey: 'sa_report_owners',
    roles: ['Super Admin'],
    columns: [
      { key: 'status', labelKey: 'sa_col_status' },
      { key: 'count', labelKey: 'sa_col_count' },
      { key: 'revenue_share_usd', labelKey: 'sa_report_revenue_share' },
    ],
  },
  {
    id: 'content',
    labelKey: 'sa_report_content',
    roles: ['Super Admin', 'Admin'],
    columns: [
      { key: 'listing', labelKey: 'sa_col_listing' },
      { key: 'views', labelKey: 'sa_report_views' },
      { key: 'favorites', labelKey: 'sa_report_favorites' },
      { key: 'reviews', labelKey: 'sa_report_reviews' },
    ],
  },
  {
    id: 'ads',
    labelKey: 'sa_report_ads',
    roles: ['Super Admin', 'Ads Admin', 'Payment Admin'],
    columns: [
      { key: 'campaign', labelKey: 'sa_report_campaign' },
      { key: 'impressions', labelKey: 'sa_report_impressions' },
      { key: 'clicks', labelKey: 'sa_report_clicks' },
      { key: 'spend_usd', labelKey: 'sa_col_spend' },
    ],
  },
  {
    id: 'search',
    labelKey: 'sa_report_search',
    roles: ['Super Admin', 'Admin'],
    columns: [
      { key: 'query', labelKey: 'sa_report_query' },
      { key: 'results', labelKey: 'sa_report_results' },
      { key: 'clicks', labelKey: 'sa_report_clicks' },
    ],
  },
  {
    id: 'rentals',
    labelKey: 'sa_report_rentals',
    roles: ['Super Admin', 'Rental Admin', 'Payment Admin', 'Admin'],
    columns: [
      { key: 'category', labelKey: 'sa_col_category' },
      { key: 'orders', labelKey: 'sa_report_orders' },
      { key: 'revenue_usd', labelKey: 'sa_report_revenue' },
    ],
  },
  {
    id: 'payouts',
    labelKey: 'sa_report_payouts',
    roles: ['Super Admin', 'Payment Admin'],
    columns: [
      { key: 'batch', labelKey: 'sa_report_batch' },
      { key: 'ledger_usd', labelKey: 'sa_report_ledger' },
      { key: 'paid_usd', labelKey: 'sa_report_paid' },
      { key: 'difference_usd', labelKey: 'sa_report_difference' },
    ],
  },
];

export function reportDefinition(id: ReportId): ReportDefinition | undefined {
  return REPORT_DEFINITIONS.find((definition) => definition.id === id);
}

/** §3A.13: a role only sees the reports its row names. */
export function reportsForRole(role: string | undefined): ReportDefinition[] {
  if (!role) return [];
  return REPORT_DEFINITIONS.filter((definition) => definition.roles.includes(role));
}

export function canRunReport(role: string | undefined, id: ReportId): boolean {
  const definition = reportDefinition(id);
  if (!definition || !role) return false;
  return definition.roles.includes(role);
}

export type ReportRow = Record<string, string | number>;

export interface ReportResult {
  id: ReportId;
  from: string;
  to: string;
  rows: ReportRow[];
  generated_at: string;
}

/**
 * §3A.13: a report always has a date range, and both ends are inclusive in
 * Myanmar Time, so a one-day report is one day rather than zero.
 */
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function reportRangeValid(from: string, to: string): boolean {
  // §16G.1: a date is `YYYY-MM-DD`. Comparing strings alone would accept
  // "tomorrow", which sorts after every real day and silently widens the report.
  if (!DAY.test(from) || !DAY.test(to)) return false;
  return from <= to;
}

export function reportInRange(day: string, from: string, to: string): boolean {
  return day >= from && day <= to;
}

/** The payouts report's whole point: a batch either matches its ledger or does not. */
export function payoutDifference(ledgerUsd: number, paidUsd: number): number {
  return Math.round((paidUsd - ledgerUsd) * 100) / 100;
}

export function payoutReconciles(ledgerUsd: number, paidUsd: number): boolean {
  return Math.abs(payoutDifference(ledgerUsd, paidUsd)) < 0.005;
}

/** Saved report runs, so the screen can show "last run" without a server. */
export interface ReportRunRow {
  id: string;
  report: ReportId;
  from: string;
  to: string;
  row_count: number;
  run_at: string;
  run_by: string;
}

export const reportRuns = createCollection<ReportRunRow>({
  key: 'mh-travel-admin-report-runs',
  seed: [] as ReportRunRow[],
  id: (row) => row.id,
  isRow: (value): value is ReportRunRow => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<ReportRunRow>;
    return typeof row.id === 'string' && typeof row.report === 'string';
  },
  mergeSeed: false,
});
