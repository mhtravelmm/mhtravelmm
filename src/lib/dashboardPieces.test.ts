import { describe, expect, it } from 'vitest';
import {
  MIN_REASON_LENGTH,
  buildCsv,
  checkConfirm,
  csvFileName,
  requiresTypedName,
  type ConfirmDraft,
} from './dashboardPieces';

/**
 * Plan §3A.2 rule 7, §3A.14 and §16B.8. These are the rules every dashboard
 * section shares, so they are tested once here rather than once per panel.
 */

function draft(overrides: Partial<ConfirmDraft> = {}): ConfirmDraft {
  return {
    action: 'suspend_user',
    objectName: 'Daw Hla Hla',
    reason: 'Repeated spam in reviews',
    typedName: '',
    ...overrides,
  };
}

describe('the confirm dialog (§3A.2 rule 7)', () => {
  it('asks the heaviest actions to type the name and the rest only for a reason', () => {
    for (const action of ['delete', 'suspend_owner', 'remove_admin'] as const) {
      expect(requiresTypedName(action), action).toBe(true);
    }
    for (const action of ['suspend_user', 'retire_listing', 'cancel_order', 'role_change'] as const) {
      expect(requiresTypedName(action), action).toBe(false);
    }
  });

  it('refuses a missing reason', () => {
    expect(checkConfirm(draft({ reason: '   ' }))).toEqual({ ok: false, problem: 'reason_missing' });
  });

  it('refuses a reason too short to say anything', () => {
    const short = 'x'.repeat(MIN_REASON_LENGTH - 1);
    expect(checkConfirm(draft({ reason: short }))).toEqual({ ok: false, problem: 'reason_too_short' });
    expect(checkConfirm(draft({ reason: 'x'.repeat(MIN_REASON_LENGTH) })).ok).toBe(true);
  });

  it('does not ask a light action for a name', () => {
    expect(checkConfirm(draft({ typedName: '' }))).toEqual({ ok: true, reason: 'Repeated spam in reviews' });
  });

  it('refuses a heavy action until the name matches', () => {
    const heavy = draft({ action: 'remove_admin', objectName: 'U Aung Myint' });
    expect(checkConfirm(heavy)).toEqual({ ok: false, problem: 'name_mismatch' });
    expect(checkConfirm({ ...heavy, typedName: 'U Aung' })).toEqual({ ok: false, problem: 'name_mismatch' });
    expect(checkConfirm({ ...heavy, typedName: 'u aung myint  ' })).toEqual({ ok: true, reason: heavy.reason });
  });

  it('trims the reason it returns, so the audit row holds what was meant', () => {
    const result = checkConfirm(draft({ reason: '  Duplicate account  ' }));
    expect(result).toEqual({ ok: true, reason: 'Duplicate account' });
  });
});

describe('the shared dialog and export copy (§3A.2 rule 5)', () => {
  it('has a Myanmar and an English string for every key the pieces render', async () => {
    const { translatePair } = await import('./translations');
    for (const code of [
      'common_export_csv',
      'common_reload',
      'common_not_allowed_title',
      'common_not_allowed_detail',
      'confirm_title',
      'confirm_reason_label',
      'confirm_reason_placeholder',
      'confirm_type_name_label',
      'confirm_problem_reason_missing',
      'confirm_problem_reason_too_short',
      'confirm_problem_name_mismatch',
      'confirm_cancel',
      'confirm_submit',
    ]) {
      const pair = translatePair(code);
      expect(pair.mm, `${code}.mm`).toBeTruthy();
      expect(pair.en, `${code}.en`).toBeTruthy();
      expect(pair.mm, `${code} must not be the English string`).not.toBe(pair.en);
    }
  });
});

describe('the CSV export (§3A.14, §3A.16 criterion 11)', () => {
  const columns = [
    { header: 'name', value: (row: { name: string; note: string }) => row.name },
    { header: 'note', value: (row: { name: string; note: string }) => row.note },
  ];

  it('starts with a byte-order mark so Excel reads Myanmar as UTF-8', () => {
    const csv = buildCsv(columns, [{ name: 'ဆီဆုံ', note: '' }]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('ဆီဆုံ');
  });

  it('quotes a comma, a quote and a newline per RFC 4180', () => {
    const csv = buildCsv(columns, [{ name: 'Lotte, Yangon', note: 'He said "hi"' }]);
    expect(csv).toContain('"Lotte, Yangon"');
    expect(csv).toContain('"He said ""hi"""');
    const multiline = buildCsv(columns, [{ name: 'a', note: 'one\ntwo' }]);
    expect(multiline).toContain('"one\ntwo"');
  });

  it('uses CRLF so a Windows spreadsheet splits the rows', () => {
    const csv = buildCsv(columns, [{ name: 'a', note: 'b' }, { name: 'c', note: 'd' }]);
    expect(csv).toBe('\uFEFFname,note\r\na,b\r\nc,d\r\n');
  });

  it('writes a null as an empty cell, not as the word null', () => {
    const csv = buildCsv([{ header: 'x', value: () => null }], [{}]);
    expect(csv).toBe('\uFEFFx\r\n\r\n');
  });

  it('neutralises a value a spreadsheet would run as a formula', () => {
    const csv = buildCsv(columns, [{ name: '=1+1', note: '@SUM(A1)' }]);
    expect(csv).toContain("'=1+1");
    expect(csv).toContain("'@SUM(A1)");
  });

  it('exports only the rows it is given, so a filter cannot be bypassed', () => {
    const rows = [{ name: 'a', note: '' }, { name: 'b', note: '' }, { name: 'c', note: '' }];
    const filtered = rows.filter((row) => row.name !== 'b');
    const csv = buildCsv(columns, filtered);
    expect(csv).not.toContain('b,');
    expect(csv.trim().split('\r\n')).toHaveLength(3);
  });

  it('names the file after the section and the Myanmar day', () => {
    // 2026-11-30T20:00Z is 02:30 on 1 December in Myanmar.
    expect(csvFileName('payments', new Date('2026-11-30T20:00:00Z'))).toBe('mh-travel-payments-2026-12-01.csv');
    expect(csvFileName('users', new Date('2026-11-30T10:00:00Z'))).toBe('mh-travel-users-2026-11-30.csv');
  });
});
