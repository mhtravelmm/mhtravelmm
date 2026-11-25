import { createCollection } from './collection';
import { myanmarDay } from './myanmarTime';

/**
 * Plan §11 and §3A.10, ticket O-65. The moderation queue: reported reviews, the
 * auto-hidden ones, and the reports against a listing. A reporter is never told
 * what happened, so nothing here is pushed to a traveler's feed.
 */

export type ReviewStatus = 'visible' | 'hidden' | 'deleted';

export type ReviewReason =
  | 'spam'
  | 'abusive'
  | 'off_topic'
  | 'fake'
  | 'personal_information'
  | 'other';

export const REVIEW_REASONS: ReviewReason[] = [
  'spam',
  'abusive',
  'off_topic',
  'fake',
  'personal_information',
  'other',
];

export interface AdminReviewRow {
  id: string;
  listing_id: string;
  listing_name: string;
  author_name: string;
  rating: number;
  body: string;
  created_at: string;
  status: ReviewStatus;
  /** How many distinct people reported it. Three or more also flags the listing. */
  reports: number;
  reasons: ReviewReason[];
  /** §11: an automatic hide is a status, and the queue shows why. */
  auto_hidden: boolean;
  moderated_by: string | null;
  moderated_at: string | null;
  moderation_note: string;
}

export const adminReviews = createCollection<AdminReviewRow>({
  key: 'mh-travel-admin-reviews',
  seed: [] as AdminReviewRow[],
  id: (row) => row.id,
  isRow: (value): value is AdminReviewRow => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<AdminReviewRow>;
    return typeof row.id === 'string' && typeof row.listing_id === 'string' && typeof row.rating === 'number';
  },
  normalize: (row, seed) => ({
    ...(seed ?? row),
    ...row,
    reports: row.reports ?? 0,
    reasons: Array.isArray(row.reasons) ? row.reasons : [],
    auto_hidden: row.auto_hidden ?? false,
    moderation_note: row.moderation_note ?? '',
  }),
});

/** §11: three distinct reports in 30 days flags the listing for review. */
export const LISTING_REPORT_THRESHOLD = 3;

export function hideReview(row: AdminReviewRow, by: string, note: string, now = new Date()): AdminReviewRow {
  return { ...row, status: 'hidden', moderated_by: by, moderated_at: now.toISOString(), moderation_note: note.trim() };
}

/**
 * Restoring also clears `auto_hidden`: the flag is what put the row in the
 * queue, so leaving it set would return the review to the queue it just left.
 */
export function restoreReview(row: AdminReviewRow, by: string, now = new Date()): AdminReviewRow {
  return {
    ...row,
    status: 'visible',
    auto_hidden: false,
    moderated_by: by,
    moderated_at: now.toISOString(),
    moderation_note: '',
  };
}

/**
 * §11: deleting is soft. The row keeps its id so a restored report and an audit
 * row still resolve, and the reader never sees it again.
 */
export function deleteReview(row: AdminReviewRow, by: string, note: string, now = new Date()): AdminReviewRow {
  return { ...row, status: 'deleted', moderated_by: by, moderated_at: now.toISOString(), moderation_note: note.trim() };
}

export type ReviewQueueFilter = 'reported' | 'auto_hidden' | 'all';

/** The queue §3A.10 describes: reported and auto-hidden rows, or everything. */
export function reviewQueue(rows: AdminReviewRow[], filter: ReviewQueueFilter): AdminReviewRow[] {
  if (filter === 'all') return rows;
  if (filter === 'auto_hidden') return rows.filter((row) => row.auto_hidden && row.status !== 'deleted');
  return rows.filter((row) => row.reports > 0 && row.status === 'visible');
}

/**
 * §11 and §3A.10: a rating adjustment moves between −1.5 and 0, and 0 removes
 * it. It is separate from the star rating a traveler wrote, so the original is
 * never rewritten.
 */
export const RATING_ADJUSTMENT_MIN = -1.5;
export const RATING_ADJUSTMENT_MAX = 0;

export interface ListingReportRow {
  listing_id: string;
  listing_name: string;
  reports: number;
  adjustment: number;
  /** The rating after the adjustment, to one decimal. */
  effective_rating: number;
  last_report_day: string;
}

export function listingReports(rows: AdminReviewRow[]): ListingReportRow[] {
  const byListing = new Map<string, { name: string; reports: number; ratings: number[]; days: string[] }>();
  for (const row of rows) {
    if (row.status === 'deleted') continue;
    const entry = byListing.get(row.listing_id) ?? { name: row.listing_name, reports: 0, ratings: [], days: [] };
    entry.reports += row.reports;
    entry.ratings.push(row.rating);
    entry.days.push(myanmarDay(row.created_at));
    byListing.set(row.listing_id, entry);
  }
  return [...byListing.entries()]
    .map(([listingId, entry]) => ({
      listing_id: listingId,
      listing_name: entry.name,
      reports: entry.reports,
      adjustment: 0,
      effective_rating: Math.round((entry.ratings.reduce((sum, value) => sum + value, 0) / entry.ratings.length) * 10) / 10,
      last_report_day: entry.days.sort()[entry.days.length - 1] ?? '',
    }))
    .filter((entry) => entry.reports > 0)
    .sort((a, b) => b.reports - a.reports);
}

export function clampAdjustment(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(RATING_ADJUSTMENT_MAX, Math.max(RATING_ADJUSTMENT_MIN, Math.round(value * 10) / 10));
}

export function adjustedRating(base: number, adjustment: number): number {
  return Math.max(0, Math.min(5, Math.round((base + clampAdjustment(adjustment)) * 10) / 10));
}

export function reviewSummary(rows: AdminReviewRow[]): { reported: number; autoHidden: number; average: number } {
  const visible = rows.filter((row) => row.status === 'visible');
  return {
    reported: rows.filter((row) => row.reports > 0 && row.status === 'visible').length,
    autoHidden: rows.filter((row) => row.auto_hidden && row.status !== 'deleted').length,
    average: visible.length === 0 ? 0 : Math.round((visible.reduce((sum, row) => sum + row.rating, 0) / visible.length) * 10) / 10,
  };
}
