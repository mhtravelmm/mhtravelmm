import { beforeEach, describe, expect, it } from 'vitest';
import { applyCampaignWindow, dueToEnd, dueToStart, endingWithin, remindEndingCampaigns } from './adCampaignJobs';
import { readCampaigns, readCreatives, readPlacements, recordAdEvent, serveAdNow, writeCampaigns } from './adStore';
import { readAdminAudit } from './adminAudit';
import { readFeed, canSee } from './notificationFeed';
import type { AdCampaign } from './adCampaigns';

function fakeWindow() {
  const map = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => { map.set(key, value); },
      removeItem: (key: string) => { map.delete(key); },
      clear: () => map.clear(),
      key: () => null,
      get length() { return map.size; },
    },
    dispatchEvent: () => true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'Mozilla/5.0 (Macintosh) Safari/605.1' },
    configurable: true,
    writable: true,
  });
}

beforeEach(() => { fakeWindow(); });

const NOW = new Date('2026-11-20T06:00:00Z');

function campaign(overrides: Partial<AdCampaign> = {}): AdCampaign {
  return {
    id: 'camp-window',
    advertiser: 'MH Travel',
    name: 'Explore Myanmar',
    status: 'Approved',
    startAt: '2026-11-20T05:00:00.000Z',
    endAt: '2026-12-20T05:00:00.000Z',
    priority: 10,
    weight: 1,
    agreedFeeMmk: 300000,
    invoiced: false,
    paid: false,
    placementKeys: ['home_hero'],
    createdBy: 'MH Travel',
    approvedBy: 'Super Admin',
    approvedAt: '2026-11-19T00:00:00.000Z',
    updatedAt: '2026-11-19T00:00:00.000Z',
    ...overrides,
  };
}

describe('the §16B.7 ad_campaign_window job', () => {
  it('starts an Approved campaign whose window has opened', () => {
    expect(dueToStart([campaign()], NOW).map((row) => row.id)).toEqual(['camp-window']);
    expect(dueToStart([campaign({ status: 'Paused' })], NOW)).toEqual([]);
    expect(dueToStart([campaign({ startAt: '2026-11-25T00:00:00.000Z' })], NOW)).toEqual([]);
  });

  it('does not start a campaign whose whole window is already past', () => {
    const missed = campaign({ startAt: '2026-11-01T00:00:00.000Z', endAt: '2026-11-05T00:00:00.000Z' });
    expect(dueToStart([missed], NOW)).toEqual([]);
    expect(dueToEnd([missed], NOW).map((row) => row.id)).toEqual(['camp-window']);
  });

  it('ends a Live campaign past its end instant', () => {
    expect(dueToEnd([campaign({ status: 'Live' })], NOW)).toEqual([]);
    const expired = campaign({ status: 'Live', endAt: '2026-11-20T05:00:00.000Z' });
    expect(dueToEnd([expired], NOW).map((row) => row.id)).toEqual(['camp-window']);
  });

  it('moves both statuses in one pass and audits each move', () => {
    writeCampaigns([
      campaign({ id: 'camp-start' }),
      campaign({ id: 'camp-end', status: 'Live', endAt: '2026-11-20T05:30:00.000Z' }),
    ]);
    const run = applyCampaignWindow(NOW);
    expect(run).toEqual({ started: 1, ended: 1 });

    const rows = readCampaigns();
    expect(rows.find((row) => row.id === 'camp-start')?.status).toBe('Live');
    expect(rows.find((row) => row.id === 'camp-end')?.status).toBe('Ended');

    const audit = readAdminAudit();
    expect(audit.filter((entry) => entry.objectType === 'ad')).toHaveLength(2);
    expect(audit.every((entry) => entry.actor === 'system' && entry.source === 'ads')).toBe(true);
  });

  it('is idempotent: a second pass changes nothing', () => {
    writeCampaigns([campaign()]);
    applyCampaignWindow(NOW);
    expect(applyCampaignWindow(NOW)).toEqual({ started: 0, ended: 0 });
  });

  it('warns Ads Admin when a campaign ends, and only then', () => {
    writeCampaigns([campaign({ id: 'camp-end', status: 'Live', endAt: '2026-11-20T05:30:00.000Z' })]);
    applyCampaignWindow(NOW);
    const rows = readFeed().filter((row) => row.event === 'campaign_ended');
    expect(rows).toHaveLength(1);
    expect(canSee(rows[0], { role: 'Ads Admin' })).toBe(true);
    expect(canSee(rows[0], { role: 'Rental Admin' })).toBe(false);
  });

  it('lists campaigns closing inside three days for the reminder', () => {
    const closing = campaign({ status: 'Live', endAt: '2026-11-22T06:00:00.000Z' });
    expect(endingWithin([closing], NOW, 3).map((row) => row.id)).toEqual(['camp-window']);
    writeCampaigns([closing]);
    expect(remindEndingCampaigns(NOW, 3)).toBe(1);
    expect(readFeed().filter((row) => row.event === 'campaign_ending')).toHaveLength(1);
  });
});

describe('the seeded ad store', () => {
  // The seeds open a window around the moment the store is first read, so the
  // tests use the wall clock rather than a fixed instant.
  const today = new Date();

  it('serves an ad on every placement family a page uses', () => {
    for (const key of ['home_hero', 'blog_post_top', 'rentals_top', 'cities_top', 'nearby_top']) {
      expect(serveAdNow(key, today), key).not.toBeNull();
    }
    expect(readPlacements().length).toBeGreaterThan(0);
    expect(readCreatives().every((creative) => creative.approval === 'approved')).toBe(true);
  });

  it('stops serving once the campaign is paused', () => {
    const campaigns = readCampaigns();
    writeCampaigns(campaigns.map((row) => ({ ...row, status: 'Paused' as const })));
    expect(serveAdNow('home_hero', today)).toBeNull();
  });

  it('counts one impression per page view and refuses a bot', () => {
    const input = {
      placementKey: 'home_hero',
      campaignId: 'camp-home-hero',
      creativeId: 'cr-home-hero',
      kind: 'impression' as const,
      sessionHash: 'sess-1',
      now: NOW,
    };
    expect(recordAdEvent(input)).toBe(true);
    expect(recordAdEvent(input)).toBe(false);

    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: 'Googlebot/2.1' },
      configurable: true,
      writable: true,
    });
    expect(recordAdEvent({ ...input, sessionHash: 'sess-2' })).toBe(false);
  });
});
