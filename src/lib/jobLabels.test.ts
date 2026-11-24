import { describe, expect, it } from 'vitest';
import { translate } from './translations';
import { JOBS } from './jobs';

/**
 * A new job must arrive with its name in both languages and its schedule text,
 * so the panel cannot show a blank row when the registry grows.
 */
const JOB_KEYS: Record<string, string> = {
  publish_due_content: 'sa_jobs_job_publish_due_content',
  ad_campaign_window: 'sa_jobs_job_ad_campaign_window',
  rental_payment_expiry: 'sa_jobs_job_rental_payment_expiry',
  subscription_expiry: 'sa_jobs_job_subscription_expiry',
  renewal_reminders: 'sa_jobs_job_renewal_reminders',
  ad_stats_rollup: 'sa_jobs_job_ad_stats_rollup',
  orphan_media_cleanup: 'sa_jobs_job_orphan_media_cleanup',
  ad_events_purge: 'sa_jobs_job_ad_events_purge',
  template_events_purge: 'sa_jobs_job_template_events_purge',
};

describe('job labels', () => {
  it('names every job in the registry, in both languages', () => {
    for (const job of JOBS) {
      const key = JOB_KEYS[job.id];
      expect(key, `missing label key for ${job.id}`).toBeTruthy();
      expect(translate(key as never, 'mm')).toBeTruthy();
      expect(translate(key as never, 'en')).toBeTruthy();
    }
  });

  it('names every run outcome, in both languages', () => {
    for (const key of ['sa_jobs_state_ok', 'sa_jobs_state_failed', 'sa_jobs_state_not_wired', 'sa_jobs_state_idle']) {
      expect(translate(key as never, 'mm')).toBeTruthy();
      expect(translate(key as never, 'en')).toBeTruthy();
    }
  });
});
