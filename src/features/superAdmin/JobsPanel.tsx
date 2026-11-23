import { useMemo } from 'react';
import { AlertTriangle, Clock, PlayCircle, ShieldCheck, Timer } from 'lucide-react';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import { fill } from '../../lib/fill';
import { JOBS, dueJobs, lastRunsById, nextRunAt, useJobRuns, type JobId, type JobRun, type JobSchedule } from '../../lib/jobs';
import { myanmarClock } from '../../lib/myanmarTime';

/**
 * Plan §16B.7 reader. The schedule itself is `src/lib/jobs.ts`; this panel only
 * says what is due, what last ran and what failed, so a Super Admin can tell a
 * quiet job from a broken one. §16B.1 keeps settings with Super Admin, so the
 * section is Super Admin only.
 */

const JOB_KEYS: Record<JobId, TranslationKey> = {
  publish_due_content: 'sa_jobs_job_publish_due_content',
  ad_campaign_window: 'sa_jobs_job_ad_campaign_window',
  rental_payment_expiry: 'sa_jobs_job_rental_payment_expiry',
  subscription_expiry: 'sa_jobs_job_subscription_expiry',
  renewal_reminders: 'sa_jobs_job_renewal_reminders',
  ad_stats_rollup: 'sa_jobs_job_ad_stats_rollup',
  orphan_media_cleanup: 'sa_jobs_job_orphan_media_cleanup',
  ad_events_purge: 'sa_jobs_job_ad_events_purge',
};

const OUTCOME_KEYS: Record<JobRun['outcome'], TranslationKey> = {
  ok: 'sa_jobs_state_ok',
  failed: 'sa_jobs_state_failed',
  not_wired: 'sa_jobs_state_not_wired',
};

/**
 * The result cell. A run that changed nothing says so rather than reporting
 * "0 expired", which reads like a failure to anyone scanning the table. Each
 * job reports its own counts, so the wording follows the job rather than
 * assuming every handler expires orders.
 */
function detailLabel(run: JobRun | undefined, t: (key: TranslationKey) => string): string {
  if (!run) return '—';
  if (run.outcome === 'failed') return run.detail || t('sa_jobs_state_failed');
  if (run.outcome !== 'ok') return '—';
  if (!run.detail || run.detail === '0' || run.detail === '0/0') return t('sa_jobs_detail_none');
  if (run.id === 'publish_due_content') {
    const [blog = '0', guide = '0'] = run.detail.split('/');
    return fill(t('sa_jobs_detail_published'), { blog, guide });
  }
  return fill(t('sa_jobs_detail_expired'), { count: run.detail });
}

function scheduleLabel(schedule: JobSchedule, t: (key: TranslationKey) => string): string {
  if ('dailyAt' in schedule) return fill(t('sa_jobs_daily_at'), { time: schedule.dailyAt });
  const minutes = Math.round(schedule.everyMs / 60000);
  if (minutes === 1) return t('sa_jobs_every_minute');
  if (minutes === 60) return t('sa_jobs_every_hour');
  return fill(t('sa_jobs_every_minutes'), { count: String(minutes) });
}

function Stat({ icon: Icon, label, value, tone = 'text-cyan-300' }: { icon: typeof Clock; label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-[#294d76] bg-[#0b203b] p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        <Icon size={12} className={tone} /> {label}
      </div>
      <p className={`mt-1 text-lg font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

export function JobsPanel() {
  const { t } = useLanguage();
  const runs = useJobRuns();

  const view = useMemo(() => {
    const lastRuns = lastRunsById(runs);
    const now = new Date();
    const due = new Set(dueJobs(now, lastRuns));
    const rows = JOBS.map((job) => {
      const latest = runs.find((run) => run.id === job.id);
      return { job, latest, due: due.has(job.id), next: nextRunAt(job.schedule, lastRuns[job.id], now) };
    });
    return {
      rows,
      wired: JOBS.filter((job) => job.wired).length,
      failures: runs.filter((run) => run.outcome === 'failed').length,
    };
  }, [runs]);

  return (
    <div className="mx-auto max-w-[1200px] space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{t('sa_jobs_kicker')}</p>
        <h1 className="mt-1 text-lg font-extrabold sm:text-3xl">{t('sa_jobs_title')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">{t('sa_jobs_intro')}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat icon={Timer} label={t('sa_jobs_total')} value={String(JOBS.length)} />
        <Stat icon={ShieldCheck} label={t('sa_jobs_wired')} value={`${view.wired}/${JOBS.length}`} tone="text-green-300" />
        <Stat icon={AlertTriangle} label={t('sa_jobs_failures')} value={String(view.failures)} tone={view.failures ? 'text-red-300' : 'text-slate-300'} />
      </div>

      <section className="rounded-lg border border-[#294d76] bg-[#0b203b] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[11px]">
            <thead className="bg-[#091a31] text-slate-300">
              <tr>
                <th className="px-4 py-3">{t('sa_jobs_col_job')}</th>
                <th className="px-2 py-3">{t('sa_jobs_col_schedule')}</th>
                <th className="px-2 py-3">{t('sa_jobs_last_run')}</th>
                <th className="px-2 py-3">{t('sa_jobs_next_due')}</th>
                <th className="px-2 py-3">{t('sa_jobs_col_state')}</th>
                <th className="px-4 py-3">{t('sa_jobs_col_detail')}</th>
              </tr>
            </thead>
            <tbody>
              {view.rows.map(({ job, latest, due, next }) => {
                const state = !job.wired ? 'not_wired' : latest ? latest.outcome : 'idle';
                return (
                  <tr key={job.id} className="border-t border-[#1d3a5c] text-slate-200">
                    <td className="px-4 py-2 font-semibold">{t(JOB_KEYS[job.id])}</td>
                    <td className="px-2 py-2 text-slate-400">{scheduleLabel(job.schedule, t)}</td>
                    <td className="px-2 py-2 text-slate-400">{latest ? `${myanmarClock(latest.at)} · ${latest.at.slice(0, 10)}` : t('sa_jobs_never')}</td>
                    <td className="px-2 py-2">
                      {job.wired ? (
                        <span className={due ? 'font-semibold text-amber-300' : 'text-slate-400'}>
                          {due ? t('sa_jobs_due_now') : myanmarClock(new Date(next).toISOString())}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${
                        state === 'ok' ? 'bg-green-500/25 text-green-300'
                          : state === 'failed' ? 'bg-red-500/25 text-red-200'
                            : state === 'not_wired' ? 'bg-slate-500/25 text-slate-300'
                              : 'bg-cyan-500/20 text-cyan-200'
                      }`}>
                        {state === 'idle' ? t('sa_jobs_state_idle') : t(OUTCOME_KEYS[state])}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-400">{detailLabel(latest, t)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-[#294d76] bg-[#0b203b] p-3">
        <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-300">
          <PlayCircle size={13} className="text-cyan-300" /> {t('sa_jobs_history')}
        </h2>
        {runs.length === 0 ? (
          <p className="mt-2 text-[11px] text-slate-500">{t('sa_jobs_history_empty')}</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {runs.slice(0, 20).map((run) => (
              <li key={`${run.id}-${run.at}`} className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span className="font-mono text-slate-500">{run.at.slice(0, 10)} · {myanmarClock(run.at)}</span>
                <span className="font-semibold text-slate-200">{t(JOB_KEYS[run.id])}</span>
                <span className={run.outcome === 'failed' ? 'text-red-300' : run.outcome === 'ok' ? 'text-green-300' : 'text-slate-400'}>
                  {t(OUTCOME_KEYS[run.outcome])}
                </span>
                <span className="text-slate-500">· {detailLabel(run, t)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
