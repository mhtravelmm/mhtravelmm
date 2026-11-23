import { useCallback } from 'react';
import { expireOverdueNow } from './rentalOrders';
import { useLanguage } from './i18n';
import { alertJobFailures, useJobsRunner, type JobHandlers } from './jobs';

/**
 * Plan §16B.7 and the §16D Phase 0 gate ("a failed job alerts Super Admin").
 * Only the rental payment expiry has real data today; the rest of the schedule
 * stays in the registry unwired, so the jobs page can show what is left to build
 * instead of pretending the work is done.
 */
export function usePlatformJobs(): void {
  const { t } = useLanguage();

  const onFailure = useCallback(
    (failures: Parameters<typeof alertJobFailures>[0]) => alertJobFailures(failures, t('sa_jobs_failed_title')),
    [t],
  );

  const handlers: JobHandlers = {
    // Expiry is idempotent: a second pass over the same orders changes nothing.
    rental_payment_expiry: () => {
      const expired = expireOverdueNow();
      return `${expired}`;
    },
  };

  useJobsRunner(handlers, 60 * 1000, onFailure);
}
