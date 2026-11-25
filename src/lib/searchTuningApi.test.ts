import { describe, expect, it } from 'vitest';
import {
  fromRemoteAlias,
  fromRemoteReport,
  panelAliasKind,
  readSearchReport,
  rebuildIndex,
  saveAliasRow,
  saveBoostFor,
  sqlAliasKind,
} from './searchTuningApi';

/**
 * Plan §16H.11 and §3A.12, ticket O-52. The tuning screen has to work in two
 * worlds: the browser collection while M-50 is unapplied, and `search_aliases`
 * plus `set_search_boost`, `get_search_report` and `rebuild_search_index` once
 * it lands. These tests hold the seam that makes that one screen.
 */

describe('the alias kind the table stores (§16H.11)', () => {
  // `search_aliases.kind` allows three values; the panel offers four targets.
  // A listing and a guide are both a synonym to the function, so the mapping has
  // to be many-to-one rather than a rename.
  it('maps the panel kinds onto the three the table allows', () => {
    expect(sqlAliasKind('city')).toBe('city');
    expect(sqlAliasKind('category')).toBe('category');
    expect(sqlAliasKind('listing')).toBe('synonym');
    expect(sqlAliasKind('guide')).toBe('synonym');
  });

  it('maps back without inventing a fifth kind', () => {
    expect(panelAliasKind('city')).toBe('city');
    expect(panelAliasKind('category')).toBe('category');
    expect(panelAliasKind('synonym')).toBe('listing');
    // A kind this build does not know reads as the generic object alias.
    expect(panelAliasKind('something_new')).toBe('listing');
  });

  it('round-trips a city and a category unchanged', () => {
    for (const kind of ['city', 'category'] as const) {
      expect(panelAliasKind(sqlAliasKind(kind))).toBe(kind);
    }
  });
});

describe('a server alias row in the panel shape', () => {
  it('reads the columns the table has, and keeps an inactive row visible', () => {
    const row = fromRemoteAlias({
      id: '11111111-2222-3333-4444-555555555555',
      kind: 'synonym',
      term: 'shwedagon',
      target: 'Shwedagon Pagoda',
      active: false,
      updated_at: '2026-12-01T03:00:00.000Z',
      updated_by: '99999999-2222-3333-4444-555555555555',
    });
    expect(row).toEqual({
      id: '11111111-2222-3333-4444-555555555555',
      term: 'shwedagon',
      target: 'Shwedagon Pagoda',
      kind: 'listing',
      active: false,
      updated_at: '2026-12-01T03:00:00.000Z',
      updated_by: '99999999-2222-3333-4444-555555555555',
    });
  });

  it('treats a missing active flag as on, because the column defaults to true', () => {
    const row = fromRemoteAlias({
      id: 'a',
      kind: 'city',
      term: 'inle',
      target: 'inle',
      active: undefined as unknown as boolean,
      updated_at: null,
      updated_by: null,
    });
    expect(row.active).toBe(true);
    expect(row.updated_by).toBe('—');
  });
});

describe('the report the function returns (§16H.11)', () => {
  it('fills the columns the panel shows and keeps the click-through as sent', () => {
    const { rows, ctr } = fromRemoteReport({
      top_queries: [
        { query: 'hotel', searches: 12, clicks: 5 },
        { query: 'bagan', searches: 4, clicks: 0 },
      ],
      zero_result_queries: [{ query: 'zzz', searches: 2 }],
      click_through: 31.3,
    });
    expect(rows).toEqual([
      { query: 'hotel', results: 12, clicks: 5 },
      { query: 'bagan', results: 4, clicks: 0 },
    ]);
    expect(ctr).toBe(31.3);
  });

  // §3A.2 rule 4: no events means no rows, never a sample.
  it('answers no rows for an empty or missing payload', () => {
    expect(fromRemoteReport(null)).toEqual({ rows: [], ctr: 0 });
    expect(fromRemoteReport({ top_queries: [], zero_result_queries: [], click_through: 0 })).toEqual({ rows: [], ctr: 0 });
  });
});

describe('the seam with the flag off', () => {
  // The suite runs without Supabase configured, which is the preview case: every
  // write has to succeed locally and every server-only call has to refuse rather
  // than reach the network.
  it('saves an alias locally and hands the row back unchanged', async () => {
    const row = { id: 'al-9', term: 'test', target: 'Test', kind: 'listing' as const, active: true, updated_at: '', updated_by: '' };
    const outcome = await saveAliasRow(row);
    expect(outcome).toEqual({ ok: true, row });
  });

  it('keeps a boost locally while the flag is off, naming the object it lifts', async () => {
    expect(await saveBoostFor('hotels', 'ph1', 10)).toEqual({ ok: true, applied: 'local' });
  });

  it('reads the report from the preview callback', async () => {
    const outcome = await readSearchReport('2026-11-01', '2026-11-30', () => ({
      rows: [{ query: 'hotel', results: 3, clicks: 1 }],
      ctr: 33.3,
    }));
    expect(outcome).toEqual({ ok: true, rows: [{ query: 'hotel', results: 3, clicks: 1 }], ctr: 33.3, source: 'preview' });
  });

  it('refuses a rebuild instead of pretending it wrote rows', async () => {
    const outcome = await rebuildIndex();
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('common_error_forbidden');
  });
});
