import { useMemo, useState } from 'react';
import { Map, Plus } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { useCurrency } from '../../lib/currency';
import { useAuditRecorder } from '../../lib/adminAudit';
import { pushAdminNotice } from '../../lib/adminNotices';
import type { TranslationKey } from '../../lib/translations';
import { canOpenSection, type WorkspaceSection } from '../../lib/adminWorkspace';
import {
  PLAN_REQUEST_STATUSES,
  adminPlans,
  movePlanRequest,
  planRequestNextStatuses,
  planRequestSummary,
  planRequests,
  type AdminPlanRow,
  type PlanRequestRow,
  type PlanRequestStatus,
} from '../../lib/adminCities';
import { useCollection, newId } from '../../lib/collection';
import { CsvExportButton, NotAllowedState } from './shared/DashboardPieces';
import type { CsvColumn } from '../../lib/dashboardPieces';
import {
  EmptyState,
  Field,
  Panel,
  PanelTitle,
  SectionHeader,
  StatusPill,
  SummaryCard,
  TableHead,
  TableRow,
  TableWrap,
  Td,
  Th,
} from './shared/SectionShell';
import {
  GHOST_BUTTON,
  INPUT_CLASS,
  PRIMARY_BUTTON,
  statusTone,
} from './shared/sectionStyles';


/**
 * Plan §3A.10, ticket O-64. Two tabs: the public plan cards and the requests
 * travelers send. A new request raises the bell (§3A.5), and a request moves
 * forward only — a quoted request that returned to `new` would be answered
 * twice.
 */

const STATUS_KEYS: Record<PlanRequestStatus, TranslationKey> = {
  new: 'sec_status_new',
  contacted: 'sec_status_contacted',
  quoted: 'sec_status_quoted',
  booked: 'sec_status_booked',
  closed: 'sec_status_closed',
};

type PlanProblem = 'title_required' | 'days_invalid' | 'price_invalid';

const PLAN_PROBLEM_KEYS: Record<PlanProblem, TranslationKey> = {
  title_required: 'pl_problem_title_required',
  days_invalid: 'pl_problem_days_invalid',
  price_invalid: 'pl_problem_price_invalid',
};

const PLAN_CSV: CsvColumn<AdminPlanRow>[] = [
  { header: 'id', value: (row) => row.id },
  { header: 'title_en', value: (row) => row.title_en },
  { header: 'title_mm', value: (row) => row.title_mm },
  { header: 'days', value: (row) => row.days },
  { header: 'price_usd', value: (row) => row.price_usd },
  { header: 'active', value: (row) => (row.active ? 'yes' : 'no') },
];

const REQUEST_CSV: CsvColumn<PlanRequestRow>[] = [
  { header: 'id', value: (row) => row.id },
  { header: 'traveler', value: (row) => row.traveler_name },
  { header: 'phone', value: (row) => row.phone },
  { header: 'cities', value: (row) => row.cities },
  { header: 'days', value: (row) => row.days },
  { header: 'budget_usd', value: (row) => row.budget_usd },
  { header: 'status', value: (row) => row.status },
  { header: 'handled_by', value: (row) => row.handled_by },
  { header: 'created_at', value: (row) => row.created_at },
];

type Draft = Pick<
  AdminPlanRow,
  'id' | 'title_en' | 'title_mm' | 'days' | 'price_usd' | 'includes_en' | 'includes_mm' | 'itinerary_en' | 'itinerary_mm' | 'cover_url' | 'active'
>;

function emptyDraft(): Draft {
  return {
    id: newId('plan'),
    title_en: '',
    title_mm: '',
    days: 1,
    price_usd: 0,
    includes_en: '',
    includes_mm: '',
    itinerary_en: '',
    itinerary_mm: '',
    cover_url: '',
    active: true,
  };
}

function planProblem(draft: Draft): PlanProblem | null {
  if (!draft.title_en.trim() && !draft.title_mm.trim()) return 'title_required';
  if (!Number.isFinite(draft.days) || draft.days < 1) return 'days_invalid';
  if (!Number.isFinite(draft.price_usd) || draft.price_usd < 0) return 'price_invalid';
  return null;
}

export function PlansPanel() {
  const { t } = useLanguage();
  const { adminRole, user } = useAuth();
  const { formatPrice } = useCurrency();
  const audit = useAuditRecorder();
  const plans = useCollection(adminPlans);
  const requests = useCollection(planRequests);

  const [tab, setTab] = useState<'catalog' | 'requests'>('catalog');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | PlanRequestStatus>('all');

  const allowed = canOpenSection(adminRole, 'plans' as WorkspaceSection);
  const problem = draft ? planProblem(draft) : null;
  const summary = planRequestSummary(requests.rows);
  const visibleRequests = useMemo(
    () => (statusFilter === 'all' ? requests.rows : requests.rows.filter((row) => row.status === statusFilter)),
    [requests.rows, statusFilter],
  );

  if (!allowed) return <NotAllowedState />;

  function saveDraft() {
    if (!draft || problem) return;
    const exists = plans.rows.some((row) => row.id === draft.id);
    const next: AdminPlanRow = { ...draft };
    plans.save(exists ? plans.rows.map((row) => (row.id === draft.id ? next : row)) : [...plans.rows, next]);
    audit({
      action: exists ? 'updated' : 'created',
      objectType: 'plan',
      objectId: next.id,
      summary: `${next.title_en} · ${next.days}d · ${next.price_usd} USD`,
      source: 'admin_workspace',
    });
    pushAdminNotice({ title: t('pl_notice_saved_title'), message: t('pl_notice_saved_body').replace('{name}', next.title_en) });
    setDraft(null);
  }

  function moveRequest(row: PlanRequestRow, status: PlanRequestStatus) {
    if (!planRequestNextStatuses(row.status).includes(status)) return;
    const next = movePlanRequest(row, status, user?.name ?? 'staff');
    requests.save(requests.rows.map((entry) => (entry.id === row.id ? next : entry)));
    audit({
      action: 'updated',
      objectType: 'plan',
      objectId: row.id,
      summary: `${row.traveler_name} · ${row.status} → ${status}`,
      source: 'admin_workspace',
    });
    pushAdminNotice({
      title: t('pl_notice_request_title'),
      message: t('pl_notice_request_body').replace('{name}', row.traveler_name).replace('{status}', t(STATUS_KEYS[status])),
    });
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-3">
      <SectionHeader kickerKey="pl_kicker" titleKey="pl_title" introKey="pl_intro">
        {tab === 'catalog' && (
          <button type="button" onClick={() => setDraft(emptyDraft())} className={PRIMARY_BUTTON}>
            <Plus size={14} /> {t('pl_action_new')}
          </button>
        )}
        {tab === 'catalog'
          ? <CsvExportButton section="plans" columns={PLAN_CSV} rows={plans.rows} />
          : <CsvExportButton section="plan-requests" columns={REQUEST_CSV} rows={visibleRequests} />}
      </SectionHeader>

      <div className="grid grid-cols-3 gap-2">
        <SummaryCard icon={Map} label={t('pl_summary_total')} value={String(summary.total)} tone="cyan" />
        <SummaryCard icon={Map} label={t('pl_summary_new')} value={String(summary.new)} tone="amber" />
        <SummaryCard icon={Map} label={t('pl_summary_open')} value={String(summary.open)} tone="green" />
      </div>

      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setTab('catalog')}
          className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${tab === 'catalog' ? 'bg-[#168df4] text-white' : 'border border-[#2b527d] text-slate-300'}`}
        >
          {t('pl_tab_catalog')}
        </button>
        <button
          type="button"
          onClick={() => setTab('requests')}
          className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${tab === 'requests' ? 'bg-[#168df4] text-white' : 'border border-[#2b527d] text-slate-300'}`}
        >
          {t('pl_tab_requests')} ({summary.new})
        </button>
      </div>

      {draft && tab === 'catalog' && (
        <Panel>
          <PanelTitle icon={Map} title={t('pl_form_title')} />
          <div className="grid gap-2 p-2 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t('pl_title_en')}>
              <input value={draft.title_en} onChange={(event) => setDraft({ ...draft, title_en: event.target.value })} className={INPUT_CLASS} />
            </Field>
            <Field label={t('pl_title_mm')}>
              <input value={draft.title_mm} onChange={(event) => setDraft({ ...draft, title_mm: event.target.value })} className={INPUT_CLASS} />
            </Field>
            <Field label={t('pl_days')}>
              <input
                type="number"
                min={1}
                value={draft.days}
                onChange={(event) => setDraft({ ...draft, days: Number(event.target.value) })}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label={t('pl_price')}>
              <input
                type="number"
                min={0}
                value={draft.price_usd}
                onChange={(event) => setDraft({ ...draft, price_usd: Number(event.target.value) })}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label={t('pl_includes_en')}>
              <input value={draft.includes_en} onChange={(event) => setDraft({ ...draft, includes_en: event.target.value })} className={INPUT_CLASS} />
            </Field>
            <Field label={t('pl_includes_mm')}>
              <input value={draft.includes_mm} onChange={(event) => setDraft({ ...draft, includes_mm: event.target.value })} className={INPUT_CLASS} />
            </Field>
            <Field label={t('pl_itinerary_en')}>
              <textarea rows={2} value={draft.itinerary_en} onChange={(event) => setDraft({ ...draft, itinerary_en: event.target.value })} className={INPUT_CLASS} />
            </Field>
            <Field label={t('pl_itinerary_mm')}>
              <textarea rows={2} value={draft.itinerary_mm} onChange={(event) => setDraft({ ...draft, itinerary_mm: event.target.value })} className={INPUT_CLASS} />
            </Field>
            <Field label={t('ct_cover')}>
              <input value={draft.cover_url} onChange={(event) => setDraft({ ...draft, cover_url: event.target.value })} className={INPUT_CLASS} />
            </Field>
            <label className="flex items-center gap-2 text-[11px] text-slate-200">
              <input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />
              {t('sec_col_active')}
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-[#244668] px-3 py-2">
            {problem && (
              <p role="alert" className="w-full rounded border border-red-400/30 bg-red-400/10 px-2 py-1.5 text-[11px] text-red-200">
                {t(PLAN_PROBLEM_KEYS[problem])}
              </p>
            )}
            <button type="button" onClick={saveDraft} disabled={Boolean(problem)} className={PRIMARY_BUTTON}>
              {t('sec_save')}
            </button>
            <button type="button" onClick={() => setDraft(null)} className={GHOST_BUTTON}>
              {t('sa_cancel')}
            </button>
          </div>
        </Panel>
      )}

      {tab === 'catalog' ? (
        <Panel>
          <PanelTitle icon={Map} title={t('pl_tab_catalog')} />
          {plans.rows.length === 0 ? (
            <div className="p-3">
              <EmptyState />
            </div>
          ) : (
            <TableWrap minWidth={860}>
              <TableHead>
                <tr>
                  <Th>{t('sec_col_name')}</Th>
                  <Th>{t('sec_col_days')}</Th>
                  <Th>{t('sec_col_price')}</Th>
                  <Th>{t('sec_col_active')}</Th>
                  <Th>{t('sec_col_actions')}</Th>
                </tr>
              </TableHead>
              <tbody>
                {plans.rows.map((row) => (
                  <TableRow key={row.id}>
                    <Td className="font-semibold text-white">
                      {row.title_en}
                      <span className="block text-[10px] text-slate-400">{row.title_mm}</span>
                    </Td>
                    <Td>{row.days}</Td>
                    <Td>{formatPrice(row.price_usd)}</Td>
                    <Td>
                      <StatusPill tone={statusTone(row.active ? 'active' : 'hidden')}>
                        {row.active ? t('sec_status_active') : t('sec_status_hidden')}
                      </StatusPill>
                    </Td>
                    <Td>
                      <button type="button" onClick={() => setDraft({ ...row })} className={GHOST_BUTTON}>
                        {t('st_edit')}
                      </button>
                    </Td>
                  </TableRow>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      ) : (
        <Panel>
          <PanelTitle icon={Map} title={t('pl_tab_requests')} />
          <div className="border-b border-[#244668] bg-[#091a31] p-2">
            <Field label={t('sec_col_status')}>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className={INPUT_CLASS}>
                <option value="all">{t('sa_all')}</option>
                {PLAN_REQUEST_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(STATUS_KEYS[status])}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {visibleRequests.length === 0 ? (
            <div className="p-3">
              <EmptyState />
            </div>
          ) : (
            <TableWrap minWidth={1000}>
              <TableHead>
                <tr>
                  <Th>{t('pl_request_traveler')}</Th>
                  <Th>{t('sec_col_phone')}</Th>
                  <Th>{t('pl_request_cities')}</Th>
                  <Th>{t('sec_col_days')}</Th>
                  <Th>{t('pl_request_budget')}</Th>
                  <Th>{t('sec_col_status')}</Th>
                  <Th>{t('sec_col_created')}</Th>
                  <Th>{t('sec_col_actions')}</Th>
                </tr>
              </TableHead>
              <tbody>
                {visibleRequests.map((row) => {
                  const next = planRequestNextStatuses(row.status);
                  return (
                    <TableRow key={row.id}>
                      <Td className="font-semibold text-white">{row.traveler_name}</Td>
                      <Td className="whitespace-nowrap">{row.phone}</Td>
                      <Td>{row.cities}</Td>
                      <Td>{row.days}</Td>
                      <Td>{row.budget_usd === null ? '—' : formatPrice(row.budget_usd)}</Td>
                      <Td>
                        <StatusPill tone={statusTone(row.status)}>{t(STATUS_KEYS[row.status])}</StatusPill>
                      </Td>
                      <Td className="whitespace-nowrap text-slate-400">{row.created_at.slice(0, 10)}</Td>
                      <Td>
                        {next.length === 0 ? (
                          <span className="text-[10px] text-slate-500">{t('pl_request_no_next')}</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {next.map((status) => (
                              <button key={status} type="button" onClick={() => moveRequest(row, status)} className={GHOST_BUTTON}>
                                {t(STATUS_KEYS[status])}
                              </button>
                            ))}
                          </div>
                        )}
                      </Td>
                    </TableRow>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      )}
    </div>
  );
}
