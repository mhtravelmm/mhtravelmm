import { describe, expect, it } from 'vitest';
import {
  AD_EVENT_RETENTION_DAYS,
  appendEvent,
  clickThroughRate,
  eventKey,
  fillRate,
  filledPlacementKeys,
  isBotUserAgent,
  mergeRollUp,
  purgeBefore,
  rollUp,
  totals,
  type AdEvent,
} from './adStats';

function event(overrides: Partial<AdEvent> = {}): AdEvent {
  return {
    id: 'ev-1',
    placementKey: 'home_hero',
    campaignId: 'camp-1',
    creativeId: 'cr-1',
    kind: 'impression',
    at: '2026-11-20T03:00:00.000Z',
    sessionHash: 'sess-1',
    userId: null,
    ...overrides,
  };
}

describe('the §16A.5 counting rules', () => {
  it('drops the same creative twice on one page view', () => {
    const once = appendEvent([], event());
    const twice = appendEvent(once, event({ id: 'ev-2' }));
    expect(once).toHaveLength(1);
    expect(twice).toHaveLength(1);
  });

  it('counts the same creative again on a new page view', () => {
    const once = appendEvent([], event());
    const twice = appendEvent(once, event({ id: 'ev-2', sessionHash: 'sess-2' }));
    expect(twice).toHaveLength(2);
  });

  it('counts a click and an impression separately', () => {
    const rows = appendEvent(appendEvent([], event()), event({ id: 'ev-2', kind: 'click' }));
    expect(rows).toHaveLength(2);
  });

  it('keys an event by session, placement, creative and kind', () => {
    expect(eventKey(event())).toBe('sess-1:home_hero:cr-1:impression');
  });

  it('ignores the user agents that would inflate a count', () => {
    expect(isBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true);
    expect(isBotUserAgent('HeadlessChrome/120')).toBe(true);
    expect(isBotUserAgent('Mozilla/5.0 (Macintosh) Safari/605.1')).toBe(false);
  });
});

describe('the §16A.4 daily roll-up', () => {
  it('groups by Myanmar Time day, not UTC day', () => {
    // 18:00 UTC on the 20th is 00:30 on the 21st in Myanmar.
    const rows = rollUp([event({ at: '2026-11-20T18:00:00.000Z' })]);
    expect(rows[0].day).toBe('2026-11-21');
  });

  it('adds impressions and clicks per placement and campaign', () => {
    const rows = rollUp([
      event(),
      event({ id: 'ev-2', sessionHash: 'sess-2' }),
      event({ id: 'ev-3', kind: 'click', sessionHash: 'sess-3' }),
    ]);
    expect(rows).toEqual([
      { day: '2026-11-20', placementKey: 'home_hero', campaignId: 'camp-1', impressions: 2, clicks: 1 },
    ]);
  });

  it('replaces a recomputed day so a rerun is idempotent', () => {
    const first = rollUp([event()]);
    const second = mergeRollUp(first, rollUp([event(), event({ id: 'ev-2', sessionHash: 'sess-2' })]));
    expect(second).toHaveLength(1);
    expect(second[0].impressions).toBe(2);
  });

  it('keeps a day the fresh pass did not touch', () => {
    const older = { day: '2026-11-01', placementKey: 'home_hero', campaignId: 'camp-1', impressions: 5, clicks: 1 };
    const merged = mergeRollUp([older], rollUp([event()]));
    expect(merged).toHaveLength(2);
  });
});

describe('the §16A.7 report figures', () => {
  it('computes CTR to one decimal and never divides by zero', () => {
    expect(clickThroughRate(200, 5)).toBe(2.5);
    expect(clickThroughRate(0, 5)).toBe(0);
    expect(clickThroughRate(3, 1)).toBe(33.3);
  });

  it('computes the fill rate of served requests', () => {
    expect(fillRate(3, 4)).toBe(75);
    expect(fillRate(0, 0)).toBe(0);
  });

  it('totals a set of rows', () => {
    const rows = [
      { day: '2026-11-20', placementKey: 'home_hero', campaignId: 'camp-1', impressions: 100, clicks: 4 },
      { day: '2026-11-20', placementKey: 'blog_inline', campaignId: 'camp-1', impressions: 100, clicks: 1 },
    ];
    expect(totals(rows)).toEqual({ impressions: 200, clicks: 5, ctr: 2.5 });
  });
});

describe('the §16B.7 raw event purge', () => {
  it('keeps 90 days and reports what it dropped', () => {
    const now = new Date('2026-11-20T00:00:00.000Z');
    const fresh = event({ id: 'fresh', at: '2026-11-19T00:00:00.000Z' });
    const old = event({ id: 'old', at: '2026-08-01T00:00:00.000Z' });
    const { kept, purged } = purgeBefore([fresh, old], now);
    expect(purged).toBe(1);
    expect(kept.map((row) => row.id)).toEqual(['fresh']);
    expect(AD_EVENT_RETENTION_DAYS).toBe(90);
  });
});

describe('the §16A.7 placement fill rate', () => {
  it('counts a placement as filled only when it served an impression today', () => {
    const rows = [
      { day: '2026-11-20', placementKey: 'home_hero', campaignId: 'c1', impressions: 4, clicks: 1 },
      { day: '2026-11-20', placementKey: 'cities_top', campaignId: 'c2', impressions: 0, clicks: 0 },
      { day: '2026-11-19', placementKey: 'rentals_top', campaignId: 'c3', impressions: 9, clicks: 0 },
    ];
    expect(filledPlacementKeys(rows, '2026-11-20')).toEqual(['home_hero']);
  });
});
