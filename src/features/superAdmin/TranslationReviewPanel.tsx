import { useMemo, useState } from 'react';
import { Check, Languages, Search, Sparkles } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { useTranslationCache } from '../../lib/useLocalizedText';
import { reviewQueue, reviewTranslation } from '../../lib/translationCache';
import { recordAdminAudit } from '../../lib/adminAudit';

/**
 * Plan §16B.4 review queue: the automatic rows, most seen first. Approving or
 * editing makes the text permanent and removes the "Auto-translated" marker,
 * and both are writes, so each one appends an audit row.
 */
export function TranslationReviewPanel() {
  const { t } = useLanguage();
  const { user, adminRole } = useAuth();
  const { rows, setRows } = useTranslationCache();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Record<string, string>>({});

  const queue = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const items = reviewQueue(rows);
    if (!needle) return items;
    return items.filter((row) => `${row.sourceText} ${row.translatedText}`.toLowerCase().includes(needle));
  }, [rows, query]);

  function commit(id: string, approveOnly: boolean) {
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    const edited = approveOnly ? undefined : editing[id];
    const next = reviewTranslation(rows, id, user?.name ?? '', edited);
    setRows(next);
    setEditing((current) => {
      const copy = { ...current };
      delete copy[id];
      return copy;
    });
    recordAdminAudit({
      actor: user?.name ?? '',
      actorRole: adminRole ?? 'system',
      action: 'approved',
      objectType: 'translation',
      objectId: id,
      summary: `${row.fromLang} → ${row.toLang} · ${edited ? 'edited' : 'approved'}`,
      source: 'content',
    });
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-3">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{t('sa_translation_kicker')}</p>
          <h1 className="mt-1 text-lg font-extrabold sm:text-3xl">{t('sa_translation_title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{t('sa_translation_intro')}</p>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-[#2b527d] bg-[#0b203b] px-2.5 py-1.5">
          <Search size={14} className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('sa_translation_search')}
            aria-label={t('sa_translation_search')}
            className="min-w-0 flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-slate-500"
          />
        </label>
      </div>

      <section className="rounded-lg border border-[#294d76] bg-[#0b203b] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#244668] px-3 py-2">
          <h2 className="flex items-center gap-1.5 text-xs font-bold text-white"><Languages size={14} /> {t('sa_translation_queue')}</h2>
          <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-bold text-cyan-200">{queue.length}</span>
        </div>

        {queue.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-slate-400">{t('sa_translation_empty')}</p>
        ) : (
          <ul className="divide-y divide-[#1d3a5c]">
            {queue.map((row) => (
              <li key={row.id} className="px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="rounded-full bg-[#123a63] px-1.5 py-0.5 font-semibold text-cyan-200">{row.fromLang} → {row.toLang}</span>
                  <span className="inline-flex items-center gap-1 text-amber-300"><Sparkles size={10} /> {t('sa_translation_auto')}</span>
                  <span>{t('sa_translation_views').replace('{count}', String(row.views))}</span>
                </div>

                <p className="mt-1.5 text-[11px] leading-5 text-slate-300">{row.sourceText}</p>

                <div className="mt-1.5 flex flex-col gap-1.5 sm:flex-row sm:items-start">
                  <textarea
                    value={editing[row.id] ?? row.translatedText}
                    onChange={(event) => setEditing((current) => ({ ...current, [row.id]: event.target.value }))}
                    aria-label={t('sa_translation_edit_label')}
                    rows={2}
                    className="min-w-0 flex-1 rounded-lg border border-[#2b527d] bg-[#081a31] px-2 py-1.5 text-[11px] text-white outline-none focus:border-cyan-300"
                  />
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => commit(row.id, true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#2f6192] px-2.5 py-1.5 text-[10px] font-semibold text-cyan-200 hover:bg-white/10"
                    >
                      <Check size={12} /> {t('sa_translation_approve')}
                    </button>
                    <button
                      type="button"
                      onClick={() => commit(row.id, false)}
                      className="inline-flex items-center gap-1 rounded-lg bg-cyan-400 px-2.5 py-1.5 text-[10px] font-bold text-[#061426] hover:bg-cyan-300"
                    >
                      {t('sa_translation_save')}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
