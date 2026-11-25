import { describe, expect, it } from 'vitest';
import {
  LISTING_REPORT_THRESHOLD,
  adjustedRating,
  clampAdjustment,
  deleteReview,
  hideReview,
  listingReports,
  restoreReview,
  reviewQueue,
  reviewSummary,
  type AdminReviewRow,
} from './adminReviews';
import {
  assignThread,
  closeThread,
  filterThreads,
  reopenThread,
  replyToThread,
  threadSummary,
  unreadSupportCount,
  type SupportThreadRow,
} from './adminSupport';

/**
 * Plan §11 and §12.1. Moderation and support are both "the staff acts and the
 * row records who", so the rules are tested on plain rows: a hidden review
 * leaves the queue, and a reply belongs to the staff member who wrote it.
 */

function review(overrides: Partial<AdminReviewRow> = {}): AdminReviewRow {
  return {
    id: 'r1', listing_id: 'l1', listing_name: 'Inya Hotel', author_name: 'Moe Thu',
    rating: 4, body: 'Lovely stay', status: 'visible', reports: 0, reasons: [],
    auto_hidden: false, moderated_by: null, moderated_at: null, moderation_note: '',
    created_at: '2026-11-19T02:00:00.000Z',
    ...overrides,
  };
}

describe('the moderation queue (§11)', () => {
  it('lists only reported rows in the reported view', () => {
    const rows = [review({ id: 'r1', reports: 0 }), review({ id: 'r2', reports: 2 })];
    expect(reviewQueue(rows, 'reported').map((row) => row.id)).toEqual(['r2']);
  });

  it('lists only auto-hidden rows in its own view', () => {
    const rows = [review({ id: 'r1' }), review({ id: 'r2', auto_hidden: true, status: 'hidden' })];
    expect(reviewQueue(rows, 'auto_hidden').map((row) => row.id)).toEqual(['r2']);
  });

  it('hides a review, recording who did it and why', () => {
    const next = hideReview(review(), 'Super Admin', 'Abusive language', new Date('2026-11-20T02:00:00.000Z'));
    expect(next.status).toBe('hidden');
    expect(next.moderated_by).toBe('Super Admin');
    expect(next.moderated_at).toBe('2026-11-20T02:00:00.000Z');
  });

  it('restores a review and clears the automatic flag', () => {
    const next = restoreReview(review({ status: 'hidden', auto_hidden: true }), 'Admin');
    expect(next.status).toBe('visible');
    expect(next.auto_hidden).toBe(false);
  });

  it('deletes softly, so the audit row still resolves', () => {
    const next = deleteReview(review(), 'Admin', 'Fake review');
    expect(next.status).toBe('deleted');
  });

  it('counts distinct reports per listing and keeps the worst first', () => {
    const rows = [
      review({ id: 'r1', listing_id: 'l1', reports: 3 }),
      review({ id: 'r2', listing_id: 'l1', reports: 1 }),
      review({ id: 'r3', listing_id: 'l2', reports: 0 }),
    ];
    const reports = listingReports(rows);
    expect(reports[0]).toMatchObject({ listing_id: 'l1', reports: 4 });
    expect(reports.find((row) => row.listing_id === 'l1')?.reports).toBeGreaterThanOrEqual(LISTING_REPORT_THRESHOLD);
  });

  it('clamps the adjustment to the −1.5…0 the Plan allows', () => {
    expect(clampAdjustment(-9)).toBe(-1.5);
    expect(clampAdjustment(2)).toBe(0);
    expect(clampAdjustment(-0.4)).toBe(-0.4);
  });

  it('applies the adjustment to the effective rating and never below zero', () => {
    expect(adjustedRating(4.5, -0.5)).toBe(4);
    expect(adjustedRating(0.5, -1.5)).toBe(0);
  });

  it('counts reported and auto-hidden rows, and averages only visible ones', () => {
    const summary = reviewSummary([
      review({ id: 'r1', reports: 2, rating: 5 }),
      review({ id: 'r2', auto_hidden: true, status: 'hidden', rating: 1 }),
      review({ id: 'r3', status: 'deleted', rating: 1 }),
    ]);
    expect(summary.reported).toBe(1);
    expect(summary.autoHidden).toBe(1);
    expect(summary.average).toBe(5);
  });
});

function thread(overrides: Partial<SupportThreadRow> = {}): SupportThreadRow {
  return {
    id: 't1', kind: 'traveler', subject: 'Refund question', requester_name: 'Moe Thu',
    requester_email: 'moe@example.com', status: 'open', assigned_to: null,
    created_at: '2026-11-19T02:00:00.000Z', updated_at: '2026-11-19T02:00:00.000Z',
    messages: [{ id: 'm1', from: 'traveler', author: 'Moe Thu', body: 'Where is my refund?', at: '2026-11-19T02:00:00.000Z', unread: true }],
    ...overrides,
  };
}

describe('the support inbox (§12.1)', () => {
  it('filters open, unassigned, mine and closed', () => {
    const rows = [
      thread({ id: 't1' }),
      thread({ id: 't2', assigned_to: 'Admin' }),
      thread({ id: 't3', status: 'closed' }),
    ];
    expect(filterThreads(rows, 'open', null).map((row) => row.id)).toEqual(['t1', 't2']);
    expect(filterThreads(rows, 'unassigned', null).map((row) => row.id)).toEqual(['t1']);
    expect(filterThreads(rows, 'mine', 'Admin').map((row) => row.id)).toEqual(['t2']);
    expect(filterThreads(rows, 'closed', null).map((row) => row.id)).toEqual(['t3']);
  });

  it('counts a thread once, however many unread messages it holds', () => {
    const rows = [
      thread({ id: 't1' }),
      thread({ id: 't2', messages: [{ id: 'm1', from: 'traveler', author: 'x', body: 'y', at: '', unread: false }] }),
    ];
    expect(unreadSupportCount(rows)).toBe(1);
  });

  it('assigns the thread to the staff member who took it', () => {
    expect(assignThread(thread(), 'Admin').assigned_to).toBe('Admin');
  });

  it('closes and reopens without losing the messages', () => {
    const closed = closeThread(thread());
    expect(closed.status).toBe('closed');
    expect(closed.messages).toHaveLength(1);
    expect(reopenThread(closed).status).toBe('open');
  });

  it('appends a staff reply and clears the traveler unread flags', () => {
    const next = replyToThread(thread(), 'Admin', 'Refund sent today.', new Date('2026-11-20T02:00:00.000Z'));
    expect(next.messages).toHaveLength(2);
    expect(next.messages[1]).toMatchObject({ from: 'staff', author: 'Admin', body: 'Refund sent today.' });
    expect(next.messages[0].unread).toBe(false);
    expect(next.updated_at).toBe('2026-11-20T02:00:00.000Z');
  });

  it('ignores an empty reply, so a stray Enter sends nothing', () => {
    const row = thread();
    expect(replyToThread(row, 'Admin', '   ')).toBe(row);
  });

  it('summarises open, unassigned and unread', () => {
    const summary = threadSummary([
      thread({ id: 't1' }),
      thread({ id: 't2', assigned_to: 'Admin' }),
      thread({ id: 't3', status: 'closed' }),
    ]);
    expect(summary).toEqual({ open: 2, unassigned: 1, unread: 2 });
  });
});
