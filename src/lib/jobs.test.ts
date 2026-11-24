import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JOBS, alertJobFailures, dueJobs, lastRunsById, nextDailyRun, nextRunAt, readJobRuns, runDueJobs, type JobRun } from './jobs';
import { readStaffNotifications } from './rentalNotifications';
import { canSee, readFeed } from './notificationFeed';

function fakeWindow() {
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
}

beforeEach(() => { fakeWindow(); });

const MINUTE = 60 * 1000;
const at = (iso: string) => new Date(iso);
// Every due job, so a test about one does not trip over another.
const handlers = {
  rental_payment_expiry: () => 2,
  publish_due_content: () => '0/0',
  ad_campaign_window: () => '0/0/0',
  subscription_expiry: () => 0,
  ad_stats_rollup: () => 0,
  ad_events_purge: () => 0,
  template_events_purge: () => 0,
};

describe('the §16B.7 schedule', () => {
  it('lists the nine jobs with the cadence the Plan gives', () => {
    expect(JOBS).toHaveLength(9);
    expect(JOBS.find((job) => job.id === 'rental_payment_expiry')?.schedule).toEqual({ everyMs: 5 * MINUTE });
    expect(JOBS.find((job) => job.id === 'renewal_reminders')?.schedule).toEqual({ dailyAt: '09:00' });
  });

  it('runs a daily job at its Myanmar wall-clock time, not the viewer zone', () => {
    // 09:00 Myanmar Time is 02:30 UTC.
    const next = nextDailyRun('09:00', at('2026-11-23T00:00:00Z'));
    expect(new Date(next).toISOString()).toBe('2026-11-23T02:30:00.000Z');
  });

  it('moves a daily job to tomorrow once its time has passed', () => {
    const next = nextDailyRun('09:00', at('2026-11-23T03:00:00Z'));
    expect(new Date(next).toISOString()).toBe('2026-11-24T02:30:00.000Z');
  });

  it('treats a never-run interval job as due now, so a fresh tab catches up', () => {
    expect(nextRunAt({ everyMs: MINUTE }, undefined, at('2026-11-23T00:00:00Z'))).toBe(0);
  });

  it('waits out the interval after a run', () => {
    const now = at('2026-11-23T00:10:00Z');
    expect(nextRunAt({ everyMs: 5 * MINUTE }, '2026-11-23T00:07:00Z', now)).toBe(now.getTime() + 2 * MINUTE);
  });

  it('does not run a never-run daily job before its time', () => {
    const now = at('2026-11-23T00:00:00Z');
    expect(nextRunAt({ dailyAt: '09:00' }, undefined, now)).toBeGreaterThan(now.getTime());
  });

  it('reports only the jobs whose time has come', () => {
    const now = at('2026-11-23T00:10:00Z');
    expect(dueJobs(now, { rental_payment_expiry: '2026-11-23T00:00:00Z' })).toContain('rental_payment_expiry');
    // Ran three minutes ago, so the next run is two minutes away.
    expect(dueJobs(now, { rental_payment_expiry: '2026-11-23T00:07:00Z' })).not.toContain('rental_payment_expiry');
    expect(dueJobs(now, {})).not.toContain('renewal_reminders');
  });

  it('reads the newest row per job', () => {
    const runs: JobRun[] = [
      { id: 'rental_payment_expiry', at: '2026-11-23T00:00:00Z', outcome: 'ok', detail: '0' },
      { id: 'rental_payment_expiry', at: '2026-11-23T00:05:00Z', outcome: 'ok', detail: '1' },
    ];
    expect(lastRunsById(runs)).toEqual({ rental_payment_expiry: '2026-11-23T00:05:00Z' });
  });
});

describe('runDueJobs', () => {
  const now = at('2026-11-23T00:10:00Z');
  const lastRun = { rental_payment_expiry: '2026-11-23T00:00:00Z' };
  // Both interval jobs are past their cadence; the three daily ones ran today,
  // so their next wall-clock time is tomorrow.
  const justRan: JobRun[] = [
    { id: 'publish_due_content', at: '2026-11-23T00:08:00Z', outcome: 'ok', detail: '0/0' },
    { id: 'ad_campaign_window', at: '2026-11-23T00:08:00Z', outcome: 'ok', detail: '0/0/0' },
    { id: 'rental_payment_expiry', at: '2026-11-23T00:03:00Z', outcome: 'ok', detail: '0' },
    { id: 'ad_stats_rollup', at: '2026-11-23T00:09:30Z', outcome: 'ok', detail: '0' },
    { id: 'ad_events_purge', at: '2026-11-23T00:09:30Z', outcome: 'ok', detail: '0' },
  ];

  it('logs one row per run and reports nothing when the job succeeds', () => {
    const { runs, failures } = runDueJobs(now, handlers, justRan);
    expect(failures).toEqual([]);
    expect(runs).toEqual([
      { id: 'publish_due_content', at: now.toISOString(), outcome: 'ok', detail: '0/0' },
      { id: 'ad_campaign_window', at: now.toISOString(), outcome: 'ok', detail: '0/0/0' },
      { id: 'rental_payment_expiry', at: now.toISOString(), outcome: 'ok', detail: '2' },
      { id: 'subscription_expiry', at: now.toISOString(), outcome: 'ok', detail: '0' },
    ]);
  });

  it('turns a throw into a failed row, which is what alerts Super Admin', () => {
    const { failures } = runDueJobs(now, { ...handlers, rental_payment_expiry: () => { throw new Error('expire_failed'); } }, justRan);
    expect(failures).toEqual([
      { id: 'rental_payment_expiry', at: now.toISOString(), outcome: 'failed', detail: 'expire_failed' },
    ]);
  });

  it('is safe to run twice: a job that just ran is not due again', () => {
    const handler = vi.fn(() => 0);
    const first = runDueJobs(now, { rental_payment_expiry: handler, publish_due_content: () => 0 }, []);
    const second = runDueJobs(now, { rental_payment_expiry: handler, publish_due_content: () => 0 }, first.runs);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(second.runs).toEqual([]);
  });

  it('reports a due job with no handler as not wired rather than skipping it', () => {
    const { runs } = runDueJobs(now, {}, []);
    // Every job in the registry has a data source now, so a due job without a
    // handler is a gap the log must show instead of hiding.
    expect(runs.map((run) => run.id).sort()).toEqual([
      'ad_campaign_window',
      'publish_due_content',
      'rental_payment_expiry',
      'subscription_expiry',
    ]);
    expect(runs.every((run) => run.outcome === 'not_wired')).toBe(true);
  });

  it('marks every registry entry as wired once its data exists', () => {
    expect(JOBS.filter((job) => !job.wired)).toEqual([]);
  });

  it('records a wired job that has no handler, so the gap is visible', () => {
    const { runs } = runDueJobs(now, {}, [
      { id: 'rental_payment_expiry', at: '2026-11-23T00:00:00Z', outcome: 'ok', detail: '0' },
      { id: 'publish_due_content', at: '2026-11-23T00:00:00Z', outcome: 'ok', detail: '0/0' },
    ]);
    // Both jobs just ran, so their missing handlers are what the tick reports;
    // the hourly subscription job is due too and has no handler either.
    expect(runs).toEqual([
      { id: 'publish_due_content', at: now.toISOString(), outcome: 'not_wired', detail: '' },
      { id: 'ad_campaign_window', at: now.toISOString(), outcome: 'not_wired', detail: '' },
      { id: 'rental_payment_expiry', at: now.toISOString(), outcome: 'not_wired', detail: '' },
      { id: 'subscription_expiry', at: now.toISOString(), outcome: 'not_wired', detail: '' },
    ]);
  });

  it('keys off the last run per job, not the newest row overall', () => {
    // A row for one job cannot delay another job that has not run yet.
    const due = dueJobs(now, { ...lastRun, renewal_reminders: '2026-11-23T00:09:00Z' });
    expect(due).toContain('rental_payment_expiry');
    expect(due).not.toContain('renewal_reminders');
  });
});

describe('a failed job alerts Super Admin (Plan §16D Phase 0 gate)', () => {
  const now = at('2026-11-23T00:10:00Z');

  it('puts one bell notice per failure, naming the job and the error', () => {
    alertJobFailures(
      [{ id: 'rental_payment_expiry', at: now.toISOString(), outcome: 'failed', detail: 'expire_failed' }],
      'Scheduled job failed',
    );
    const rows = readStaffNotifications();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Scheduled job failed');
    expect(rows[0].message).toBe('rental_payment_expiry · expire_failed');
    expect(rows[0].read).toBe(false);
  });

  it('also writes a feed row that only Super Admin may see', () => {
    alertJobFailures(
      [{ id: 'rental_payment_expiry', at: now.toISOString(), outcome: 'failed', detail: 'expire_failed' }],
      'Scheduled job failed',
    );
    const rows = readFeed();
    expect(rows).toHaveLength(1);
    expect(rows[0].event).toBe('job_failed');
    expect(rows[0].href).toBe('/super-admin');
    expect(canSee(rows[0], { role: 'Super Admin' })).toBe(true);
    expect(canSee(rows[0], { role: 'Ads Admin' })).toBe(false);
  });

  it('raises nothing when every job succeeded', () => {
    alertJobFailures([], 'Scheduled job failed');
    expect(readStaffNotifications()).toEqual([]);
  });

  it('persists the run so a reload does not repeat it', () => {
    runDueJobs(now, handlers, []);
    expect(readJobRuns()).toEqual([
      { id: 'publish_due_content', at: now.toISOString(), outcome: 'ok', detail: '0/0' },
      { id: 'ad_campaign_window', at: now.toISOString(), outcome: 'ok', detail: '0/0/0' },
      { id: 'rental_payment_expiry', at: now.toISOString(), outcome: 'ok', detail: '2' },
      { id: 'subscription_expiry', at: now.toISOString(), outcome: 'ok', detail: '0' },
    ]);
    // The stored row is what stops the next tick from running it again.
    expect(runDueJobs(now, handlers, readJobRuns()).runs).toEqual([]);
  });
});
