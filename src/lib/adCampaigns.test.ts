import { describe, expect, it } from 'vitest';
import { AD_PLACEMENTS, setPlacementActive } from './adPlacements';
import {
  campaignProblem,
  canMove,
  canServe,
  creativeProblem,
  filterCampaigns,
  hasEnded,
  isSafeClickUrl,
  normalizedPlacementKeys,
  pickCampaign,
  serveAd,
  type AdCampaign,
  type AdCreativeRow,
} from './adCampaigns';

const NOW = new Date('2026-11-20T06:00:00Z');

function campaign(overrides: Partial<AdCampaign> = {}): AdCampaign {
  return {
    id: 'camp-1',
    advertiser: 'MH Travel',
    name: 'Explore Myanmar',
    status: 'Live',
    startAt: '2026-11-01T00:00:00.000Z',
    endAt: '2026-12-01T00:00:00.000Z',
    priority: 10,
    weight: 1,
    agreedFeeMmk: 500000,
    invoiced: true,
    paid: false,
    placementKeys: ['home_hero'],
    createdBy: 'MH Travel',
    approvedBy: 'Super Admin',
    approvedAt: '2026-10-30T00:00:00.000Z',
    updatedAt: '2026-10-30T00:00:00.000Z',
    ...overrides,
  };
}

function creative(overrides: Partial<AdCreativeRow> = {}): AdCreativeRow {
  return {
    id: 'cr-1',
    campaignId: 'camp-1',
    type: 'image',
    mediaUrl: '/images/blog/bagan-sunrise.webp',
    clickUrl: '/travel-plans',
    altMm: 'ပုဂံ အရုဏ်ဦး',
    altEn: 'Bagan at sunrise',
    approval: 'approved',
    rejectedReason: '',
    bytes: 120000,
    ...overrides,
  };
}

describe('the §16A.6 campaign status machine', () => {
  it('allows only the moves the Plan names', () => {
    expect(canMove('Draft', 'Pending')).toBe(true);
    expect(canMove('Pending', 'Approved')).toBe(true);
    expect(canMove('Pending', 'Rejected')).toBe(true);
    expect(canMove('Approved', 'Live')).toBe(true);
    expect(canMove('Live', 'Paused')).toBe(true);
    expect(canMove('Live', 'Ended')).toBe(true);
    expect(canMove('Paused', 'Live')).toBe(true);
    expect(canMove('Rejected', 'Draft')).toBe(true);
  });

  it('refuses a skipped step and anything out of Ended', () => {
    expect(canMove('Draft', 'Live')).toBe(false);
    expect(canMove('Pending', 'Live')).toBe(false);
    expect(canMove('Ended', 'Live')).toBe(false);
    expect(canMove('Ended', 'Paused')).toBe(false);
  });
});

describe('the §16A.5 serving rules', () => {
  it('serves only a Live campaign inside its window', () => {
    expect(canServe(campaign(), NOW)).toBe(true);
    expect(canServe(campaign({ status: 'Paused' }), NOW)).toBe(false);
    expect(canServe(campaign({ startAt: '2026-12-02T00:00:00.000Z' }), NOW)).toBe(false);
    expect(canServe(campaign({ endAt: '2026-11-19T00:00:00.000Z' }), NOW)).toBe(false);
  });

  it('treats the end instant as closed, so a campaign stops on time', () => {
    expect(hasEnded(campaign({ endAt: NOW.toISOString() }), NOW)).toBe(true);
  });

  it('collapses when the placement is switched off', () => {
    const off = setPlacementActive(AD_PLACEMENTS, 'home_hero', false);
    expect(serveAd('home_hero', [campaign()], [creative()], off, NOW)).toBeNull();
  });

  it('serves the approved creative assigned to the placement', () => {
    const ad = serveAd('home_hero', [campaign()], [creative()], AD_PLACEMENTS, NOW);
    expect(ad).toEqual({
      id: 'cr-1',
      campaignId: 'camp-1',
      placementKey: 'home_hero',
      type: 'image',
      mediaUrl: '/images/blog/bagan-sunrise.webp',
      clickThroughUrl: '/travel-plans',
      advertiser: 'MH Travel',
      altMm: 'ပုဂံ အရုဏ်ဦး',
      altEn: 'Bagan at sunrise',
    });
  });

  it('never serves an unapproved creative or an unassigned campaign', () => {
    expect(serveAd('home_hero', [campaign()], [creative({ approval: 'pending' })], AD_PLACEMENTS, NOW)).toBeNull();
    expect(serveAd('home_after_blogs', [campaign()], [creative()], AD_PLACEMENTS, NOW)).toBeNull();
  });

  it('serves a blog_* key through the inline placement', () => {
    const row = campaign({ placementKeys: ['blog_inline'] });
    expect(serveAd('blog_story-9_reader', [row], [creative()], AD_PLACEMENTS, NOW)?.placementKey).toBe('blog_inline');
  });

  it('lets the higher priority win', () => {
    const high = campaign({ id: 'camp-high', priority: 20 });
    const low = campaign({ id: 'camp-low', priority: 1 });
    const picked = pickCampaign(
      [{ campaign: low, creative: creative() }, { campaign: high, creative: creative() }],
      'home_hero',
      NOW,
    );
    expect(picked?.campaign.id).toBe('camp-high');
  });

  it('rotates equal priorities by weight, stably within the same minute', () => {
    const a = campaign({ id: 'camp-a', weight: 1 });
    const b = campaign({ id: 'camp-b', weight: 1 });
    const candidates = [{ campaign: a, creative: creative() }, { campaign: b, creative: creative() }];
    const first = pickCampaign(candidates, 'home_hero', NOW);
    const again = pickCampaign(candidates, 'home_hero', NOW);
    expect(again?.campaign.id).toBe(first?.campaign.id);

    // Across many minutes both campaigns get a turn, so weight is not ignored.
    const seen = new Set<string>();
    for (let minute = 0; minute < 60; minute += 1) {
      const at = new Date(NOW.getTime() + minute * 60000);
      const picked = pickCampaign(candidates, 'home_hero', at);
      if (picked) seen.add(picked.campaign.id);
    }
    expect(seen.size).toBe(2);
  });
});

describe('the §16A.8 creative rules', () => {
  it('accepts https and an internal path, and refuses anything else', () => {
    expect(isSafeClickUrl('https://example.com/offer')).toBe(true);
    expect(isSafeClickUrl('/travel-plans')).toBe(true);
    expect(isSafeClickUrl('http://example.com')).toBe(false);
    expect(isSafeClickUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeClickUrl('//evil.example.com')).toBe(false);
    expect(isSafeClickUrl('')).toBe(false);
  });

  it('filters the campaign list by status, advertiser, placement and day', () => {
    const live = campaign({ id: 'a', status: 'Live', advertiser: 'Acme', placementKeys: ['home_hero'] });
    const draft = campaign({
      id: 'b',
      status: 'Draft',
      advertiser: 'Beta',
      placementKeys: ['blog_inline'],
      startAt: '2026-12-01T00:00:00.000Z',
      endAt: '2026-12-02T00:00:00.000Z',
    });

    expect(filterCampaigns([live, draft], {}).map((row) => row.id)).toEqual(['a', 'b']);
    expect(filterCampaigns([live, draft], { status: 'Live' }).map((row) => row.id)).toEqual(['a']);
    expect(filterCampaigns([live, draft], { advertiser: 'Beta' }).map((row) => row.id)).toEqual(['b']);
    expect(filterCampaigns([live, draft], { placement: 'home_hero' }).map((row) => row.id)).toEqual(['a']);
    // A campaign overlaps a day anywhere inside its window, not only on its first day.
    const inside = new Date(new Date(live.startAt).getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
    expect(filterCampaigns([live, draft], { day: inside }).map((row) => row.id)).toEqual(['a']);
    expect(filterCampaigns([live, draft], { day: '2020-01-01' })).toEqual([]);
    expect(filterCampaigns([live, draft], { day: 'not-a-day' })).toHaveLength(2);
  });

  it('applies the Settings domain block list to a click URL', () => {
    expect(isSafeClickUrl('https://evil.example.com/x', ['evil.example.com'])).toBe(false);
    expect(isSafeClickUrl('https://ads.evil.example.com/x', ['evil.example.com'])).toBe(false);
    expect(isSafeClickUrl('https://good.example.com/x', ['evil.example.com'])).toBe(true);
    // A blocked entry never matches an internal path, so site links keep working.
    expect(isSafeClickUrl('/travel-plans', ['evil.example.com'])).toBe(true);
  });

  it('refuses a creative over the §16A.8 size or length limit', () => {
    const limits = { imageMaxKb: 300, videoMaxKb: 3072, videoMaxSeconds: 15 };
    expect(creativeProblem(creative({ bytes: 300 * 1024 }), [], limits)).toBeNull();
    expect(creativeProblem(creative({ bytes: 301 * 1024 }), [], limits)).toBe('ad_problem_image_size');

    const video = creative({ type: 'video', bytes: 400 * 1024, durationSeconds: 12 });
    expect(creativeProblem(video, [], limits)).toBeNull();
    expect(creativeProblem({ ...video, durationSeconds: 16 }, [], limits)).toBe('ad_problem_video_length');
    expect(creativeProblem({ ...video, bytes: 4 * 1024 * 1024 }, [], limits)).toBe('ad_problem_video_size');
  });

  it('does not refuse a creative whose size is still unknown', () => {
    // The browser stand-in has no upload Worker to measure the file.
    expect(creativeProblem(creative({ bytes: 0 }))).toBeNull();
  });

  it('requires media, both alt languages and a safe click URL', () => {
    expect(creativeProblem(creative())).toBeNull();
    expect(creativeProblem(creative({ mediaUrl: ' ' }))).toBe('ad_problem_media');
    expect(creativeProblem(creative({ altMm: '' }))).toBe('ad_problem_alt');
    expect(creativeProblem(creative({ altEn: '' }))).toBe('ad_problem_alt');
    expect(creativeProblem(creative({ clickUrl: 'javascript:1' }))).toBe('ad_problem_click_url');
  });
});

describe('the §16A.5 campaign submission check', () => {
  it('needs a name, an advertiser, a real window, a placement and a creative', () => {
    expect(campaignProblem(campaign(), [creative()], AD_PLACEMENTS)).toBeNull();
    expect(campaignProblem(campaign({ name: ' ' }), [creative()], AD_PLACEMENTS)).toBe('ad_problem_name');
    expect(campaignProblem(campaign({ advertiser: '' }), [creative()], AD_PLACEMENTS)).toBe('ad_problem_name');
    expect(campaignProblem(campaign({ endAt: '2026-11-01T00:00:00.000Z' }), [creative()], AD_PLACEMENTS)).toBe('ad_problem_window');
    expect(campaignProblem(campaign({ placementKeys: [] }), [creative()], AD_PLACEMENTS)).toBe('ad_problem_placement');
    expect(campaignProblem(campaign({ placementKeys: ['nowhere'] }), [creative()], AD_PLACEMENTS)).toBe('ad_problem_placement');
    expect(campaignProblem(campaign(), [], AD_PLACEMENTS)).toBe('ad_problem_creative');
    expect(campaignProblem(campaign(), [creative({ altEn: '' })], AD_PLACEMENTS)).toBe('ad_problem_creative');
  });
});

describe('placement reporting', () => {
  it('folds every blog key onto the inline slot and drops duplicates', () => {
    expect(normalizedPlacementKeys(['blog_a_reader', 'blog_inline', 'home_hero'], AD_PLACEMENTS))
      .toEqual(['blog_inline', 'home_hero']);
  });
});
