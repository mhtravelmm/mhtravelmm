import { useState } from 'react';
import { Bell, Settings as SettingsIcon } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { useAuditRecorder } from '../../lib/adminAudit';
import { pushAdminNotice } from '../../lib/adminNotices';
import { fillPair, translatePair, type TranslationKey } from '../../lib/translations';
import { pushFeedEvent } from '../../lib/notificationFeed';
import { canOpenSection, type WorkspaceSection } from '../../lib/adminWorkspace';
import {
  ANNOUNCEMENT_AUDIENCES,
  ANNOUNCEMENTS_PER_DAY,
  SETTING_DEFINITIONS,
  announcementProblem,
  announcements,
  announcementsSentOn,
  appSettings,
  settingChangeSummary,
  settingProblem,
  settingValue,
  writeSetting,
  type AnnouncementAudience,
  type AnnouncementProblem,
  type AnnouncementRow,
  type SettingProblem,
} from '../../lib/adminSettings';
import { myanmarToday } from '../../lib/myanmarTime';
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
  SELECT_CLASS,
  statusTone,
} from './shared/sectionStyles';


/**
 * Plan §3A.13, ticket O-67. `app_settings` as a typed editor: each key has a
 * type, a range and a meaning, so the form refuses a bad value before the
 * write and the audit row can say exactly what moved.
 *
 * Super Admin only (§3A.13); the guard is the workspace row, and the server
 * checks the role again on the write (§16B.8).
 */

const SETTING_PROBLEM_KEYS: Record<SettingProblem, TranslationKey> = {
  unknown_key: 'st_problem_unknown_key',
  not_a_number: 'st_problem_not_a_number',
  below_minimum: 'st_problem_below_minimum',
  not_an_option: 'st_problem_not_an_option',
};

const SETTING_LABEL_KEYS: Record<string, TranslationKey> = {
  guide_post_rate_usd: 'st_key_guide_post_rate_usd',
  rental_new_order_highlight_hours: 'st_key_rental_new_order_highlight_hours',
  rental_min_notice_days: 'st_key_rental_min_notice_days',
  ad_fallback_provider: 'st_key_ad_fallback_provider',
  ad_adsense_client_id: 'st_key_ad_adsense_client_id',
  translate_provider: 'st_key_translate_provider',
  maintenance_mode: 'st_key_maintenance_mode',
  maintenance_message_mm: 'st_key_maintenance_message_mm',
  maintenance_message_en: 'st_key_maintenance_message_en',
};

const SETTINGS_CSV: CsvColumn<{ key: string; value: string; updated_by: string; updated_at: string }>[] = [
  { header: 'key', value: (row) => row.key },
  { header: 'value', value: (row) => row.value },
  { header: 'updated_by', value: (row) => row.updated_by },
  { header: 'updated_at', value: (row) => row.updated_at },
];

export function SettingsPanel() {
  const { t } = useLanguage();
  const { adminRole, user } = useAuth();
  const audit = useAuditRecorder();
  const { rows, save } = useCollection(appSettings);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const allowed = canOpenSection(adminRole, 'settings' as WorkspaceSection);
  const problem = editing ? settingProblem(editing, draft) : null;

  if (!allowed) return <NotAllowedState />;

  function begin(key: string) {
    setEditing(key);
    setDraft(settingValue(rows, key));
  }

  function commit() {
    if (!editing || problem) return;
    const before = settingValue(rows, editing);
    save(writeSetting(rows, editing, draft, user?.name ?? 'Super Admin'));
    audit({
      action: 'updated',
      objectType: 'app_setting',
      objectId: editing,
      summary: `${editing}: ${settingChangeSummary(before, draft)}`,
      source: 'settings',
    });
    pushAdminNotice({ title: t('st_notice_saved_title'), message: t('st_notice_saved_body').replace('{key}', editing) });
    setEditing(null);
    setDraft('');
  }

  return (
    <div className="mx-auto max-w-[1000px] space-y-3">
      <SectionHeader kickerKey="st_kicker" titleKey="st_title" introKey="st_intro">
        <CsvExportButton section="settings" columns={SETTINGS_CSV} rows={rows} />
      </SectionHeader>

      <Panel>
        <PanelTitle icon={SettingsIcon} title={t('st_title')} />
        <TableWrap minWidth={780}>
          <TableHead>
            <tr>
              <Th>{t('sec_col_key')}</Th>
              <Th>{t('sec_col_value')}</Th>
              <Th>{t('sec_col_updated')}</Th>
              <Th>{t('sec_col_actions')}</Th>
            </tr>
          </TableHead>
          <tbody>
            {SETTING_DEFINITIONS.map((definition) => {
              const value = settingValue(rows, definition.key);
              const row = rows.find((entry) => entry.key === definition.key);
              return (
                <TableRow key={definition.key}>
                  <Td>
                    <span className="font-semibold text-white">{t(SETTING_LABEL_KEYS[definition.key])}</span>
                    <span className="block font-mono text-[10px] text-slate-500">{definition.key}</span>
                  </Td>
                  <Td>
                    {editing === definition.key ? (
                      definition.type === 'enum' ? (
                        <select value={draft} onChange={(event) => setDraft(event.target.value)} className={SELECT_CLASS} aria-label={definition.key}>
                          <option value="">—</option>
                          {definition.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          value={draft}
                          type={definition.type === 'number' ? 'number' : 'text'}
                          onChange={(event) => setDraft(event.target.value)}
                          aria-label={definition.key}
                          className={INPUT_CLASS}
                        />
                      )
                    ) : (
                      <span className="font-mono text-cyan-200">{value === '' ? '—' : value}</span>
                    )}
                    {editing === definition.key && problem && (
                      <p role="alert" className="mt-1 text-[10px] text-red-300">
                        {t(SETTING_PROBLEM_KEYS[problem]).replace('{min}', String(definition.min ?? 0))}
                      </p>
                    )}
                  </Td>
                  <Td className="text-[10px] text-slate-500">
                    {row?.updated_at ? `${row.updated_at.slice(0, 10)} · ${row.updated_by}` : '—'}
                  </Td>
                  <Td>
                    {editing === definition.key ? (
                      <div className="flex gap-1">
                        <button type="button" onClick={commit} disabled={Boolean(problem)} className={PRIMARY_BUTTON}>
                          {t('sec_save')}
                        </button>
                        <button type="button" onClick={() => setEditing(null)} className={GHOST_BUTTON}>
                          {t('sa_cancel')}
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => begin(definition.key)} className={GHOST_BUTTON}>
                        {t('st_edit')}
                      </button>
                    )}
                  </Td>
                </TableRow>
              );
            })}
          </tbody>
        </TableWrap>
      </Panel>
    </div>
  );
}

const AUDIENCE_KEYS: Record<AnnouncementAudience, TranslationKey> = {
  all: 'an_audience_all',
  travelers: 'an_audience_travelers',
  owners: 'an_audience_owners',
};

const ANNOUNCEMENT_PROBLEM_KEYS: Record<AnnouncementProblem, TranslationKey> = {
  title_required: 'an_problem_title_required',
  message_required: 'an_problem_message_required',
  both_languages_required: 'an_problem_both_languages_required',
  daily_limit: 'an_problem_daily_limit',
  send_at_in_past: 'an_problem_send_at_in_past',
};

const ANNOUNCEMENT_CSV: CsvColumn<AnnouncementRow>[] = [
  { header: 'id', value: (row) => row.id },
  { header: 'title_en', value: (row) => row.title_en },
  { header: 'title_mm', value: (row) => row.title_mm },
  { header: 'audience', value: (row) => row.audience },
  { header: 'link', value: (row) => row.link },
  { header: 'send_at', value: (row) => row.send_at },
  { header: 'published_at', value: (row) => row.published_at },
  { header: 'published_by', value: (row) => row.published_by },
];

type AnnouncementDraft = Pick<
  AnnouncementRow,
  'title_mm' | 'title_en' | 'message_mm' | 'message_en' | 'link' | 'audience' | 'send_at'
>;

function emptyAnnouncement(): AnnouncementDraft {
  return {
    title_mm: '',
    title_en: '',
    message_mm: '',
    message_en: '',
    link: '',
    audience: 'all',
    send_at: null,
  };
}

export function AnnouncementsPanel() {
  const { t } = useLanguage();
  const { adminRole, user } = useAuth();
  const audit = useAuditRecorder();
  const { rows, save } = useCollection(announcements);
  const [draft, setDraft] = useState<AnnouncementDraft>(emptyAnnouncement());

  const allowed = canOpenSection(adminRole, 'announcements' as WorkspaceSection);
  const today = myanmarToday();
  const sentToday = announcementsSentOn(rows, today).length;
  const remaining = Math.max(0, ANNOUNCEMENTS_PER_DAY - sentToday);
  const problem = announcementProblem(draft, rows, today);

  if (!allowed) return <NotAllowedState />;

  function publish() {
    if (problem) return;
    const next: AnnouncementRow = {
      id: newId('an'),
      ...draft,
      title_mm: draft.title_mm.trim(),
      title_en: draft.title_en.trim(),
      message_mm: draft.message_mm.trim(),
      message_en: draft.message_en.trim(),
      link: draft.link.trim(),
      published_at: new Date().toISOString(),
      published_by: user?.name ?? 'Super Admin',
    };
    save([next, ...rows]);
    audit({
      action: 'published',
      objectType: 'announcement',
      objectId: next.id,
      summary: `${next.title_en} · ${next.audience}`,
      source: 'announcements',
    });
    pushAdminNotice({
      title: t('an_notice_title'),
      message: t('an_notice_body').replace('{name}', next.title_en).replace('{audience}', t(AUDIENCE_KEYS[next.audience])),
    });
    pushFeedEvent('admin_notice', {
      title: translatePair('an_notice_title'),
      message: fillPair('an_notice_body', { name: next.title_en, audience: t(AUDIENCE_KEYS[next.audience]) }),
      recipients: [{ kind: 'everyone' }],
    });
    setDraft(emptyAnnouncement());
  }

  return (
    <div className="mx-auto max-w-[1000px] space-y-3">
      <SectionHeader kickerKey="an_kicker" titleKey="an_title" introKey="an_intro">
        <CsvExportButton section="announcements" columns={ANNOUNCEMENT_CSV} rows={rows} />
      </SectionHeader>

      <Panel>
        <PanelTitle icon={Bell} title={t('an_form_title')} />
        <div className="grid gap-2 p-2 sm:grid-cols-2">
          <Field label={t('an_title_en')}>
            <input value={draft.title_en} onChange={(event) => setDraft({ ...draft, title_en: event.target.value })} className={INPUT_CLASS} />
          </Field>
          <Field label={t('an_title_mm')}>
            <input value={draft.title_mm} onChange={(event) => setDraft({ ...draft, title_mm: event.target.value })} className={INPUT_CLASS} />
          </Field>
          <Field label={t('an_message_en')}>
            <textarea rows={2} value={draft.message_en} onChange={(event) => setDraft({ ...draft, message_en: event.target.value })} className={INPUT_CLASS} />
          </Field>
          <Field label={t('an_message_mm')}>
            <textarea rows={2} value={draft.message_mm} onChange={(event) => setDraft({ ...draft, message_mm: event.target.value })} className={INPUT_CLASS} />
          </Field>
          <Field label={t('an_link')}>
            <input value={draft.link} onChange={(event) => setDraft({ ...draft, link: event.target.value })} className={INPUT_CLASS} />
          </Field>
          <Field label={t('an_audience')}>
            <select
              value={draft.audience}
              onChange={(event) => setDraft({ ...draft, audience: event.target.value as AnnouncementAudience })}
              className={SELECT_CLASS}
            >
              {ANNOUNCEMENT_AUDIENCES.map((audience) => (
                <option key={audience} value={audience}>
                  {t(AUDIENCE_KEYS[audience])}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('an_send_at')}>
            <input
              type="datetime-local"
              value={draft.send_at ?? ''}
              onChange={(event) => setDraft({ ...draft, send_at: event.target.value || null })}
              className={INPUT_CLASS}
            />
          </Field>
          <p className="self-end text-[10px] text-slate-500">{t('an_remaining_today').replace('{count}', String(remaining))}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-[#244668] px-3 py-2">
          {problem && (
            <p role="alert" className="w-full rounded border border-red-400/30 bg-red-400/10 px-2 py-1.5 text-[11px] text-red-200">
              {t(ANNOUNCEMENT_PROBLEM_KEYS[problem])}
            </p>
          )}
          <button type="button" onClick={publish} disabled={Boolean(problem)} className={PRIMARY_BUTTON}>
            {t('an_publish')}
          </button>
        </div>
      </Panel>

      <Panel>
        <PanelTitle icon={Bell} title={t('an_title')} />
        {rows.length === 0 ? (
          <div className="p-3">
            <EmptyState />
          </div>
        ) : (
          <TableWrap minWidth={760}>
            <TableHead>
              <tr>
                <Th>{t('sec_col_name')}</Th>
                <Th>{t('sec_col_audience')}</Th>
                <Th>{t('sec_col_send_at')}</Th>
                <Th>{t('sec_col_status')}</Th>
              </tr>
            </TableHead>
            <tbody>
              {rows.map((row) => {
                const scheduled = row.send_at !== null && row.send_at > new Date().toISOString();
                return (
                  <TableRow key={row.id}>
                    <Td className="font-semibold text-white">
                      {row.title_en}
                      <span className="block text-[10px] text-slate-400">{row.title_mm}</span>
                    </Td>
                    <Td>{t(AUDIENCE_KEYS[row.audience])}</Td>
                    <Td className="whitespace-nowrap text-slate-400">{row.send_at ? row.send_at.slice(0, 16).replace('T', ' ') : row.published_at.slice(0, 16).replace('T', ' ')}</Td>
                    <Td>
                      <StatusPill tone={statusTone(scheduled ? 'pending' : 'published')}>
                        {scheduled ? t('sec_status_pending') : t('sa_status_published')}
                      </StatusPill>
                    </Td>
                  </TableRow>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
}
