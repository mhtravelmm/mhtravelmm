import { useCallback, useEffect, useRef, useState } from 'react';
import { pushAdminNotice } from './adminNotices';
import { pushFeedEvent } from './notificationFeed';

/**
 * Plan §16B.7: every job is safe to run twice, logs its result, and notifies
 * Super Admin when it fails. The registry is the whole schedule, so a reader can
 * tell which jobs are wired and which are waiting for their table.
 */

export type JobId =
  | 'publish_due_content'
  | 'ad_campaign_window'
  | 'rental_payment_expiry'
  | 'subscription_expiry'
  | 'renewal_reminders'
  | 'ad_stats_rollup'
  | 'orphan_media_cleanup'
  | 'ad_events_purge';

/** An interval, or a daily wall-clock time in Myanmar Time (`HH:MM`). */
export type JobSchedule = { everyMs: number } | { dailyAt: string };

export type JobDefinition = {
  id: JobId;
  schedule: JobSchedule;
  /** False while the data the job reads is still browser-only or unbuilt. */
  wired: boolean;
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export const JOBS: JobDefinition[] = [
  { id: 'publish_due_content', schedule: { everyMs: MINUTE }, wired: true },
  { id: 'ad_campaign_window', schedule: { everyMs: MINUTE }, wired: true },
  { id: 'rental_payment_expiry', schedule: { everyMs: 5 * MINUTE }, wired: true },
  { id: 'subscription_expiry', schedule: { everyMs: HOUR }, wired: true },
  { id: 'renewal_reminders', schedule: { dailyAt: '09:00' }, wired: true },
  { id: 'ad_stats_rollup', schedule: { dailyAt: '00:30' }, wired: true },
  { id: 'orphan_media_cleanup', schedule: { dailyAt: '02:00' }, wired: true },
  { id: 'ad_events_purge', schedule: { dailyAt: '00:00' }, wired: true },
];

const DAY_MS = 24 * HOUR;
const MYANMAR_OFFSET_MS = (6 * 60 + 30) * MINUTE;

export function jobById(id: JobId): JobDefinition | undefined {
  return JOBS.find((job) => job.id === id);
}

/**
 * The first instant `hhmm` occurs in Myanmar Time strictly after `after`. The
 * wall clock is shifted into Myanmar Time, floored to the day, then shifted
 * back, so the answer needs no timezone database and does not move when the
 * viewer's own zone changes for DST.
 */
export function nextDailyRun(hhmm: string, after: Date): number {
  const [hour, minute] = hhmm.split(':').map(Number);
  const wallNow = after.getTime() + MYANMAR_OFFSET_MS;
  let candidate = wallNow - (wallNow % DAY_MS) + hour * HOUR + minute * MINUTE;
  if (candidate <= wallNow) candidate += DAY_MS;
  return candidate - MYANMAR_OFFSET_MS;
}

/**
 * When the job is next due. An interval job that has never run is due at once,
 * which is how the rental expiry check catches up on a tab opened after a long
 * gap; a daily job waits for its first wall-clock time instead.
 */
export function nextRunAt(schedule: JobSchedule, lastRunAt: string | undefined, now: Date): number {
  if ('everyMs' in schedule) {
    return lastRunAt ? new Date(lastRunAt).getTime() + schedule.everyMs : 0;
  }
  return nextDailyRun(schedule.dailyAt, lastRunAt ? new Date(lastRunAt) : now);
}

export function dueJobs(now: Date, lastRunAt: Partial<Record<JobId, string>>): JobId[] {
  return JOBS.filter((job) => nextRunAt(job.schedule, lastRunAt[job.id], now) <= now.getTime()).map((job) => job.id);
}

/** A handler does the work and returns a one-line result for the log. */
export type JobHandler = () => string | number;
export type JobHandlers = Partial<Record<JobId, JobHandler>>;

export type JobOutcome = 'ok' | 'failed' | 'not_wired';

export type JobRun = {
  id: JobId;
  at: string;
  outcome: JobOutcome;
  /** What the run did, or the error code when it failed. */
  detail: string;
};

const RUNS_KEY = 'mh-travel-job-runs';
const RUNS_EVENT = 'mh-travel-job-runs-changed';
const MAX_RUNS = 200;

export function readJobRuns(): JobRun[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RUNS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row): row is JobRun => Boolean(row) && typeof (row as JobRun).id === 'string');
  } catch {
    return [];
  }
}

function writeJobRuns(runs: JobRun[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RUNS_KEY, JSON.stringify(runs.slice(0, MAX_RUNS)));
  window.dispatchEvent(new Event(RUNS_EVENT));
}

/** The most recent run of each job, which is what the schedule counts from. */
export function lastRunsById(runs: JobRun[]): Partial<Record<JobId, string>> {
  const latest: Partial<Record<JobId, string>> = {};
  for (const run of runs) {
    if (!latest[run.id] || run.at > latest[run.id]!) latest[run.id] = run.at;
  }
  return latest;
}

export type RunDueResult = { runs: JobRun[]; failures: JobRun[] };

/**
 * Runs every due job that has a handler, appends one row per attempt, and
 * returns the failures so the caller can alert. A job with no handler is
 * recorded as `not_wired` rather than silently skipped, so the panel can show
 * how much of the schedule is real.
 */
export function runDueJobs(now: Date, handlers: JobHandlers, runs: JobRun[] = readJobRuns()): RunDueResult {
  const lastRunAt = lastRunsById(runs);
  const produced: JobRun[] = [];
  const failures: JobRun[] = [];

  for (const id of dueJobs(now, lastRunAt)) {
    const handler = handlers[id];
    if (!handler) {
      // An unwired job is skipped without a row, otherwise every tick would
      // append the same "nothing to run" line and bury the real runs.
      if (jobById(id)?.wired) produced.push({ id, at: now.toISOString(), outcome: 'not_wired', detail: '' });
      continue;
    }
    try {
      const detail = handler();
      produced.push({ id, at: now.toISOString(), outcome: 'ok', detail: String(detail) });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown';
      const run: JobRun = { id, at: now.toISOString(), outcome: 'failed', detail };
      produced.push(run);
      failures.push(run);
    }
  }

  if (produced.length) writeJobRuns([...produced, ...runs]);
  return { runs: produced, failures };
}

/** Plan §16B.7 and §16B.3: a failed job alerts Super Admin, in the bell they
 * already read and in the shared feed row the table names. */
export function alertJobFailures(failures: JobRun[], title: string): void {
  for (const failure of failures) {
    const at = new Date(failure.at);
    const message = `${failure.id} · ${failure.detail}`;
    pushAdminNotice({ title, message }, at);
    pushFeedEvent('job_failed', { title, message, href: '/super-admin', at });
  }
}

/** The whole schedule ticked on one timer; each job keeps its own cadence. */
export function useJobsRunner(handlers: JobHandlers, intervalMs = MINUTE, onFailure?: (failures: JobRun[]) => void): void {
  // The caller rebuilds `handlers` every render, so the timer keys off the
  // interval alone; a handler read one render late is still the same job.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const onFailureRef = useRef(onFailure);
  onFailureRef.current = onFailure;

  useEffect(() => {
    const tick = () => {
      const result = runDueJobs(new Date(), handlersRef.current);
      if (result.failures.length) onFailureRef.current?.(result.failures);
    };
    tick();
    const timer = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
}

/** Reader for the jobs page: newest row per job plus the recent history. */
export function useJobRuns() {
  const [runs, setRuns] = useState<JobRun[]>(readJobRuns);

  const sync = useCallback(() => setRuns(readJobRuns()), []);

  useEffect(() => {
    window.addEventListener(RUNS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(RUNS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [sync]);

  return runs;
}
