import { useMemo, useState } from 'react';
import { UserPlus, Users, ShieldCheck, ShieldOff, Trash2, Send, FileSearch } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { useAuditRecorder } from '../../lib/adminAudit';
import { pushAdminNotice } from '../../lib/adminNotices';
import { fillPair, translatePair, type TranslationKey } from '../../lib/translations';
import { pushFeedEvent } from '../../lib/notificationFeed';
import {
  ADMIN_ROLES,
  CREATABLE_ADMIN_ROLES,
  DEFAULT_PERMISSION_GROUP,
  PERMISSION_GROUPS,
  type AdminRole,
} from '../../lib/adminRoles';
import { planRoleChange } from '../../lib/adminRoleChange';
import { adminSummary, mergeAdminRows, permissionsForRole, type AdminRow } from '../../lib/adminAccounts';
import { adminInvites, type AdminInviteRow } from '../../lib/adminInvites';
import { useCollection, newId } from '../../lib/collection';
import { ConfirmDialog } from './shared/DashboardPieces';
import type { CsvColumn, DestructiveAction } from '../../lib/dashboardPieces';
import { CsvExportButton } from './shared/DashboardPieces';
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
 * Plan §3A.7, ticket O-69. Admin Management on the functions: no password field
 * in production, an invitation instead; statuses; the role change rules of
 * `planRoleChange`; and the type-the-name confirmation for suspending or
 * removing an admin (§3A.2 rule 7).
 *
 * The seven creatable roles come from §16G.5, never Super Admin — a Super Admin
 * creates staff, not peers.
 */

const STATUS_KEYS: Record<AdminInviteRow['status'], TranslationKey> = {
  pending_invite: 'sec_status_pending_invite',
  active: 'sec_status_active',
  suspended: 'sec_status_suspended',
  removed: 'sec_status_removed',
};

const ROLE_CHANGE_KEYS: Record<string, TranslationKey> = {
  not_super_admin: 'common_error_forbidden',
  self: 'common_error_forbidden',
  super_admin_locked: 'common_error_forbidden',
  unchanged: 'sa_saved',
  unknown_role: 'common_error_forbidden',
};

type DirectoryRow = AdminRow & { id: string; status: AdminInviteRow['status'] };

export function AdminManagementPanel({ onOpenAudit }: { onOpenAudit?: () => void }) {
  const { t } = useLanguage();
  const { adminRole, user, adminAccounts } = useAuth();
  const audit = useAuditRecorder();
  const invites = useCollection(adminInvites);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; phone: string; role: AdminRole; group: string }>({
    name: '',
    email: '',
    phone: '',
    role: 'Admin',
    group: DEFAULT_PERMISSION_GROUP.Admin,
  });
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState<{ row: DirectoryRow; action: DestructiveAction } | null>(null);

  /**
   * The table is the accounts the auth store holds, merged with the seeded
   * directory, plus any invitation that has not been accepted yet — so a newly
   * invited person appears at once with `Pending invite`.
   */
  const rows: DirectoryRow[] = useMemo(() => {
    const seeded = mergeAdminRows([], adminAccounts);
    const seededIds = new Set(seeded.map((row) => row.email.toLowerCase()));
    const fromInvites: DirectoryRow[] = invites.rows
      .filter((row) => !seededIds.has(row.email.toLowerCase()))
      .map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        permissions: row.permission_group,
        status: row.status,
        stored: true,
      }));
    const merged: DirectoryRow[] = [
      ...seeded.map((row, index) => ({
        id: `acct-${index}`,
        ...row,
        status: (row.status === 'Active' ? 'active' : 'pending_invite') as AdminInviteRow['status'],
      })),
      ...fromInvites,
    ];
    return merged;
  }, [adminAccounts, invites.rows]);

  const summary = adminSummary(rows);
  const groupsInUse = new Set(rows.map((row) => row.permissions)).size;

  function notice(titleKey: TranslationKey, bodyKey: TranslationKey, name: string) {
    pushAdminNotice({ title: t(titleKey), message: t(bodyKey).replace('{name}', name) });
    pushFeedEvent('admin_notice', {
      title: translatePair(titleKey),
      message: fillPair(bodyKey, { name }),
      recipients: [{ kind: 'role', value: 'Super Admin' }],
    });
  }

  function invite() {
    setFormError('');
    const email = form.email.trim().toLowerCase();
    if (!form.name.trim() || !email) {
      setFormError(t('common_error_forbidden'));
      return;
    }
    if (rows.some((row) => row.email.toLowerCase() === email)) {
      setFormError(t('sa_err_email_in_use'));
      return;
    }
    const row: AdminInviteRow = {
      id: newId('invite'),
      name: form.name.trim(),
      email,
      phone: form.phone.trim(),
      role: form.role,
      permission_group: form.group,
      status: 'pending_invite',
      invited_by: user?.name ?? 'Super Admin',
      invited_at: new Date().toISOString(),
      last_sign_in_at: null,
      note: '',
    };
    invites.save([row, ...invites.rows]);
    audit({
      action: 'created',
      objectType: 'admin_invite',
      objectId: row.id,
      summary: `${row.email} · ${row.role} · ${row.permission_group}`,
      source: 'admins',
    });
    notice('adm_invite_sent_title', 'adm_invite_sent_body', row.name);
    setForm({ name: '', email: '', phone: '', role: 'Admin', group: DEFAULT_PERMISSION_GROUP.Admin });
    setShowForm(false);
  }

  function changeRole(row: DirectoryRow, next: AdminRole) {
    const plan = planRoleChange({
      actorRole: adminRole,
      actorEmail: user?.email ?? '',
      targetEmail: row.email,
      targetRole: row.role,
      nextRole: next,
    });
    if (!plan.ok) {
      if (plan.reason !== 'unchanged') setFormError(t(ROLE_CHANGE_KEYS[plan.reason] ?? 'common_error_forbidden'));
      return;
    }
    invites.save(
      invites.rows.map((entry) =>
        entry.email.toLowerCase() === row.email.toLowerCase()
          ? { ...entry, role: next, permission_group: permissionsForRole(next) }
          : entry,
      ),
    );
    audit({
      action: 'role_change',
      objectType: 'admin_invite',
      objectId: row.id,
      summary: `${row.email} · ${plan.from} → ${plan.to}`,
      source: 'admins',
    });
    setFormError('');
  }

  function resend(row: DirectoryRow) {
    invites.save(
      invites.rows.map((entry) =>
        entry.email.toLowerCase() === row.email.toLowerCase()
          ? { ...entry, invited_at: new Date().toISOString(), status: entry.status === 'pending_invite' ? 'pending_invite' : entry.status }
          : entry,
      ),
    );
    audit({ action: 'updated', objectType: 'admin_invite', objectId: row.id, summary: `${row.email} · invitation resent`, source: 'admins' });
    notice('adm_resend_title', 'adm_resend_body', row.name);
  }

  function applyStatus(row: DirectoryRow, status: AdminInviteRow['status'], reason: string) {
    const patch = (entry: AdminInviteRow) => ({ ...entry, status, note: reason });
    const known = invites.rows.some((entry) => entry.email.toLowerCase() === row.email.toLowerCase());
    if (known) {
      invites.save(invites.rows.map((entry) => (entry.email.toLowerCase() === row.email.toLowerCase() ? patch(entry) : entry)));
    } else {
      // A seeded or auth-store account with no invite row gets one, so the
      // status has somewhere to live rather than being a screen-only change.
      const created: AdminInviteRow = {
        id: newId('invite'),
        name: row.name,
        email: row.email,
        phone: '',
        role: row.role,
        permission_group: row.permissions,
        status,
        invited_by: user?.name ?? 'Super Admin',
        invited_at: new Date().toISOString(),
        last_sign_in_at: null,
        note: reason,
      };
      invites.save([created, ...invites.rows]);
    }
    const action = status === 'removed' ? 'deleted' : 'updated';
    audit({ action, objectType: 'admin_invite', objectId: row.id, summary: `${row.email} · ${status} · ${reason}`, source: 'admins' });
    if (status === 'removed') notice('adm_removed_title', 'adm_removed_body', row.name);
    else if (status === 'suspended') notice('adm_suspended_title', 'adm_suspended_body', row.name);
    else notice('adm_restored_title', 'adm_restored_body', row.name);
    setPending(null);
  }

  const csvColumns: CsvColumn<DirectoryRow>[] = [
    { header: 'name', value: (row) => row.name },
    { header: 'email', value: (row) => row.email },
    { header: 'role', value: (row) => row.role },
    { header: 'permission_group', value: (row) => row.permissions },
    { header: 'status', value: (row) => row.status },
  ];

  return (
    <div className="mx-auto max-w-[1150px] space-y-3">
      <SectionHeader kickerKey="adm_kicker" titleKey="adm_title" introKey="adm_intro">
        <button type="button" onClick={() => setShowForm((open) => !open)} className={PRIMARY_BUTTON}>
          <UserPlus size={14} /> {t('adm_action_invite')}
        </button>
        <CsvExportButton section="admins" columns={csvColumns} rows={rows} />
      </SectionHeader>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryCard icon={Users} label={t('adm_summary_total')} value={String(summary.total)} tone="cyan" />
        <SummaryCard icon={ShieldCheck} label={t('adm_summary_active')} value={String(summary.active)} tone="green" />
        <SummaryCard icon={Send} label={t('adm_summary_pending')} value={String(summary.pending)} tone="amber" />
        <SummaryCard icon={FileSearch} label={t('adm_summary_groups')} value={String(groupsInUse)} tone="purple" />
      </div>

      {showForm && (
        <Panel>
          <PanelTitle icon={UserPlus} title={t('adm_action_invite')} />
          <div className="grid gap-2 p-2 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t('sec_col_name')}>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={INPUT_CLASS} />
            </Field>
            <Field label={t('sec_col_email')}>
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={INPUT_CLASS} />
            </Field>
            <Field label={t('sec_col_phone')}>
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={INPUT_CLASS} />
            </Field>
            <Field label={t('sec_col_role')}>
              <select
                value={form.role}
                onChange={(event) => {
                  const role = event.target.value as AdminRole;
                  setForm({ ...form, role, group: DEFAULT_PERMISSION_GROUP[role] });
                }}
                className={SELECT_CLASS}
              >
                {CREATABLE_ADMIN_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('sec_col_group')} hint={t('adm_group_help')}>
              <select value={form.group} onChange={(event) => setForm({ ...form, group: event.target.value })} className={SELECT_CLASS}>
                {PERMISSION_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </Field>
            <p className="self-end text-[10px] leading-4 text-slate-500">{t('adm_no_password_note')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-[#244668] px-3 py-2">
            {formError && (
              <p role="alert" className="w-full rounded border border-red-400/30 bg-red-400/10 px-2 py-1.5 text-[11px] text-red-200">
                {formError}
              </p>
            )}
            <button type="button" onClick={invite} className={PRIMARY_BUTTON}>
              {t('adm_action_invite')}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className={GHOST_BUTTON}>
              {t('sa_cancel')}
            </button>
          </div>
        </Panel>
      )}

      <Panel>
        <PanelTitle icon={Users} title={t('adm_title')} />
        {rows.length === 0 ? (
          <div className="p-3">
            <EmptyState />
          </div>
        ) : (
          <TableWrap minWidth={1000}>
            <TableHead>
              <tr>
                <Th>{t('sec_col_name')}</Th>
                <Th>{t('sec_col_email')}</Th>
                <Th>{t('sec_col_role')}</Th>
                <Th>{t('sec_col_group')}</Th>
                <Th>{t('sec_col_status')}</Th>
                <Th>{t('sec_col_last_sign_in')}</Th>
                <Th>{t('sec_col_actions')}</Th>
              </tr>
            </TableHead>
            <tbody>
              {rows.map((row) => {
                const locked = row.role === 'Super Admin';
                return (
                  <TableRow key={row.id}>
                    <Td className="font-semibold text-white">{row.name}</Td>
                    <Td>{row.email}</Td>
                    <Td>
                      <select
                        value={row.role}
                        disabled={locked}
                        aria-label={`${t('adm_role_change')} ${row.name}`}
                        onChange={(event) => changeRole(row, event.target.value as AdminRole)}
                        className="rounded border border-[#2b527d] bg-[#102c51] px-1.5 py-1 text-[10px] text-white outline-none disabled:opacity-50"
                      >
                        {ADMIN_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </Td>
                    <Td className="text-slate-300">{row.permissions}</Td>
                    <Td>
                      <StatusPill tone={statusTone(row.status)}>{t(STATUS_KEYS[row.status])}</StatusPill>
                    </Td>
                    <Td className="whitespace-nowrap text-slate-400">
                      {invites.rows.find((entry) => entry.email.toLowerCase() === row.email.toLowerCase())?.last_sign_in_at?.slice(0, 10) ?? '—'}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        <button type="button" onClick={() => resend(row)} className={GHOST_BUTTON}>
                          {t('adm_action_resend')}
                        </button>
                        {row.status === 'suspended' ? (
                          <button type="button" onClick={() => applyStatus(row, 'active', 'restored')} className={GHOST_BUTTON}>
                            {t('adm_action_restore')}
                          </button>
                        ) : (
                          <button type="button" onClick={() => setPending({ row, action: 'suspend_user' })} className={GHOST_BUTTON}>
                            <ShieldOff size={12} /> {t('adm_action_suspend')}
                          </button>
                        )}
                        <button type="button" onClick={() => setPending({ row, action: 'remove_admin' })} className={DANGER_BUTTON}>
                          <Trash2 size={12} /> {t('adm_action_remove')}
                        </button>
                        {onOpenAudit && (
                          <button type="button" onClick={onOpenAudit} className={GHOST_BUTTON}>
                            {t('adm_action_audit')}
                          </button>
                        )}
                      </div>
                    </Td>
                  </TableRow>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <ConfirmDialog
        open={pending !== null}
        action={pending?.action ?? 'remove_admin'}
        objectName={pending?.row.name ?? ''}
        onCancel={() => setPending(null)}
        onConfirm={(reason) => {
          if (!pending) return;
          applyStatus(pending.row, pending.action === 'remove_admin' ? 'removed' : 'suspended', reason);
        }}
      />
    </div>
  );
}
