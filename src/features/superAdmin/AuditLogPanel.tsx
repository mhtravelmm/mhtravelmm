import { useMemo, useState } from 'react';
import { Clock, Search, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAdminAudit } from '../../lib/adminAudit';
import type { AdminAuditAction } from '../../lib/adminAudit';
import { ACTION_KEYS, ACTION_TONES, AUDIT_ACTIONS, OBJECT_KEYS, SOURCE_KEYS } from '../../lib/adminAuditLabels';

/**
 * Plan §16B.2 reader. §16B.1 keeps "Settings and roles" with Super Admin, so the
 * log is Super Admin only and is not scoped by actor.
 */
export function AuditLogPanel() {
  const { t } = useLanguage();
  const { entries } = useAdminAudit();
  const [query, setQuery] = useState('');
  const [action, setAction] = useState<AdminAuditAction | 'all'>('all');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (action !== 'all' && entry.action !== action) return false;
      if (!needle) return true;
      return `${entry.actor} ${entry.objectId} ${entry.summary} ${entry.objectType}`.toLowerCase().includes(needle);
    });
  }, [entries, query, action]);

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: entries.length,
      actors: new Set(entries.map((entry) => entry.actor)).size,
      today: entries.filter((entry) => entry.at.slice(0, 10) === today).length,
      objects: new Set(entries.map((entry) => entry.objectType)).size,
    };
  }, [entries]);

  return (
    <div className="mx-auto max-w-[1200px] space-y-3">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{t('sa_audit_kicker')}</p>
          <h1 className="mt-1 text-lg font-extrabold sm:text-3xl">{t('sa_audit_title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{t('sa_audit_intro')}</p>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-[#2b527d] bg-[#0b203b] px-2.5 py-1.5">
          <Search size={14} className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('sa_audit_search')}
            aria-label={t('sa_audit_search')}
            className="min-w-0 flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-slate-500"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon={ShieldCheck} label={t('sa_audit_total')} value={String(summary.total)} />
        <Stat icon={Clock} label={t('sa_audit_today')} value={String(summary.today)} />
        <Stat icon={ShieldCheck} label={t('sa_audit_actors')} value={String(summary.actors)} />
        <Stat icon={ShieldCheck} label={t('sa_audit_objects')} value={String(summary.objects)} />
      </div>

      <section className="rounded-lg border border-[#294d76] bg-[#0b203b] shadow-xl">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#244668] p-2">
          {(['all', ...AUDIT_ACTIONS] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setAction(option)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${action === option ? 'bg-[#168df4] text-white' : 'border border-[#2b527d] text-slate-300 hover:bg-white/5'}`}
            >
              {option === 'all' ? t('sa_audit_filter_all') : t(ACTION_KEYS[option])}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[11px]">
            <thead className="bg-[#091a31] text-slate-300">
              <tr>
                <th className="px-3 py-2">{t('sa_audit_col_at')}</th>
                <th className="px-2 py-2">{t('sa_audit_col_actor')}</th>
                <th className="px-2 py-2">{t('sa_audit_col_role')}</th>
                <th className="px-2 py-2">{t('sa_audit_col_action')}</th>
                <th className="px-2 py-2">{t('sa_audit_col_object')}</th>
                <th className="px-2 py-2">{t('sa_audit_col_summary')}</th>
                <th className="px-3 py-2">{t('sa_audit_col_source')}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((entry) => (
                <tr key={entry.id} className="border-t border-[#1d3a5c] text-slate-200">
                  <td className="whitespace-nowrap px-3 py-2 text-slate-400">{entry.at.slice(0, 16).replace('T', ' ')}</td>
                  <td className="px-2 py-2 font-semibold text-white">{entry.actor}</td>
                  <td className="px-2 py-2 text-slate-300">{entry.actorRole}</td>
                  <td className="px-2 py-2">
                    <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${ACTION_TONES[entry.action]}`}>{t(ACTION_KEYS[entry.action])}</span>
                  </td>
                  <td className="px-2 py-2">
                    <span className="text-slate-300">{t(OBJECT_KEYS[entry.objectType])}</span>
                    <span className="ml-1 text-[10px] text-slate-500">{entry.objectId}</span>
                  </td>
                  <td className="px-2 py-2 text-slate-300">{entry.summary}</td>
                  <td className="px-3 py-2 text-slate-400">{t(SOURCE_KEYS[entry.source])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && <p className="p-6 text-center text-xs text-slate-500">{t('sa_audit_empty')}</p>}
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#294d76] bg-[#0b203b] p-3 shadow-xl">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400"><Icon size={11} /> {label}</p>
      <p className="mt-1 text-lg font-extrabold text-white">{value}</p>
    </div>
  );
}
