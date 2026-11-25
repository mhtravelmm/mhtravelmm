import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Download, RotateCcw, ShieldAlert, X } from 'lucide-react';
import { useLanguage } from '../../../lib/i18n';
import type { TranslationKey } from '../../../lib/translations';
import {
  buildCsv,
  checkConfirm,
  csvFileName,
  requiresTypedName,
  type ConfirmDraft,
  type ConfirmProblem,
  type CsvColumn,
  type DestructiveAction,
} from '../../../lib/dashboardPieces';

/**
 * Plan §3A.14 and §3A.2 rule 7, ticket O-71. The four pieces every dashboard
 * section shares. The rules live in `dashboardPieces.ts` and are tested there;
 * these components render them and own the focus.
 */

const PROBLEM_KEYS: Record<ConfirmProblem, TranslationKey> = {
  reason_missing: 'confirm_problem_reason_missing',
  reason_too_short: 'confirm_problem_reason_too_short',
  name_mismatch: 'confirm_problem_name_mismatch',
};

/**
 * The type-to-confirm dialog. §3A.2 rule 7: every destructive action asks for a
 * reason and the heaviest also ask the actor to type the object's name, so a
 * mis-click cannot remove an account or a shop.
 */
export function ConfirmDialog({
  open,
  action,
  objectName,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  action: DestructiveAction;
  objectName: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<ConfirmDraft>({ action, objectName, reason: '', typedName: '' });
  const [problem, setProblem] = useState<ConfirmProblem | null>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraft({ action, objectName, reason: '', typedName: '' });
    setProblem(null);
    reasonRef.current?.focus();
  }, [open, action, objectName]);

  if (!open) return null;

  function submit() {
    const check = checkConfirm(draft);
    if (!check.ok) {
      setProblem(check.problem);
      return;
    }
    onConfirm(check.reason);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-3">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('confirm_title')}
        className="w-full max-w-md rounded-t-xl border border-[#315985] bg-[#081a31] shadow-2xl sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-2 border-b border-[#244668] px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-300" />
            <div>
              <h2 className="text-sm font-extrabold text-white">{t('confirm_title')}</h2>
              <p className="mt-0.5 text-[11px] text-slate-300">{objectName}</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label={t('confirm_cancel')}>
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">{t('confirm_reason_label')}</span>
            <textarea
              ref={reasonRef}
              value={draft.reason}
              onChange={(event) => setDraft({ ...draft, reason: event.target.value })}
              rows={3}
              placeholder={t('confirm_reason_placeholder')}
              className="w-full rounded-md border border-[#2b527d] bg-[#0b203b] px-2.5 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
            />
          </label>

          {requiresTypedName(action) && (
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">{t('confirm_type_name_label')}</span>
              <input
                value={draft.typedName}
                onChange={(event) => setDraft({ ...draft, typedName: event.target.value })}
                className="w-full rounded-md border border-[#2b527d] bg-[#0b203b] px-2.5 py-2 text-xs text-white outline-none focus:border-cyan-400"
              />
            </label>
          )}

          {problem && (
            <p role="alert" className="rounded bg-red-500/15 px-2 py-1.5 text-[11px] text-red-200">{t(PROBLEM_KEYS[problem])}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#244668] px-4 py-3">
          <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10">{t('confirm_cancel')}</button>
          <button type="button" onClick={submit} className="rounded-md bg-red-500/90 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500">{t('confirm_submit')}</button>
        </div>
      </div>
    </div>
  );
}

/**
 * §3A.14: an export writes exactly the rows the screen's filters show. The
 * caller passes the filtered rows, so this cannot widen a filter by accident.
 */
export function CsvExportButton<T>({
  section,
  columns,
  rows,
  onExported,
}: {
  section: string;
  columns: CsvColumn<T>[];
  rows: T[];
  onExported?: (rowCount: number, fileName: string) => void;
}) {
  const { t } = useLanguage();

  function download() {
    const fileName = csvFileName(section, new Date());
    const blob = new Blob([buildCsv(columns, rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    onExported?.(rows.length, fileName);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="inline-flex items-center gap-1.5 rounded-md border border-[#2b527d] bg-[#0e2b53] px-2.5 py-1.5 text-[11px] font-semibold text-cyan-200 hover:border-cyan-400 hover:text-white"
    >
      <Download size={13} /> {t('common_export_csv')}
    </button>
  );
}

/** §3A.4 and §16B.8: the state a section shows when the role may not open it. */
export function NotAllowedState() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-[560px] rounded-lg border border-dashed border-[#2b527d] bg-[#091b32] px-4 py-12 text-center">
      <ShieldAlert size={30} className="mx-auto text-slate-500" />
      <p className="mt-3 text-sm font-semibold text-slate-200">{t('common_not_allowed_title')}</p>
      <p className="mx-auto mt-1 max-w-[420px] text-xs leading-5 text-slate-400">{t('common_not_allowed_detail')}</p>
    </div>
  );
}

/**
 * §3A.14: a stale save is refused with `common_error_version_conflict` and the
 * editor offers Reload. Reload is the only action, because saving again would
 * overwrite the other person's work.
 */
export function VersionConflictNotice({ onReload }: { onReload: () => void }) {
  const { t } = useLanguage();
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2">
      <p className="text-[11px] text-amber-100">{t('common_error_version_conflict')}</p>
      <button type="button" onClick={onReload} className="inline-flex items-center gap-1.5 rounded bg-amber-400/20 px-2 py-1 text-[11px] font-bold text-amber-100 hover:bg-amber-400/30">
        <RotateCcw size={12} /> {t('common_reload')}
      </button>
    </div>
  );
}
