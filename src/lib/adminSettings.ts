import { createCollection } from './collection';

/**
 * Plan §16G.3 and §3A.13, ticket O-67. `app_settings` as a typed editor: each
 * key has a type, a default and a meaning, so the form can validate before a
 * write and the audit row can say what changed. Super Admin only.
 */

export type SettingType = 'number' | 'text' | 'enum';

export interface SettingDefinition {
  key: string;
  type: SettingType;
  /** Enum values, in the order the select shows them. */
  options?: readonly string[];
  /** A number's lower bound, inclusive. */
  min?: number;
  default: string;
  /** Super Admin only, per §3A.13. */
  superAdminOnly?: boolean;
}

/** The table in §3A.13, exactly. */
export const SETTING_DEFINITIONS: SettingDefinition[] = [
  { key: 'guide_post_rate_usd', type: 'number', min: 0, default: '' },
  { key: 'rental_new_order_highlight_hours', type: 'number', min: 0, default: '2' },
  { key: 'rental_min_notice_days', type: 'number', min: 0, default: '1' },
  { key: 'ad_fallback_provider', type: 'enum', options: ['adsense', 'none'], default: 'none' },
  { key: 'ad_adsense_client_id', type: 'text', default: '' },
  { key: 'translate_provider', type: 'text', default: '' },
  { key: 'maintenance_mode', type: 'enum', options: ['on', 'off'], default: 'off' },
  { key: 'maintenance_message_mm', type: 'text', default: '' },
  { key: 'maintenance_message_en', type: 'text', default: '' },
];

export function settingDefinition(key: string): SettingDefinition | undefined {
  return SETTING_DEFINITIONS.find((definition) => definition.key === key);
}

export interface SettingRow {
  key: string;
  value: string;
  updated_at: string;
  updated_by: string;
}

function seedRows(): SettingRow[] {
  const at = '2026-11-01T00:00:00.000Z';
  return SETTING_DEFINITIONS.map((definition) => ({
    key: definition.key,
    value: definition.default,
    updated_at: at,
    updated_by: 'system',
  }));
}

export const appSettings = createCollection<SettingRow>({
  key: 'mh-travel-admin-settings',
  seed: seedRows(),
  id: (row) => row.key,
  isRow: (value): value is SettingRow => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<SettingRow>;
    return typeof row.key === 'string' && typeof row.value === 'string';
  },
  normalize: (row) => ({ ...row, updated_by: row.updated_by ?? 'system', updated_at: row.updated_at ?? '' }),
});

export type SettingProblem = 'unknown_key' | 'not_a_number' | 'below_minimum' | 'not_an_option';

/**
 * §3A.13: the editor is typed, so a number field refuses a word and an enum
 * refuses anything outside its options before the write, not after.
 */
export function settingProblem(key: string, value: string): SettingProblem | null {
  const definition = settingDefinition(key);
  if (!definition) return 'unknown_key';
  if (definition.type === 'enum') {
    if (value === '') return null;
    return definition.options?.includes(value) ? null : 'not_an_option';
  }
  if (definition.type === 'number') {
    if (value.trim() === '') return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 'not_a_number';
    if (definition.min !== undefined && parsed < definition.min) return 'below_minimum';
  }
  return null;
}

export function settingValue(rows: SettingRow[], key: string): string {
  const row = rows.find((entry) => entry.key === key);
  return row?.value ?? settingDefinition(key)?.default ?? '';
}

export function numericSetting(rows: SettingRow[], key: string, fallback: number): number {
  const parsed = Number(settingValue(rows, key));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function writeSetting(rows: SettingRow[], key: string, value: string, by: string, now = new Date()): SettingRow[] {
  const next: SettingRow = { key, value, updated_at: now.toISOString(), updated_by: by };
  const at = rows.findIndex((row) => row.key === key);
  if (at === -1) return [...rows, next];
  return rows.map((row, index) => (index === at ? next : row));
}

/** The audit summary: "off → on", so the log line says what moved. */
export function settingChangeSummary(before: string, after: string): string {
  const from = before.trim() === '' ? '(empty)' : before;
  const to = after.trim() === '' ? '(empty)' : after;
  return `${from} → ${to}`;
}

export function maintenanceMode(rows: SettingRow[]): boolean {
  return settingValue(rows, 'maintenance_mode') === 'on';
}

/**
 * §3A.12, ticket O-67: an announcement becomes one `notification_feed` row for
 * its audience, with a limit of three a day.
 */
export type AnnouncementAudience = 'all' | 'travelers' | 'owners';

export const ANNOUNCEMENT_AUDIENCES: AnnouncementAudience[] = ['all', 'travelers', 'owners'];

export interface AnnouncementRow {
  id: string;
  title_mm: string;
  title_en: string;
  message_mm: string;
  message_en: string;
  link: string;
  audience: AnnouncementAudience;
  /** ISO instant; null means it was published at once. */
  send_at: string | null;
  published_at: string;
  published_by: string;
}

export const ANNOUNCEMENTS_PER_DAY = 3;

export const announcements = createCollection<AnnouncementRow>({
  key: 'mh-travel-admin-announcements',
  seed: [
    {
      id: 'an-1', title_mm: 'သင်္ကြန်အထူး', title_en: 'Thingyan special',
      message_mm: 'ဧပြီလတွင် အထူးလျှော့စျေးများ။', message_en: 'Special discounts through April.',
      link: '/travel-plans', audience: 'all', send_at: null,
      published_at: '2026-11-01T03:00:00.000Z', published_by: 'Super Admin',
    },
  ] as AnnouncementRow[],
  id: (row) => row.id,
  isRow: (value): value is AnnouncementRow => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<AnnouncementRow>;
    return typeof row.id === 'string' && typeof row.title_en === 'string';
  },
  normalize: (row) => ({ ...row, link: row.link ?? '', send_at: row.send_at ?? null }),
});

export type AnnouncementProblem =
  | 'title_required'
  | 'message_required'
  | 'both_languages_required'
  | 'daily_limit'
  | 'send_at_in_past';

/**
 * §3A.12: three a day, both languages, and a scheduled send cannot be in the
 * past. The count is by Myanmar day, the same boundary every other screen uses.
 */
export function announcementProblem(
  draft: Pick<AnnouncementRow, 'title_mm' | 'title_en' | 'message_mm' | 'message_en' | 'send_at'>,
  rows: AnnouncementRow[],
  today: string,
  now = new Date(),
): AnnouncementProblem | null {
  if (!draft.title_mm.trim() && !draft.title_en.trim()) return 'title_required';
  if (!draft.title_mm.trim() || !draft.title_en.trim()) return 'both_languages_required';
  if (!draft.message_mm.trim() && !draft.message_en.trim()) return 'message_required';
  if (!draft.message_mm.trim() || !draft.message_en.trim()) return 'both_languages_required';
  if (draft.send_at && new Date(draft.send_at).getTime() < now.getTime()) return 'send_at_in_past';
  const sentToday = rows.filter((row) => row.published_at.slice(0, 10) === today).length;
  if (sentToday >= ANNOUNCEMENTS_PER_DAY) return 'daily_limit';
  return null;
}

export function announcementsSentOn(rows: AnnouncementRow[], day: string): AnnouncementRow[] {
  return rows.filter((row) => row.published_at.slice(0, 10) === day);
}
