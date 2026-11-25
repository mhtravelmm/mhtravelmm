import { describe, expect, it } from 'vitest';
import { BOOST_MAX, BOOST_MIN, aliasProblem, boostValid, searchReport, statsFromLog, type SearchAliasRow } from './adminSearch';

/**
 * Plan §16H.11 and §3A.12. An alias that duplicates another would make the
 * search function pick one at random, and a weight outside −20…50 would drown
 * every other field, so both are refused before the write.
 */

function alias(overrides: Partial<SearchAliasRow> = {}): SearchAliasRow {
  return {
    id: 'al-1', term: 'shwedagon', target: 'Shwedagon Pagoda', kind: 'listing',
    active: true, updated_at: '2026-11-20T02:00:00.000Z', updated_by: 'Super Admin',
    ...overrides,
  };
}

describe('search aliases (§3A.12)', () => {
  it('requires a term and a target', () => {
    expect(aliasProblem({ id: 'al-2', term: ' ', target: 'Bagan' }, [])).toBe('term_required');
    expect(aliasProblem({ id: 'al-2', term: 'bagan', target: '  ' }, [])).toBe('target_required');
  });

  it('refuses a term another alias already owns, ignoring case', () => {
    expect(aliasProblem({ id: 'al-2', term: 'Shwedagon', target: 'Bagan' }, [alias()])).toBe('term_duplicate');
  });

  it('allows an alias to keep its own term while editing', () => {
    expect(aliasProblem({ id: 'al-1', term: 'shwedagon', target: 'Shwedagon Pagoda' }, [alias()])).toBeNull();
  });

  it('accepts a new term', () => {
    expect(aliasProblem({ id: 'al-2', term: 'bagan', target: 'Bagan' }, [alias()])).toBeNull();
  });
});

describe('boost weights (§16H.11)', () => {
  it('accepts the ends of the range and refuses what lies outside it', () => {
    expect(boostValid(BOOST_MIN)).toBe(true);
    expect(boostValid(BOOST_MAX)).toBe(true);
    expect(boostValid(BOOST_MIN - 1)).toBe(false);
    expect(boostValid(BOOST_MAX + 1)).toBe(false);
  });

  it('refuses a value that is not a number at all', () => {
    expect(boostValid(Number.NaN)).toBe(false);
  });
});

describe('the search report (§16H.11)', () => {
  it('reports nothing for an empty log rather than a sample', () => {
    expect(searchReport([])).toEqual({ top: [], zero: [], ctr: 0 });
  });

  it('ranks by clicks and lists the queries that found nothing', () => {
    const report = searchReport([
      { query: 'bagan', results: 12, clicks: 3 },
      { query: 'inle', results: 8, clicks: 9 },
      { query: 'hot air balloon', results: 0, clicks: 0 },
    ]);
    expect(report.top.map((row) => row.query)).toEqual(['inle', 'bagan', 'hot air balloon']);
    expect(report.zero.map((row) => row.query)).toEqual(['hot air balloon']);
  });

  it('computes the click-through rate as clicks over impressions', () => {
    const report = searchReport([
      { query: 'a', results: 50, clicks: 5 },
      { query: 'b', results: 50, clicks: 15 },
    ]);
    expect(report.ctr).toBe(20);
  });
});

describe('the log as report rows (§16H.11)', () => {
  it('folds repeated searches into one row per query', () => {
    const stats = statsFromLog([
      { q_normalized: 'bagan', result_count: 3, clicked_ref: null },
      { q_normalized: 'bagan', result_count: 3, clicked_ref: 'cities:bagan' },
      { q_normalized: 'inle', result_count: 0, clicked_ref: null },
    ]);
    expect(stats).toEqual([
      { query: 'bagan', results: 6, clicks: 1 },
      { query: 'inle', results: 0, clicks: 0 },
    ]);
  });

  it('counts only a row that names what was clicked', () => {
    const stats = statsFromLog([{ q_normalized: 'hotels', result_count: 5, clicked_ref: '' }]);
    expect(stats[0].clicks).toBe(0);
  });

  it('feeds the report: a query with no results lands in the zero list', () => {
    const report = searchReport(statsFromLog([{ q_normalized: 'hot air balloon', result_count: 0, clicked_ref: null }]));
    expect(report.zero.map((row) => row.query)).toEqual(['hot air balloon']);
    expect(report.ctr).toBe(0);
  });
});
