import { useCallback } from 'react';
import { expireOverdueNow } from './rentalOrders';
import { publishDueContent } from './scheduledPublishing';
import { useLanguage } from './i18n';
import { alertJobFailures, useJobsRunner, type JobHandlers } from './jobs';

/**
 * Plan §16B.7 and the §16D Phase 0 gate ("a failed job alerts Super Admin").
 * Two jobs have real data today: rental payment expiry and the scheduled
 * publishing that Plan §10 §4 gives Blog and Travel Guide. The rest of the
 * schedule stays in the registry unwired, so the jobs page can show what is
 * left to build instead of pretending the work is done.
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
    // Plan §10 §4: safe to run twice, because a published item has left
    // `Scheduled` and the second pass finds nothing due.
    publish_due_content: () => {
      const { blog, guide } = publishDueContent();
      return `${blog}/${guide}`;
    },
  };

  useJobsRunner(handlers, 60 * 1000, onFailure);
}
