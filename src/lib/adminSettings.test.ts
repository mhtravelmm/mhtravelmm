import { describe, expect, it } from 'vitest';
import {
  ANNOUNCEMENTS_PER_DAY,
  SETTING_DEFINITIONS,
  announcementProblem,
  announcementsSentOn,
  maintenanceMode,
  numericSetting,
  settingChangeSummary,
  settingProblem,
  settingValue,
  writeSetting,
  type AnnouncementRow,
  type SettingRow,
} from './adminSettings';

/**
 * Plan §3A.12 and §3A.13. `app_settings` is typed, so a bad value is refused
 * before the write; announcements are capped at three a day. Both are rules,
 * not screen behaviour, so they are tested here.
 */

describe('the settings editor (§3A.13)', () => {
  it('describes every setting once, with a type', () => {
    const keys = SETTING_DEFINITIONS.map((definition) => definition.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const definition of SETTING_DEFINITIONS) {
      expect(['number', 'text', 'enum']).toContain(definition.type);
      if (definition.type === 'enum') expect(definition.options?.length).toBeGreaterThan(0);
    }
  });

  it('refuses a key the table does not define', () => {
    expect(settingProblem('not_a_setting', '1')).toBe('unknown_key');
  });

  it('refuses a non-number where a number is expected', () => {
    expect(settingProblem('rental_min_notice_days', 'soon')).toBe('not_a_number');
  });

  it('refuses a number below its minimum', () => {
    expect(settingProblem('rental_min_notice_days', '-1')).toBe('below_minimum');
  });

  it('refuses an option outside the enum', () => {
    expect(settingProblem('ad_fallback_provider', 'carrier_pigeon')).toBe('not_an_option');
  });

  it('accepts a value that fits the definition', () => {
    expect(settingProblem('rental_min_notice_days', '2')).toBeNull();
    expect(settingProblem('maintenance_message_en', 'Back at 09:00')).toBeNull();
  });

  it('writes one row, stamping who changed it and when', () => {
    const rows = writeSetting([], 'rental_min_notice_days', '2', 'Super Admin', new Date('2026-11-20T02:00:00.000Z'));
    expect(settingValue(rows, 'rental_min_notice_days')).toBe('2');
    expect(rows[0]).toMatchObject({ updated_by: 'Super Admin', updated_at: '2026-11-20T02:00:00.000Z' });
  });

  it('falls back to the given number when the key is unset', () => {
    expect(numericSetting([], 'rental_min_notice_days', 1)).toBe(1);
  });

  it('reads maintenance mode from its own row', () => {
    const rows: SettingRow[] = [{ key: 'maintenance_mode', value: 'on', updated_at: '', updated_by: '' }];
    expect(maintenanceMode(rows)).toBe(true);
    expect(maintenanceMode([])).toBe(false);
  });

  it('summarises a change with the old and the new value', () => {
    expect(settingChangeSummary('1', '2')).toBe('1 → 2');
    expect(settingChangeSummary('', '2')).toBe('(empty) → 2');
  });
});

describe('announcements (§3A.12)', () => {
  function announcement(overrides: Partial<AnnouncementRow> = {}): AnnouncementRow {
    return {
      id: 'an-1', title_mm: 'ခေါင်းစဉ်', title_en: 'Title', message_mm: 'စာ', message_en: 'Message',
      link: '', audience: 'all', send_at: null, published_at: '2026-11-20T02:00:00.000Z',
      published_by: 'Super Admin',
      ...overrides,
    };
  }

  function draft(overrides: Partial<AnnouncementRow> = {}) {
    const row = announcement(overrides);
    return {
      title_mm: row.title_mm, title_en: row.title_en, message_mm: row.message_mm,
      message_en: row.message_en, link: row.link, audience: row.audience, send_at: row.send_at,
    };
  }

  it('requires a title and a message', () => {
    expect(announcementProblem(draft({ title_en: '', title_mm: '' }), [], '2026-11-20')).toBe('title_required');
    expect(announcementProblem(draft({ message_en: '', message_mm: '' }), [], '2026-11-20')).toBe('message_required');
  });

  it('requires both languages, because the feed row carries both', () => {
    expect(announcementProblem(draft({ title_mm: '' }), [], '2026-11-20')).toBe('both_languages_required');
    expect(announcementProblem(draft({ message_mm: '' }), [], '2026-11-20')).toBe('both_languages_required');
  });

  it('refuses a fourth announcement on the same Myanmar day', () => {
    const rows = [announcement({ id: 'a' }), announcement({ id: 'b' }), announcement({ id: 'c' })];
    expect(announcementsSentOn(rows, '2026-11-20')).toHaveLength(ANNOUNCEMENTS_PER_DAY);
    expect(announcementProblem(draft(), rows, '2026-11-20')).toBe('daily_limit');
  });

  it('refuses a send time in the past', () => {
    expect(announcementProblem(draft({ send_at: '2026-11-01T00:00:00.000Z' }), [], '2026-11-20')).toBe('send_at_in_past');
  });

  it('accepts a complete announcement within the limit', () => {
    expect(announcementProblem(draft(), [announcement({ id: 'a' })], '2026-11-20')).toBeNull();
  });
});
