import { useMemo, useState } from 'react';
import { MessageCircle, Send, UserCheck, Lock, Unlock } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { useAuditRecorder } from '../../lib/adminAudit';
import { pushAdminNotice } from '../../lib/adminNotices';
import { canOpenSection, type WorkspaceSection } from '../../lib/adminWorkspace';
import {
  assignThread,
  closeThread,
  contactMessages,
  filterThreads,
  replyToThread,
  reopenThread,
  supportThreads,
  threadSummary,
  unreadSupportCount,
  type SupportFilter,
  type SupportThreadRow,
} from '../../lib/adminSupport';
import { useCollection } from '../../lib/collection';
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
 * Plan §12.1 and §3A.13, ticket O-66. The support inbox: traveler threads and,
 * in a separate tab, owner threads; assign, reply (live), close. The
 * contact-form messages sit below them.
 *
 * The unread count is the sidebar badge (§3A.3), so it is computed by one
 * function (`unreadSupportCount`) that both this screen and the shell call.
 */

const THREAD_CSV: CsvColumn<SupportThreadRow>[] = [
  { header: 'id', value: (row) => row.id },
  { header: 'kind', value: (row) => row.kind },
  { header: 'subject', value: (row) => row.subject },
  { header: 'requester', value: (row) => row.requester_name },
  { header: 'email', value: (row) => row.requester_email },
  { header: 'status', value: (row) => row.status },
  { header: 'assigned_to', value: (row) => row.assigned_to },
  { header: 'created_at', value: (row) => row.created_at },
  { header: 'updated_at', value: (row) => row.updated_at },
  { header: 'messages', value: (row) => row.messages.length },
];

export function SupportPanel() {
  const { t } = useLanguage();
  const { adminRole, user } = useAuth();
  const audit = useAuditRecorder();
  const threads = useCollection(supportThreads);
  const messages = useCollection(contactMessages);

  const [kind, setKind] = useState<'traveler' | 'owner' | 'messages'>('traveler');
  const [filter, setFilter] = useState<SupportFilter>('open');
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  const allowed = canOpenSection(adminRole, 'support' as WorkspaceSection);
  const me = user?.name ?? null;

  const visible = useMemo(() => {
    if (kind === 'messages') return [];
    return filterThreads(
      threads.rows.filter((row) => row.kind === kind),
      filter,
      me,
    );
  }, [threads.rows, kind, filter, me]);

  const summary = threadSummary(threads.rows);
  const active = threads.rows.find((row) => row.id === openId) ?? null;

  if (!allowed) return <NotAllowedState />;

  function writeThread(next: SupportThreadRow, line: string) {
    threads.save(threads.rows.map((row) => (row.id === next.id ? next : row)));
    audit({ action: 'updated', objectType: 'support_thread', objectId: next.id, summary: line, source: 'support' });
  }

  function sendReply() {
    if (!active || !reply.trim()) return;
    const next = replyToThread(active, me ?? 'staff', reply);
    writeThread(next, `${active.subject} · reply`);
    pushAdminNotice({ title: t('sp_notice_replied_title'), message: t('sp_notice_replied_body').replace('{name}', active.requester_name) });
    setReply('');
  }

  function assign() {
    if (!active) return;
    const next = assignThread(active, me ?? 'staff');
    writeThread(next, `${active.subject} · assigned to ${me ?? 'staff'}`);
    pushAdminNotice({ title: t('sp_notice_assigned_title'), message: t('sp_notice_assigned_body').replace('{name}', active.requester_name) });
  }

  function toggleStatus() {
    if (!active) return;
    if (active.status === 'open') {
      const next = closeThread(active);
      writeThread(next, `${active.subject} · closed`);
      pushAdminNotice({ title: t('sp_notice_closed_title'), message: t('sp_notice_closed_body').replace('{name}', active.requester_name) });
    } else {
      const next = reopenThread(active);
      writeThread(next, `${active.subject} · reopened`);
      pushAdminNotice({ title: t('sp_notice_reopened_title'), message: t('sp_notice_reopened_body').replace('{name}', active.requester_name) });
    }
  }

  function markRead(id: string) {
    const row = messages.rows.find((entry) => entry.id === id);
    if (!row || row.read) return;
    messages.save(messages.rows.map((entry) => (entry.id === id ? { ...entry, read: true } : entry)));
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-3">
      <SectionHeader kickerKey="sp_kicker" titleKey="sp_title" introKey="sp_intro">
        <CsvExportButton section="support" columns={THREAD_CSV} rows={visible} />
      </SectionHeader>

      <div className="grid grid-cols-3 gap-2">
        <SummaryCard icon={MessageCircle} label={t('sp_summary_open')} value={String(summary.open)} tone="cyan" />
        <SummaryCard icon={UserCheck} label={t('sp_summary_unassigned')} value={String(summary.unassigned)} tone="amber" />
        <SummaryCard icon={MessageCircle} label={t('sp_summary_unread')} value={String(unreadSupportCount(threads.rows))} tone="green" />
      </div>

      <div className="flex flex-wrap gap-1">
        {(['traveler', 'owner', 'messages'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setKind(value);
              setOpenId(null);
            }}
            className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${kind === value ? 'bg-[#168df4] text-white' : 'border border-[#2b527d] text-slate-300'}`}
          >
            {value === 'traveler' ? t('sp_tab_travelers') : value === 'owner' ? t('sp_tab_owners') : t('sp_tab_messages')}
          </button>
        ))}
      </div>

      {kind !== 'messages' && (
        <div className="flex flex-wrap gap-1">
          {(['open', 'unassigned', 'mine', 'closed', 'all'] as SupportFilter[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-md px-2.5 py-1 text-[10px] font-semibold ${filter === value ? 'bg-cyan-400/20 text-cyan-100' : 'border border-[#2b527d] text-slate-300'}`}
            >
              {value === 'open'
                ? t('sp_filter_open')
                : value === 'unassigned'
                  ? t('sp_filter_unassigned')
                  : value === 'mine'
                    ? t('sp_filter_mine')
                    : value === 'closed'
                      ? t('sp_filter_closed')
                      : t('sa_all')}
            </button>
          ))}
        </div>
      )}

      {kind === 'messages' ? (
        <Panel>
          <PanelTitle icon={MessageCircle} title={t('sp_tab_messages')} />
          {messages.rows.length === 0 ? (
            <div className="p-3">
              <EmptyState />
            </div>
          ) : (
            <ul className="divide-y divide-[#1d3a5c]">
              {messages.rows.map((row) => (
                <li key={row.id} className={`px-3 py-2 text-[11px] ${row.read ? 'text-slate-400' : 'text-white'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">
                      {row.name} · <span className="text-[10px] text-slate-400">{row.email}</span>
                    </span>
                    <span className="whitespace-nowrap text-[10px] text-slate-500">{row.created_at.slice(0, 10)}</span>
                  </div>
                  <p className="mt-0.5">{row.body}</p>
                  {!row.read && (
                    <button type="button" onClick={() => markRead(row.id)} className="mt-1 text-[10px] font-semibold text-cyan-300 hover:text-white">
                      {t('sec_saved')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : (
        <div className="grid gap-2 lg:grid-cols-[1.1fr_1fr]">
          <Panel>
            <PanelTitle icon={MessageCircle} title={t('sp_title')} />
            {visible.length === 0 ? (
              <div className="p-3">
                <EmptyState />
              </div>
            ) : (
              <TableWrap minWidth={620}>
                <TableHead>
                  <tr>
                    <Th>{t('sec_col_subject')}</Th>
                    <Th>{t('sec_col_requester')}</Th>
                    <Th>{t('sec_col_assigned')}</Th>
                    <Th>{t('sec_col_status')}</Th>
                    <Th>{t('sec_col_unread')}</Th>
                  </tr>
                </TableHead>
                <tbody>
                  {visible.map((row) => {
                    const unread = row.messages.filter((message) => message.unread && message.from !== 'staff').length;
                    return (
                      <TableRow key={row.id} onClick={() => setOpenId(row.id)}>
                        <Td className="font-semibold text-white">{row.subject}</Td>
                        <Td>{row.requester_name}</Td>
                        <Td className="text-slate-400">{row.assigned_to ?? t('sp_unassigned')}</Td>
                        <Td>
                          <StatusPill tone={statusTone(row.status)}>{row.status === 'open' ? t('sec_status_open') : t('sec_status_closed')}</StatusPill>
                        </Td>
                        <Td>{unread > 0 ? <strong className="text-amber-300">{unread}</strong> : '—'}</Td>
                      </TableRow>
                    );
                  })}
                </tbody>
              </TableWrap>
            )}
          </Panel>

          <Panel>
            <PanelTitle icon={MessageCircle} title={active ? active.subject : t('sp_title')} />
            {!active ? (
              <div className="p-3">
                <EmptyState />
              </div>
            ) : (
              <div className="p-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button type="button" onClick={assign} className={GHOST_BUTTON}>
                    <UserCheck size={12} /> {t('sp_action_assign_me')}
                  </button>
                  <button type="button" onClick={toggleStatus} className={GHOST_BUTTON}>
                    {active.status === 'open' ? <Lock size={12} /> : <Unlock size={12} />}
                    {active.status === 'open' ? t('sp_action_close') : t('sp_action_reopen')}
                  </button>
                </div>

                <ul className="mt-3 space-y-1.5">
                  {active.messages.length === 0 && <li className="text-[11px] text-slate-500">{t('sp_no_messages')}</li>}
                  {active.messages.map((message) => (
                    <li
                      key={message.id}
                      className={`rounded-md px-2 py-1.5 text-[11px] ${message.from === 'staff' ? 'bg-[#102c51] text-slate-200' : 'bg-[#091b32] text-white'}`}
                    >
                      <span className="block text-[10px] text-slate-400">
                        {message.author} · {message.at.slice(0, 16).replace('T', ' ')}
                      </span>
                      {message.body}
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex items-end gap-1.5">
                  <div className="flex-1">
                    <Field label={t('sp_reply_label')}>
                      <textarea
                        rows={2}
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                        placeholder={t('sp_reply_placeholder')}
                        className={INPUT_CLASS}
                      />
                    </Field>
                  </div>
                  <button type="button" onClick={sendReply} disabled={!reply.trim()} className={PRIMARY_BUTTON}>
                    <Send size={12} /> {t('sp_reply_send')}
                  </button>
                </div>
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
