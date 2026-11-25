import { useMemo, useState } from 'react';
import { Store, UserPlus, ShieldOff, ShieldCheck, RefreshCw, KeyRound, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { useAuditRecorder } from '../../lib/adminAudit';
import { pushAdminNotice } from '../../lib/adminNotices';
import { fillPair, translatePair, type TranslationKey } from '../../lib/translations';
import { pushFeedEvent } from '../../lib/notificationFeed';
import { canOpenSection, type WorkspaceSection } from '../../lib/adminWorkspace';
import {
  APPLICATION_STATUSES,
  EMPTY_OWNER_FILTERS,
  applicationCanFollow,
  applicationNextStatuses,
  filterOwners,
  handleApplication,
  oneTimeSignInLink,
  ownerApplications,
  ownerSummary,
  owners,
  renewSubscription,
  setOwnerStatus,
  subscriptionsEndingSoon,
  type ApplicationStatus,
  type OwnerApplicationRow,
  type OwnerFilters,
  type OwnerRow,
  type OwnerStatus,
} from '../../lib/adminOwners';
import { useCollection } from '../../lib/collection';
import { ConfirmDialog, CsvExportButton, NotAllowedState } from './shared/DashboardPieces';
import type { CsvColumn, DestructiveAction } from '../../lib/dashboardPieces';
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
  DANGER_BUTTON,
  GHOST_BUTTON,
  INPUT_CLASS,
  PRIMARY_BUTTON,
  SELECT_CLASS,
  statusTone,
} from './shared/sectionStyles';


/**
 * Plan §3A.8, ticket O-70. Two tabs: the owner applications that arrive from the
 * public form, and the owners themselves.
 *
 * §3A.8: in production an owner account is created by an invitation email, and
 * when the owner has no email the screen offers a one-time link shown once and
 * never stored. There is no password field here for the same reason there is
 * none in Admin Management (§3A.16 criterion 7).
 */

const APPLICATION_STATUS_KEYS: Record<ApplicationStatus, TranslationKey> = {
  new: 'ow_applications_new',
  contacted: 'ow_applications_contacted',
  approved: 'ow_applications_approved',
  rejected: 'ow_applications_rejected',
};

const OWNER_STATUS_KEYS: Record<OwnerStatus, TranslationKey> = {
  pending: 'sec_status_pending',
  active: 'sec_status_active',
  expired: 'sec_status_expired_sub',
  suspended: 'sec_status_suspended',
};

const APPLICATION_CSV: CsvColumn<OwnerApplicationRow>[] = [
  { header: 'id', value: (row) => row.id },
  { header: 'applicant', value: (row) => row.applicant_name },
  { header: 'business', value: (row) => row.business_name },
  { header: 'category', value: (row) => row.category },
  { header: 'city', value: (row) => row.city },
  { header: 'phone', value: (row) => row.phone },
  { header: 'status', value: (row) => row.status },
  { header: 'handled_by', value: (row) => row.handled_by },
  { header: 'note', value: (row) => row.note },
  { header: 'created_at', value: (row) => row.created_at },
];

const OWNER_CSV: CsvColumn<OwnerRow>[] = [
  { header: 'id', value: (row) => row.id },
  { header: 'owner', value: (row) => row.owner_name },
  { header: 'shop', value: (row) => row.shop_name },
  { header: 'username', value: (row) => row.username },
  { header: 'email', value: (row) => row.email },
  { header: 'phone', value: (row) => row.phone },
  { header: 'city', value: (row) => row.city },
  { header: 'category', value: (row) => row.category },
  { header: 'status', value: (row) => row.status },
  { header: 'subscription_end', value: (row) => row.subscription_end },
  { header: 'commission_percent', value: (row) => row.commission_percent },
];

export function OwnersPanel() {
  const { t } = useLanguage();
  const { adminRole, user } = useAuth();
  const audit = useAuditRecorder();
  const applications = useCollection(ownerApplications);
  const ownerRows = useCollection(owners);

  const [tab, setTab] = useState<'applications' | 'owners'>('applications');
  const [filters, setFilters] = useState<OwnerFilters>(EMPTY_OWNER_FILTERS);
  const [applicationFilter, setApplicationFilter] = useState<'all' | ApplicationStatus>('all');
  const [pending, setPending] = useState<{ row: OwnerRow; action: DestructiveAction } | null>(null);
  const [handling, setHandling] = useState<OwnerApplicationRow | null>(null);
  const [handleNote, setHandleNote] = useState('');
  const [oneTime, setOneTime] = useState<{ name: string; link: string } | null>(null);

  const allowed = canOpenSection(adminRole, 'owners' as WorkspaceSection);
  const visibleApplications = useMemo(
    () => (applicationFilter === 'all' ? applications.rows : applications.rows.filter((row) => row.status === applicationFilter)),
    [applications.rows, applicationFilter],
  );
  const visibleOwners = useMemo(() => filterOwners(ownerRows.rows, filters), [ownerRows.rows, filters]);
  const summary = ownerSummary(ownerRows.rows);
  const endingSoon = subscriptionsEndingSoon(ownerRows.rows);

  if (!allowed) return <NotAllowedState />;

  function notice(titleKey: TranslationKey, bodyKey: TranslationKey, name: string, status?: string) {
    const message = t(bodyKey).replace('{name}', name).replace('{status}', status ?? '');
    pushAdminNotice({ title: t(titleKey), message });
    pushFeedEvent('owner_application', {
      title: translatePair(titleKey),
      message: fillPair(bodyKey, { name, status: status ?? '' }),
      recipients: [{ kind: 'role', value: 'Super Admin' }],
    });
  }

  function handle(row: OwnerApplicationRow, status: ApplicationStatus) {
    if (!applicationCanFollow(row.status, status)) return;
    const next = handleApplication(row, status, user?.name ?? 'staff', handleNote);
    applications.save(applications.rows.map((entry) => (entry.id === row.id ? next : entry)));
    audit({
      action: 'updated',
      objectType: 'owner_application',
      objectId: row.id,
      summary: `${row.business_name} · ${row.status} → ${status}${handleNote ? ` · ${handleNote.trim()}` : ''}`,
      source: 'owners',
    });
    notice('ow_notice_handled_title', 'ow_notice_handled_body', row.business_name, t(APPLICATION_STATUS_KEYS[status]));
    setHandling(null);
    setHandleNote('');
  }

  function changeOwnerStatus(row: OwnerRow, status: OwnerStatus, reason: string) {
    const next = setOwnerStatus(row, status);
    ownerRows.save(ownerRows.rows.map((entry) => (entry.id === row.id ? next : entry)));
    audit({
      action: 'updated',
      objectType: 'owner_application',
      objectId: row.id,
      summary: `${row.shop_name} · ${row.status} → ${status} · ${reason}`,
      source: 'owners',
    });
    notice('ow_notice_status_title', 'ow_notice_status_body', row.shop_name, t(OWNER_STATUS_KEYS[status]));
    setPending(null);
  }

  function renew(row: OwnerRow) {
    const next = renewSubscription(row);
    ownerRows.save(ownerRows.rows.map((entry) => (entry.id === row.id ? next : entry)));
    audit({ action: 'updated', objectType: 'owner_application', objectId: row.id, summary: `${row.shop_name} · renewed to ${next.subscription_end}`, source: 'owners' });
    pushAdminNotice({ title: t('ow_notice_renewed_title'), message: t('ow_notice_renewed_body').replace('{name}', row.shop_name) });
  }

  function makeOneTimeLink(row: OwnerRow) {
    const link = oneTimeSignInLink(row.username);
    setOneTime({ name: row.shop_name, link });
    audit({ action: 'updated', objectType: 'owner_application', objectId: row.id, summary: `${row.shop_name} · one-time link issued`, source: 'owners' });
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-3">
      <SectionHeader kickerKey="ow_kicker" titleKey="ow_title" introKey="ow_intro">
        <CsvExportButton section="owners" columns={tab === 'applications' ? APPLICATION_CSV : OWNER_CSV} rows={tab === 'applications' ? visibleApplications : visibleOwners} />
      </SectionHeader>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryCard icon={Store} label={t('ow_summary_owners')} value={String(summary.total)} tone="cyan" />
        <SummaryCard icon={ShieldCheck} label={t('ow_summary_active')} value={String(summary.active)} tone="green" />
        <SummaryCard icon={UserPlus} label={t('ow_summary_pending')} value={String(summary.pending)} tone="amber" />
        <SummaryCard icon={ShieldOff} label={t('ow_summary_expired')} value={String(summary.expired)} tone="purple" />
      </div>

      {endingSoon.length > 0 && (
        <p className="rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-[11px] text-amber-100">
          {t('ov_attention_subscriptions')}: {endingSoon.map((row) => row.shop_name).join(', ')}
        </p>
      )}

      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setTab('applications')}
          className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${tab === 'applications' ? 'bg-[#168df4] text-white' : 'border border-[#2b527d] text-slate-300'}`}
        >
          {t('ow_tab_applications')} ({applications.rows.filter((row) => row.status === 'new').length})
        </button>
        <button
          type="button"
          onClick={() => setTab('owners')}
          className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${tab === 'owners' ? 'bg-[#168df4] text-white' : 'border border-[#2b527d] text-slate-300'}`}
        >
          {t('ow_tab_owners')}
        </button>
      </div>

      {tab === 'applications' ? (
        <Panel>
          <PanelTitle icon={UserPlus} title={t('ow_tab_applications')} />
          <div className="border-b border-[#244668] bg-[#091a31] p-2">
            <Field label={t('sec_col_status')}>
              <select value={applicationFilter} onChange={(event) => setApplicationFilter(event.target.value as typeof applicationFilter)} className={INPUT_CLASS}>
                <option value="all">{t('sa_all')}</option>
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(APPLICATION_STATUS_KEYS[status])}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {visibleApplications.length === 0 ? (
            <div className="p-3">
              <EmptyState />
            </div>
          ) : (
            <TableWrap minWidth={1040}>
              <TableHead>
                <tr>
                  <Th>{t('sec_col_business')}</Th>
                  <Th>{t('sec_col_applicant')}</Th>
                  <Th>{t('sec_col_category')}</Th>
                  <Th>{t('sec_col_city')}</Th>
                  <Th>{t('sec_col_phone')}</Th>
                  <Th>{t('sec_col_status')}</Th>
                  <Th>{t('sec_col_submitted')}</Th>
                  <Th>{t('sec_col_actions')}</Th>
                </tr>
              </TableHead>
              <tbody>
                {visibleApplications.map((row) => {
                  const next = applicationNextStatuses(row.status);
                  return (
                    <TableRow key={row.id}>
                      <Td className="font-semibold text-white">{row.business_name}</Td>
                      <Td>{row.applicant_name}</Td>
                      <Td>{row.category}</Td>
                      <Td>{row.city}</Td>
                      <Td className="whitespace-nowrap">{row.phone}</Td>
                      <Td>
                        <StatusPill tone={statusTone(row.status)}>{t(APPLICATION_STATUS_KEYS[row.status])}</StatusPill>
                      </Td>
                      <Td className="whitespace-nowrap text-slate-400">{row.created_at.slice(0, 10)}</Td>
                      <Td>
                        {next.length === 0 ? (
                          <span className="text-[10px] text-slate-500">{row.handled_by ? `${t('ow_application_handled_by')}: ${row.handled_by}` : '—'}</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {next.map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => {
                                  setHandling(row);
                                  setHandleNote(row.note);
                                }}
                                className={status === 'rejected' ? DANGER_BUTTON : GHOST_BUTTON}
                              >
                                {t(APPLICATION_STATUS_KEYS[status])}
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
      ) : (
        <Panel>
          <PanelTitle icon={Store} title={t('ow_tab_owners')} />
          <div className="grid gap-2 border-b border-[#244668] bg-[#091a31] p-2 sm:grid-cols-4">
            <Field label={t('sec_col_city')}>
              <select value={filters.city} onChange={(event) => setFilters({ ...filters, city: event.target.value })} className={SELECT_CLASS}>
                <option value="all">{t('sa_all')}</option>
                {[...new Set(ownerRows.rows.map((row) => row.city))].map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('sec_col_category')}>
              <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })} className={SELECT_CLASS}>
                <option value="all">{t('sa_all')}</option>
                {[...new Set(ownerRows.rows.map((row) => row.category))].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('sec_col_status')}>
              <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as OwnerFilters['status'] })} className={SELECT_CLASS}>
                <option value="all">{t('sa_all')}</option>
                {(['pending', 'active', 'expired', 'suspended'] as OwnerStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {t(OWNER_STATUS_KEYS[status])}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-end gap-2 pb-1 text-[11px] text-slate-200">
              <input type="checkbox" checked={filters.pendingOnly} onChange={(event) => setFilters({ ...filters, pendingOnly: event.target.checked })} />
              {t('ow_pending_only')}
            </label>
          </div>

          {visibleOwners.length === 0 ? (
            <div className="p-3">
              <EmptyState />
            </div>
          ) : (
            <TableWrap minWidth={1080}>
              <TableHead>
                <tr>
                  <Th>{t('sec_col_shop')}</Th>
                  <Th>{t('sec_col_owner')}</Th>
                  <Th>{t('sec_col_city')}</Th>
                  <Th>{t('sec_col_status')}</Th>
                  <Th>{t('sec_col_subscription')}</Th>
                  <Th>{t('sec_col_commission_rate')}</Th>
                  <Th>{t('sec_col_actions')}</Th>
                </tr>
              </TableHead>
              <tbody>
                {visibleOwners.map((row) => (
                  <TableRow key={row.id}>
                    <Td className="font-semibold text-white">
                      {row.shop_name}
                      <span className="block text-[10px] text-slate-400">{row.category}</span>
                    </Td>
                    <Td>
                      {row.owner_name}
                      <span className="block text-[10px] text-slate-400">{row.email || row.phone}</span>
                    </Td>
                    <Td>{row.city}</Td>
                    <Td>
                      <StatusPill tone={statusTone(row.status)}>{t(OWNER_STATUS_KEYS[row.status])}</StatusPill>
                    </Td>
                    <Td className="whitespace-nowrap text-slate-300">{row.subscription_end ?? '—'}</Td>
                    <Td>{row.commission_percent}%</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        <button type="button" onClick={() => renew(row)} className={GHOST_BUTTON}>
                          <RefreshCw size={12} /> {t('ow_action_renew')}
                        </button>
                        {row.status === 'suspended' ? (
                          <button type="button" onClick={() => changeOwnerStatus(row, 'active', 'restored')} className={GHOST_BUTTON}>
                            {t('ow_action_restore')}
                          </button>
                        ) : (
                          <button type="button" onClick={() => setPending({ row, action: 'suspend_owner' })} className={GHOST_BUTTON}>
                            {t('ow_action_suspend')}
                          </button>
                        )}
                        {!row.email && (
                          <button type="button" onClick={() => makeOneTimeLink(row)} className={GHOST_BUTTON}>
                            <KeyRound size={12} /> {t('ow_one_time_link')}
                          </button>
                        )}
                      </div>
                    </Td>
                  </TableRow>
                ))}
              </tbody>
            </TableWrap>
          )}
          <p className="px-3 pb-2 pt-1 text-[10px] text-slate-500">{t('ow_no_email_hint')}</p>
        </Panel>
      )}

      {handling && (
        <Panel>
          <PanelTitle icon={UserPlus} title={`${t('ow_action_handle')} · ${handling.business_name}`} />
          <div className="p-2">
            <Field label={t('ow_application_note')}>
              <textarea rows={2} value={handleNote} onChange={(event) => setHandleNote(event.target.value)} className={INPUT_CLASS} />
            </Field>
            <div className="mt-2 flex flex-wrap gap-1">
              {applicationNextStatuses(handling.status).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handle(handling, status)}
                  className={status === 'rejected' ? DANGER_BUTTON : PRIMARY_BUTTON}
                >
                  {t(APPLICATION_STATUS_KEYS[status])}
                </button>
              ))}
              <button type="button" onClick={() => setHandling(null)} className={GHOST_BUTTON}>
                {t('sa_cancel')}
              </button>
            </div>
          </div>
        </Panel>
      )}

      {oneTime && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 p-3" role="dialog" aria-modal="true" aria-label={t('ow_one_time_link')}>
          <div className="w-full max-w-md rounded-lg border border-[#315985] bg-[#081a31] p-3">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-extrabold text-white">{oneTime.name}</h2>
              <button type="button" onClick={() => setOneTime(null)} aria-label={t('sec_close')} className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <p className="mt-2 break-all rounded bg-[#0b203b] px-2 py-1.5 font-mono text-[11px] text-cyan-200">{oneTime.link}</p>
            <p className="mt-2 text-[10px] text-slate-500">{t('ow_no_email_hint')}</p>
            <button type="button" onClick={() => setOneTime(null)} className={`${PRIMARY_BUTTON} mt-3`}>
              {t('sec_close')}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pending !== null}
        action={pending?.action ?? 'suspend_owner'}
        objectName={pending?.row.shop_name ?? ''}
        onCancel={() => setPending(null)}
        onConfirm={(reason) => {
          if (pending) changeOwnerStatus(pending.row, 'suspended', reason);
        }}
      />
    </div>
  );
}
