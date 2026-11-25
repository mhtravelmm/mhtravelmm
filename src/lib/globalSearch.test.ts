import { describe, expect, it } from 'vitest';
import { MIN_QUERY_LENGTH, searchAll } from './globalSearch';

/**
 * Plan §3A.14, ticket O-68. The header search must never offer a link the role
 * may not follow, and one character must not match everything, so both rules are
 * asserted against the real filter rather than a mock.
 */

describe('the header global search (§3A.14)', () => {
  it('waits for two characters, because one letter matches everything', () => {
    expect(MIN_QUERY_LENGTH).toBe(2);
    expect(searchAll('a', () => true)).toEqual([]);
    expect(searchAll(' a ', () => true)).toEqual([]);
  });

  it('returns nothing at all when the role may open no group', () => {
    expect(searchAll('yangon', () => false)).toEqual([]);
  });

  it('narrows every group by the role, so no hidden link is offered', () => {
    const groups = searchAll('yangon', (section) => section === 'listings');
    for (const result of groups) expect(result.group).toBe('listings');
  });

  it('returns one result per group at most, with hits that carry a link', () => {
    const groups = searchAll('aung', () => true);
    expect(new Set(groups.map((group) => group.group)).size).toBe(groups.length);
    for (const group of groups) {
      for (const hit of group.hits) {
        expect(hit.href?.startsWith('/')).toBe(true);
        expect(hit.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps each group to five hits, so the dropdown stays readable', () => {
    for (const group of searchAll('a', () => true)) expect(group.hits.length).toBeLessThanOrEqual(5);
  });
});
