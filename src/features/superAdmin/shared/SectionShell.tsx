import type { ReactNode } from 'react';
import { AlertCircle, Inbox, Loader2, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../../../lib/i18n';
import type { TranslationKey } from '../../../lib/translations';

/**
 * Plan §3A.3: "states every section shares — loading skeleton, empty state,
 * error state with a retry, and a not-allowed message". These are the frames
 * every dashboard section draws inside, so the twelve sections of §3A look and
 * behave the same and no section invents its own empty panel.
 */

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-[#294d76] bg-[#0b203b] shadow-xl ${className}`}>{children}</section>;
}

export function PanelTitle({
  icon: Icon,
  title,
  action,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[#244668] px-2 py-1.5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-white">
        <Icon size={17} className="text-[#26b8ff]" />
        {title}
      </h2>
      {action && onAction && (
        <button type="button" onClick={onAction} className="text-xs font-semibold text-[#31c6ff] hover:text-white">
          {action}
        </button>
      )}
    </div>
  );
}

export function SectionHeader({
  kickerKey,
  titleKey,
  introKey,
  children,
}: {
  kickerKey: TranslationKey;
  titleKey: TranslationKey;
  introKey: TranslationKey;
  children?: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{t(kickerKey)}</p>
        <h1 className="mt-1 text-lg font-extrabold text-white sm:text-3xl">{t(titleKey)}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">{t(introKey)}</p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** The honest empty state: no seeded rows, ever (§3A.2 rule 4). */
export function EmptyState({ titleKey = 'sa_empty_title', detailKey = 'sa_empty_detail' }: { titleKey?: TranslationKey; detailKey?: TranslationKey }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-lg border border-dashed border-[#2b527d] bg-[#091b32] px-4 py-10 text-center">
      <Inbox size={28} className="mx-auto text-slate-500" />
      <p className="mt-3 text-sm font-semibold text-slate-200">{t(titleKey)}</p>
      <p className="mx-auto mt-1 max-w-[520px] text-xs leading-5 text-slate-400">{t(detailKey)}</p>
      <p className="mt-2 text-[10px] text-slate-500">{t('sa_empty_backend_note')}</p>
    </div>
  );
}

export function LoadingState() {
  const { t } = useLanguage();
  return (
    <div role="status" className="flex items-center justify-center gap-2 rounded-lg border border-[#294d76] bg-[#0b203b] px-4 py-10 text-xs text-slate-300">
      <Loader2 size={16} className="animate-spin text-cyan-300" /> {t('sec_loading')}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useLanguage();
  return (
    <div role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-8 text-center">
      <AlertCircle size={26} className="mx-auto text-red-300" />
      <p className="mt-2 text-sm font-semibold text-red-100">{t('sec_error_title')}</p>
      <button type="button" onClick={onRetry} className="mt-3 rounded-md bg-red-400/20 px-3 py-1.5 text-xs font-bold text-red-100 hover:bg-red-400/30">
        {t('sec_retry')}
      </button>
    </div>
  );
}

export function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'cyan',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
  tone?: 'cyan' | 'blue' | 'purple' | 'green' | 'amber';
}) {
  const tones: Record<string, string> = {
    cyan: 'text-cyan-300 bg-cyan-400/10',
    blue: 'text-blue-300 bg-blue-400/10',
    purple: 'text-purple-300 bg-purple-400/10',
    green: 'text-green-300 bg-green-400/10',
    amber: 'text-amber-300 bg-amber-400/10',
  };
  return (
    <div className="rounded-xl border border-[#294d76] bg-[#0b203b] p-3 shadow-xl">
      <span className={`inline-flex rounded-lg p-2 ${tones[tone]}`}>
        <Icon size={16} />
      </span>
      <p className="mt-2 text-xl font-extrabold text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-200">{label}</p>
      {detail && <p className="mt-1 text-[10px] text-slate-400">{detail}</p>}
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`inline-block rounded-full px-2 py-1 text-[9px] font-bold ${tone}`}>{children}</span>;
}

/** A labelled field in a form, so every form on every section matches. */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10px] text-slate-500">{hint}</span>}
    </label>
  );
}

export function TableWrap({ children, minWidth = 820 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[11px]" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-[#091a31] text-slate-300">{children}</thead>;
}

export function TableRow({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={`border-t border-[#1d3a5c] text-slate-200 ${onClick ? 'cursor-pointer hover:bg-white/5' : ''}`}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-2 py-2 align-top ${className}`}>{children}</td>;
}

export function Th({ children }: { children: ReactNode }) {
  return <th className="px-2 py-2 font-semibold">{children}</th>;
}
