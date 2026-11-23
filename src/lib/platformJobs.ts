import { useCallback } from 'react';
import { applyCampaignWindow, remindEndingCampaigns } from './adCampaignJobs';
import { purgeAdEvents, rollUpAdStats } from './adStore';
import { cleanupOrphanMedia } from './mediaObjects';
import { expireOverdueNow } from './rentalOrders';
import { publishDueContent } from './scheduledPublishing';
import { useLanguage } from './i18n';
import { alertJobFailures, useJobsRunner, type JobHandlers } from './jobs';

/**
 * Plan §16B.7 and the §16D Phase 0 gate ("a failed job alerts Super Admin").
 * Six jobs have real data: rental payment expiry, the scheduled publishing
 * that §10 §4 gives Blog and Travel Guide, the three ad jobs §16A needs
 * (campaign window, statistics roll-up, raw event purge) and the §16B.6 orphan
 * media cleanup. The rest of the
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
    // §16A.6: Approved to Live at `start_at`, Live to Ended at `end_at`. Both
    // moves go through the status machine, so a rerun finds nothing to move.
    ad_campaign_window: () => {
      const { started, ended } = applyCampaignWindow();
      const reminded = remindEndingCampaigns();
      return `${started}/${ended}/${reminded}`;
    },
    // §16A.5: the roll-up replaces every day it recomputes, so a rerun is safe.
    ad_stats_rollup: () => `${rollUpAdStats()}`,
    // §16B.7: raw events are kept 90 days and nothing older.
    ad_events_purge: () => `${purgeAdEvents()}`,
    // §16B.6: an object nothing has referenced for 30 days is removed. The rows
    // go with the object, so a second run finds nothing.
    orphan_media_cleanup: () => `${cleanupOrphanMedia().length}`,
  };

  useJobsRunner(handlers, 60 * 1000, onFailure);
}
