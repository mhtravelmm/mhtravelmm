import { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { useCurrency } from '../../lib/currency';
import { useAuditRecorder } from '../../lib/adminAudit';
import type { TranslationKey } from '../../lib/translations';
import { canOpenSection, type WorkspaceSection } from '../../lib/adminWorkspace';
import {
  REPORT_DEFINITIONS,
  canRunReport,
  reportDefinition,
  reportRangeValid,
  reportRuns,
  reportsForRole,
  type ReportId,
  type ReportRow,
} from '../../lib/adminReports';
import { buildLocalReport } from '../../lib/adminReportBuilder';
import { newId, useCollection } from '../../lib/collection';
import { myanmarToday, addDaysToDay } from '../../lib/myanmarTime';
import { CsvExportButton, NotAllowedState } from './shared/DashboardPieces';
import {
  EmptyState,
  Field,
  Panel,
  PanelTitle,
  SectionHeader,
  TableHead,
  TableRow,
  TableWrap,
  Td,
  Th,
} from './shared/SectionShell';
import {
  INPUT_CLASS,
  PRIMARY_BUTTON,
  SELECT_CLASS,
} from './shared/sectionStyles';


/**
 * Plan §3A.13, ticket O-68. Each report has a date range in Myanmar Time,
 * filters, a table and a CSV export. `admin_report(p_report, p_from, p_to,
 * p_filters)` returns the rows on the server; this module builds the same rows
 * from the browser stores while the flag is off.
 *
 * §3A.13's role column is enforced here as well as in the sidebar: a role that
 * cannot run a report is not offered it, and asking for one it may not run is
 * refused rather than silently answered.
 */

const REPORT_LABEL_KEYS: Record<ReportId, TranslationKey> = {
  revenue: 'rp_report_revenue',
  bookings: 'rp_report_bookings',
  users: 'rp_report_users',
  owners: 'rp_report_owners',
  content: 'rp_report_content',
  ads: 'rp_report_ads',
  search: 'rp_report_search',
  rentals: 'rp_report_rentals',
  payouts: 'rp_report_payouts',
};

const COLUMN_LABEL_KEYS: Record<string, TranslationKey> = {
  day: 'sec_col_date',
  source: 'rp_source',
  gross_usd: 'sec_col_gross',
  commission_usd: 'sec_col_commission',
  net_usd: 'sec_col_net',
  category: 'sec_col_category',
  city: 'sec_col_city',
  status: 'sec_col_status',
  count: 'sec_col_count',
  total_usd: 'sec_col_total',
  signups: 'rp_signups',
  active: 'rp_active_users',
  revenue_share_usd: 'rp_revenue_share',
  listing: 'sec_col_listing',
  views: 'rp_views',
  favorites: 'rp_favorites',
  reviews: 'rp_reviews',
  campaign: 'rp_campaign',
  impressions: 'rp_impressions',
  clicks: 'rp_clicks',
  spend_usd: 'sec_col_spend',
  query: 'rp_query',
  results: 'rp_results',
  orders: 'rp_orders',
  revenue_usd: 'rp_revenue',
  batch: 'rp_batch',
  ledger_usd: 'rp_ledger',
  paid_usd: 'rp_paid',
  difference_usd: 'rp_difference',
};

function labelFor(key: string, t: (key: TranslationKey) => string): string {
  const translationKey = COLUMN_LABEL_KEYS[key];
  return translationKey ? t(translationKey) : key;
}

export function ReportsPanel() {
  const { t } = useLanguage();
  const { adminRole, user } = useAuth();
  const { formatPrice } = useCurrency();
  const audit = useAuditRecorder();
  const runs = useCollection(reportRuns);

  const allowedReports = useMemo(() => reportsForRole(adminRole), [adminRole]);
  const [selected, setSelected] = useState<ReportId | null>(allowedReports[0]?.id ?? null);
  const today = myanmarToday();
  const [from, setFrom] = useState(addDaysToDay(today, -29));
  const [to, setTo] = useState(today);
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);

  const allowed = canOpenSection(adminRole, 'reports' as WorkspaceSection);
  const definition = selected ? reportDefinition(selected) : undefined;
  const rangeOk = reportRangeValid(from, to);

  if (!allowed) return <NotAllowedState />;
  if (allowedReports.length === 0) {
    return (
      <div className="mx-auto max-w-[900px] space-y-3">
        <SectionHeader kickerKey="rp_kicker" titleKey="rp_title" introKey="rp_intro" />
        <Panel>
          <div className="p-3">
            <EmptyState titleKey="rp_no_role" detailKey="sec_empty_hint" />
          </div>
        </Panel>
      </div>
    );
  }

  function run() {
    if (!selected || !rangeOk) {
      setRefusal(t('rp_range_invalid'));
      return;
    }
    if (!canRunReport(adminRole, selected)) {
      setRefusal(t('common_error_forbidden'));
      return;
    }
    setRefusal(null);
    const next = buildLocalReport(selected, from, to);
    setRows(next);
    runs.save([
      { id: newId('run'), report: selected, from, to, row_count: next.length, run_at: new Date().toISOString(), run_by: user?.name ?? 'staff' },
      ...runs.rows,
    ]);
    audit({ action: 'exported', objectType: 'report_run', objectId: selected, summary: `${selected} · ${from} → ${to} · ${next.length} rows`, source: 'reports' });
  }

  const csvColumns = (definition?.columns ?? []).map((column) => ({
    header: labelFor(column.key, t),
    value: (row: ReportRow) => row[column.key],
  }));

  return (
    <div className="mx-auto max-w-[1100px] space-y-3">
      <SectionHeader kickerKey="rp_kicker" titleKey="rp_title" introKey="rp_intro">
        {rows && csvColumns.length > 0 && <CsvExportButton section={`report-${selected}`} columns={csvColumns} rows={rows} />}
      </SectionHeader>

      <Panel>
        <PanelTitle icon={TrendingUp} title={t('rp_pick')} />
        <div className="grid gap-2 p-2 sm:grid-cols-4">
          <Field label={t('rp_pick')}>
            <select value={selected ?? ''} onChange={(event) => { setSelected(event.target.value as ReportId); setRows(null); }} className={SELECT_CLASS}>
              {allowedReports.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {t(REPORT_LABEL_KEYS[entry.id])}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('rp_from')}>
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field label={t('rp_to')}>
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <div className="self-end">
            <button type="button" onClick={run} disabled={!rangeOk} className={PRIMARY_BUTTON}>
              {t('rp_run')}
            </button>
          </div>
        </div>
        {refusal && (
          <p role="alert" className="mx-3 mb-2 rounded border border-amber-400/40 bg-amber-400/10 px-2 py-1.5 text-[11px] text-amber-100">
            {refusal}
          </p>
        )}
      </Panel>

      <Panel>
        <PanelTitle icon={TrendingUp} title={definition ? t(REPORT_LABEL_KEYS[definition.id]) : t('rp_title')} />
        {rows === null ? (
          <p className="px-3 py-6 text-center text-[11px] text-slate-400">{t('rp_run')}</p>
        ) : rows.length === 0 ? (
          <div className="p-3">
            <EmptyState titleKey="rp_no_rows" detailKey="sec_empty_hint" />
          </div>
        ) : (
          <TableWrap minWidth={760}>
            <TableHead>
              <tr>
                {(definition?.columns ?? []).map((column) => (
                  <Th key={column.key}>{labelFor(column.key, t)}</Th>
                ))}
              </tr>
            </TableHead>
            <tbody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  {(definition?.columns ?? []).map((column) => {
                    const value = row[column.key];
                    const isMoney = column.key.endsWith('_usd');
                    return <Td key={column.key}>{isMoney && typeof value === 'number' ? formatPrice(value) : String(value ?? '—')}</Td>;
                  })}
                </TableRow>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      {runs.rows.length > 0 && (
        <Panel>
          <PanelTitle icon={TrendingUp} title={t('rp_last_run')} />
          <ul className="divide-y divide-[#1d3a5c] text-[11px]">
            {runs.rows.slice(0, 5).map((run) => (
              <li key={run.id} className="flex items-center justify-between gap-2 px-3 py-1.5 text-slate-300">
                <span>{t(REPORT_LABEL_KEYS[run.report])}</span>
                <span className="text-[10px] text-slate-500">
                  {run.from} → {run.to} · {run.row_count} {t('sec_rows')} · {run.run_by}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <p className="text-center text-[10px] text-slate-500">{REPORT_DEFINITIONS.length} reports defined</p>
    </div>
  );
}
