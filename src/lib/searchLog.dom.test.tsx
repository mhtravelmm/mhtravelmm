import { beforeEach, describe, expect, it } from 'vitest';
import { searchLog, type SearchLogRow } from './searchLog';

/**
 * The browser half of `search_log` (§16H.11): the preview report needs rows, and
 * a query typed while the server is unreachable is kept until the next call. The
 * rules themselves — what is worth logging, and the 90-day window — are in
 * `searchLog.test.ts`, which runs without a DOM.
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

describe('the browser log', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts empty, so the report shows no rows rather than a sample', () => {
    expect(searchLog.read()).toEqual([]);
  });

  it('round-trips a row and can be cleared', () => {
    searchLog.write([row()]);
    expect(searchLog.read()).toHaveLength(1);
    expect(searchLog.reset()).toEqual([]);
  });

  it('drops a stored row that no longer has the shape it expects', () => {
    window.localStorage.setItem('mh-travel-search-log', JSON.stringify([{ id: 'broken' }, row()]));
    expect(searchLog.read().map((entry) => entry.id)).toEqual(['log-1']);
  });
});
