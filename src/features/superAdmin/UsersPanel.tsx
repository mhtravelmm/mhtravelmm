import { useMemo, useState } from 'react';
import { Download, KeyRound, LogOut, ShieldOff, ShieldCheck, Trash2, UserRound, Users, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { useAuditRecorder } from '../../lib/adminAudit';
import { pushAdminNotice } from '../../lib/adminNotices';
import { fillPair, translatePair, type TranslationKey } from '../../lib/translations';
import { pushFeedEvent } from '../../lib/notificationFeed';
import { canOpenSection, type WorkspaceSection } from '../../lib/adminWorkspace';
import {
  adminUsers,
  anonymizeUser,
  filterUsers,
  restoreUser,
  suspendUser,
  userExportJson,
  userSummary,
  type AdminUserRow,
  type UserFilter,
} from '../../lib/adminUsers';
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
  SELECT_CLASS,
  statusTone,
} from './shared/sectionStyles';


/**
 * Plan §3A.6, ticket O-62. Every traveler account, for support and safety. The
 * list, the detail drawer and the five actions all write through `adminUsers`,
 * and each write records one audit row (§16B.2) and tells the traveler in both
 * languages (§16B.4).
 *
 * §3A.6 also says what is *not* here: no password is ever shown, a role cannot
 * be changed from this screen (only Admin Management does that), and there is no
 * impersonation in this product.
 */

const PAGE_SIZE = 20;

const CSV_COLUMNS: CsvColumn<AdminUserRow>[] = [
  { header: 'id', value: (row) => row.id },
  { header: 'name', value: (row) => row.name },
  { header: 'username', value: (row) => row.username },
  { header: 'email', value: (row) => row.email },
  { header: 'phone', value: (row) => row.phone },
  { header: 'joined_at', value: (row) => row.joined_at },
  { header: 'last_sign_in_at', value: (row) => row.last_sign_in_at },
  { header: 'language', value: (row) => row.language },
  { header: 'status', value: (row) => row.status },
  { header: 'bookings', value: (row) => row.bookings },
  { header: 'reviews', value: (row) => row.reviews },
  { header: 'favorites', value: (row) => row.favorites },
  { header: 'reports_against', value: (row) => row.reports_against },
];

const STATUS_KEYS: Record<string, TranslationKey> = {
  active: 'sec_status_active',
  suspended: 'sec_status_suspended',
};

export function UsersPanel() {
  const { t } = useLanguage();
  const { adminRole } = useAuth();
  const audit = useAuditRecorder();
  const { rows, save } = useCollection(adminUsers);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<UserFilter>('all');
  const [joinedFrom, setJoinedFrom] = useState('');
  const [joinedTo, setJoinedTo] = useState('');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);

  // §3A.2 rule 7: the heaviest actions go through the type-to-confirm dialog.
  const [pending, setPending] = useState<{ row: AdminUserRow; action: DestructiveAction } | null>(null);

  const allowed = canOpenSection(adminRole, 'users' as WorkspaceSection);

  const filtered = useMemo(() => {
    const base = filterUsers(rows, query, filter);
    return base.filter((row) => {
      if (joinedFrom && row.joined_at < joinedFrom) return false;
      if (joinedTo && row.joined_at > joinedTo) return false;
      return true;
    });
  }, [rows, query, filter, joinedFrom, joinedTo]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const summary = userSummary(rows);
  const detail = rows.find((row) => row.id === detailId) ?? null;

  if (!allowed) return <NotAllowedState />;

  function notice(titleKey: TranslationKey, bodyKey: TranslationKey, name: string) {
    pushAdminNotice({ title: t(titleKey), message: t(bodyKey).replace('{name}', name) });
    pushFeedEvent('admin_notice', {
      title: translatePair(titleKey),
      message: fillPair(bodyKey, { name }),
      recipients: [{ kind: 'role', value: 'Admin' }],
    });
  }

  function applySuspend(row: AdminUserRow, reason: string) {
    save(rows.map((entry) => (entry.id === row.id ? suspendUser(entry, reason) : entry)));
    audit({ action: 'updated', objectType: 'user', objectId: row.id, summary: `${row.name} · suspended · ${reason}`, source: 'admin_workspace' });
    notice('usr_notice_suspended_title', 'usr_notice_suspended_body', row.name);
    setPending(null);
  }

  function applyDelete(row: AdminUserRow, reason: string) {
    save(rows.map((entry) => (entry.id === row.id ? anonymizeUser(entry) : entry)));
    audit({ action: 'deleted', objectType: 'user', objectId: row.id, summary: `${row.name} · anonymized · ${reason}`, source: 'admin_workspace' });
    notice('usr_notice_deleted_title', 'usr_notice_deleted_body', row.name);
    setPending(null);
    setDetailId(null);
  }

  function restore(row: AdminUserRow) {
    save(rows.map((entry) => (entry.id === row.id ? restoreUser(entry) : entry)));
    audit({ action: 'updated', objectType: 'user', objectId: row.id, summary: `${row.name} · restored`, source: 'admin_workspace' });
    notice('usr_notice_restored_title', 'usr_notice_restored_body', row.name);
  }

  function sendReset(row: AdminUserRow) {
    // No password is generated: the server sends a set-password link (§3A.16
    // criterion 7). The browser record only records that it was asked for.
    audit({ action: 'updated', objectType: 'user', objectId: row.id, summary: `${row.name} · password reset requested`, source: 'admin_workspace' });
    notice('usr_notice_reset_title', 'usr_notice_reset_body', row.name);
  }

  function signOutEverywhere(row: AdminUserRow) {
    audit({ action: 'updated', objectType: 'user', objectId: row.id, summary: `${row.name} · all sessions ended`, source: 'admin_workspace' });
    notice('usr_notice_signout_title', 'usr_notice_signout_body', row.name);
  }

  function exportJson(row: AdminUserRow) {
    const blob = new Blob([userExportJson(row)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `mh-travel-user-${row.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    audit({ action: 'exported', objectType: 'user', objectId: row.id, summary: `${row.name} · JSON export`, source: 'admin_workspace' });
    notice('usr_notice_export_title', 'usr_notice_export_body', row.name);
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-3">
      <SectionHeader kickerKey="usr_kicker" titleKey="usr_title" introKey="usr_intro">
        <label className="flex items-center gap-2 rounded-lg border border-[#2b527d] bg-[#0b203b] px-2.5 py-1.5">
          <UserRound size={14} className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={t('usr_search')}
            aria-label={t('usr_search')}
            className="min-w-0 bg-transparent text-[11px] text-white outline-none placeholder:text-slate-500"
          />
        </label>
        <CsvExportButton section="users" columns={CSV_COLUMNS} rows={filtered} />
      </SectionHeader>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <SummaryCard icon={Users} label={t('usr_summary_total')} value={String(summary.total)} tone="cyan" />
        <SummaryCard icon={ShieldCheck} label={t('usr_summary_active')} value={String(summary.active)} tone="green" />
        <SummaryCard icon={ShieldOff} label={t('usr_summary_suspended')} value={String(summary.suspended)} tone="amber" />
      </div>

      <Panel>
        <PanelTitle icon={Users} title={t('usr_title')} />
        <div className="grid gap-2 border-b border-[#244668] bg-[#091a31] p-2 sm:grid-cols-3">
          <Field label={t('usr_filter_status')}>
            <select
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value as UserFilter);
                setPage(1);
              }}
              className={SELECT_CLASS}
            >
              <option value="all">{t('sa_all')}</option>
              <option value="active">{t('sec_status_active')}</option>
              <option value="suspended">{t('sec_status_suspended')}</option>
            </select>
          </Field>
          <Field label={t('usr_filter_joined_from')}>
            <input type="date" value={joinedFrom} onChange={(event) => setJoinedFrom(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field label={t('usr_filter_joined_to')}>
            <input type="date" value={joinedTo} onChange={(event) => setJoinedTo(event.target.value)} className={INPUT_CLASS} />
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#244668] px-3 py-1.5 text-[10px] text-slate-400">
          <span>
            {t('sec_showing')} <strong className="text-cyan-300">{visible.length}</strong> {t('sec_of')} {filtered.length} {t('sec_rows')}
          </span>
          <span>{t('usr_page_of').replace('{page}', String(current)).replace('{pages}', String(pages))}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-3">
            <EmptyState />
          </div>
        ) : (
          <TableWrap minWidth={960}>
            <TableHead>
              <tr>
                <Th>{t('sec_col_name')}</Th>
                <Th>{t('sec_col_email')}</Th>
                <Th>{t('sec_col_phone')}</Th>
                <Th>{t('sec_col_joined')}</Th>
                <Th>{t('sec_col_last_sign_in')}</Th>
                <Th>{t('sec_col_language')}</Th>
                <Th>{t('sec_col_status')}</Th>
                <Th>{t('sec_col_bookings')}</Th>
                <Th>{t('sec_col_actions')}</Th>
              </tr>
            </TableHead>
            <tbody>
              {visible.map((row) => (
                <TableRow key={row.id}>
                  <Td className="font-semibold text-white">
                    <button type="button" onClick={() => setDetailId(row.id)} className="hover:text-cyan-300">
                      {row.name}
                    </button>
                    <span className="block text-[10px] text-slate-400">{row.username}</span>
                  </Td>
                  <Td>{row.email || '—'}</Td>
                  <Td className="whitespace-nowrap">{row.phone || '—'}</Td>
                  <Td className="whitespace-nowrap">{row.joined_at}</Td>
                  <Td className="whitespace-nowrap text-slate-400">{row.last_sign_in_at ? row.last_sign_in_at.slice(0, 10) : '—'}</Td>
                  <Td>{row.language === 'mm' ? 'မြန်မာ' : 'English'}</Td>
                  <Td>
                    <StatusPill tone={statusTone(row.status)}>{t(STATUS_KEYS[row.status])}</StatusPill>
                  </Td>
                  <Td>{row.bookings}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <button type="button" onClick={() => setDetailId(row.id)} className={GHOST_BUTTON}>
                        {t('usr_action_view')}
                      </button>
                      {row.status === 'active' ? (
                        <button type="button" onClick={() => setPending({ row, action: 'suspend_user' })} className={GHOST_BUTTON}>
                          {t('usr_action_suspend')}
                        </button>
                      ) : (
                        <button type="button" onClick={() => restore(row)} className={GHOST_BUTTON}>
                          {t('usr_action_restore')}
                        </button>
                      )}
                      <button type="button" onClick={() => setPending({ row, action: 'delete' })} className={DANGER_BUTTON}>
                        {t('usr_action_delete')}
                      </button>
                    </div>
                  </Td>
                </TableRow>
              ))}
            </tbody>
          </TableWrap>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-[#244668] px-3 py-2">
          <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)} className={GHOST_BUTTON}>
            {t('usr_prev')}
          </button>
          <button type="button" disabled={current >= pages} onClick={() => setPage(current + 1)} className={GHOST_BUTTON}>
            {t('usr_next')}
          </button>
        </div>
      </Panel>

      {detail && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-black/60" role="dialog" aria-modal="true" aria-label={t('usr_detail_title')}>
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-[#315985] bg-[#081a31] p-3">
            <div className="flex items-start justify-between gap-2 border-b border-[#244668] pb-2">
              <div>
                <h2 className="text-sm font-extrabold text-white">{detail.name}</h2>
                <p className="text-[11px] text-slate-400">{detail.username}</p>
              </div>
              <button type="button" onClick={() => setDetailId(null)} aria-label={t('sec_close')} className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <dt className="text-slate-400">{t('sec_col_email')}</dt>
                <dd className="text-white">{detail.email || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">{t('sec_col_phone')}</dt>
                <dd className="text-white">{detail.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">{t('sec_col_joined')}</dt>
                <dd className="text-white">{detail.joined_at}</dd>
              </div>
              <div>
                <dt className="text-slate-400">{t('sec_col_status')}</dt>
                <dd>
                  <StatusPill tone={statusTone(detail.status)}>{t(STATUS_KEYS[detail.status])}</StatusPill>
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">{t('sec_col_bookings')}</dt>
                <dd className="text-white">{detail.bookings}</dd>
              </div>
              <div>
                <dt className="text-slate-400">{t('sec_col_reviews')}</dt>
                <dd className="text-white">{detail.reviews}</dd>
              </div>
              <div>
                <dt className="text-slate-400">{t('usr_reports_against')}</dt>
                <dd className="text-white">{detail.reports_against}</dd>
              </div>
              <div>
                <dt className="text-slate-400">{t('sec_col_last_sign_in')}</dt>
                <dd className="text-white">{detail.last_sign_in_at ? detail.last_sign_in_at.slice(0, 10) : '—'}</dd>
              </div>
            </dl>

            {detail.status === 'suspended' && detail.suspended_reason && (
              <p className="mt-3 rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-1.5 text-[11px] text-amber-100">
                {t('usr_suspended_note').replace('{reason}', detail.suspended_reason)}
              </p>
            )}

            <div className="mt-4 space-y-1.5">
              {detail.status === 'active' ? (
                <button type="button" onClick={() => setPending({ row: detail, action: 'suspend_user' })} className={`${GHOST_BUTTON} w-full justify-center`}>
                  <ShieldOff size={13} /> {t('usr_action_suspend')}
                </button>
              ) : (
                <button type="button" onClick={() => restore(detail)} className={`${GHOST_BUTTON} w-full justify-center`}>
                  <ShieldCheck size={13} /> {t('usr_action_restore')}
                </button>
              )}
              <button type="button" onClick={() => sendReset(detail)} className={`${GHOST_BUTTON} w-full justify-center`}>
                <KeyRound size={13} /> {t('usr_action_reset')}
              </button>
              <button type="button" onClick={() => signOutEverywhere(detail)} className={`${GHOST_BUTTON} w-full justify-center`}>
                <LogOut size={13} /> {t('usr_action_sign_out')}
              </button>
              <button type="button" onClick={() => exportJson(detail)} className={`${GHOST_BUTTON} w-full justify-center`}>
                <Download size={13} /> {t('usr_action_export')}
              </button>
              <button type="button" onClick={() => setPending({ row: detail, action: 'delete' })} className={`${DANGER_BUTTON} w-full justify-center`}>
                <Trash2 size={13} /> {t('usr_action_delete')}
              </button>
            </div>

            <p className="mt-3 text-[10px] leading-4 text-slate-500">{t('usr_detail_no_impersonation')}</p>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pending !== null}
        action={pending?.action ?? 'suspend_user'}
        objectName={pending?.row.name ?? ''}
        onCancel={() => setPending(null)}
        onConfirm={(reason) => {
          if (!pending) return;
          if (pending.action === 'delete') applyDelete(pending.row, reason);
          else applySuspend(pending.row, reason);
        }}
      />
    </div>
  );
}
