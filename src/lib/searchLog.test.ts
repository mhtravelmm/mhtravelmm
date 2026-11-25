import { describe, expect, it } from 'vitest';
import { SEARCH_LOG_RETENTION_DAYS, recentLogRows, shouldLog, type SearchLogRow } from './searchLog';

/**
 * Plan §16H.11: the log holds the normalized query only, is cut to 90 days, and
 * never records something too short or too long to be a search.
 */

function row(overrides: Partial<SearchLogRow> = {}): SearchLogRow {
  return {
    id: 'log-1',
    at: '2026-12-01T00:00:00.000Z',
    q_normalized: 'hotels',
    lang: 'en',
    kind: 'hotels',
    result_count: 3,
    clicked_ref: null,
    ...overrides,
  };
}

describe('what the log keeps (§16H.11)', () => {
  it('records the normalized query, so Zawgyi and Unicode are one row', () => {
    const unicode = shouldLog('ရန်ကုန်', undefined);
    const zawgyi = shouldLog('\u101b\u1014\u1039\u1000\u102f\u1014\u1039', undefined);
    expect(unicode).toBe(true);
    expect(zawgyi).toBe(true);
  });

  it('refuses a one-character query and an over-long one', () => {
    expect(shouldLog('a', undefined)).toBe(false);
    expect(shouldLog('  ', undefined)).toBe(false);
    expect(shouldLog('a'.repeat(81), undefined)).toBe(false);
    expect(shouldLog('ab', undefined)).toBe(true);
  });

  it('does not write the same query twice in a row', () => {
    expect(shouldLog('Hotels', row({ q_normalized: 'hotels' }))).toBe(false);
    expect(shouldLog('cafes', row({ q_normalized: 'hotels' }))).toBe(true);
  });
});

describe('the 90-day window (§16H.11)', () => {
  it('drops a row older than the retention window', () => {
    const now = new Date('2026-12-02T00:00:00.000Z');
    const inside = row({ id: 'in', at: '2026-12-01T00:00:00.000Z' });
    const outside = row({ id: 'out', at: '2026-08-01T00:00:00.000Z' });
    expect(recentLogRows([inside, outside], now).map((entry) => entry.id)).toEqual(['in']);
  });

  it('keeps exactly the boundary day', () => {
    const now = new Date('2026-12-02T00:00:00.000Z');
    const boundary = new Date(now.getTime() - SEARCH_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    expect(recentLogRows([row({ at: boundary.toISOString() })], now)).toHaveLength(1);
  });

  it('drops a row whose date cannot be read rather than placing it', () => {
    expect(recentLogRows([row({ at: 'yesterday' })])).toHaveLength(0);
  });

  it('returns the rows oldest first, whatever the storage order', () => {
    const now = new Date('2026-12-02T00:00:00.000Z');
    const rows = [
      row({ id: 'b', at: '2026-12-01T00:00:00.000Z' }),
      row({ id: 'a', at: '2026-11-30T00:00:00.000Z' }),
    ];
    expect(recentLogRows(rows, now).map((entry) => entry.id)).toEqual(['a', 'b']);
  });
});
