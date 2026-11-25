import { readJobRuns, type JobRun } from './jobs';
import { readPayoutRuns, readLedgerRows } from './ownerLedgerStore';
import { latestDueWindow, duePayouts } from './ownerLedger';

/**
 * Plan §3A.5 Needs attention: the counts for the operations rows the Overview
 * shows but does not own. Each read goes through the store its own section
 * uses, so a count here and the list behind its link always agree (§3A.16
 * criterion 4).
 */

/** §16B.7: the last run of each job decides whether it is failing. */
export function failedJobs(runs: JobRun[] = readJobRuns()): JobRun[] {
  const latest = new Map<string, JobRun>();
  for (const run of runs) {
    const seen = latest.get(run.id);
    if (!seen || run.at > seen.at) latest.set(run.id, run);
  }
  return [...latest.values()].filter((run) => run.outcome === 'failed');
}

export function failedJobCount(): number {
  return failedJobs().length;
}

/**
 * §3A.5: "a draft batch for the current period". A window with ledger rows
 * waiting and no run yet is the batch that is due.
 */
export function payoutBatchDue(): number {
  const window = latestDueWindow();
  const rows = readLedgerRows();
  const runs = readPayoutRuns();
  const plans = duePayouts(rows, new Date());
  const unpaid = plans.filter((plan) => !runs.some((run) => run.id === `payout-${plan.shopId}-${window.dueDay}`));
  return unpaid.length;
}
