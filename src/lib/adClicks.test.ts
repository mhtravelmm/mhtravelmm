import { describe, expect, it } from 'vitest';
import { clickThroughHref, resolveAdClick } from './adClicks';
import type { AdCreativeRow } from './adCampaigns';

const creative: AdCreativeRow = {
  id: 'cr-1',
  campaignId: 'camp-1',
  type: 'image',
  mediaUrl: '/images/ads/a.webp',
  clickUrl: 'https://example.com/offer',
  altMm: 'ကြော်ငြာ',
  altEn: 'An ad',
  approval: 'approved',
  rejectedReason: '',
  bytes: 120_000,
};

describe('resolveAdClick', () => {
  it('returns the creative and its click URL', () => {
    expect(resolveAdClick('cr-1', [creative])).toEqual({ url: 'https://example.com/offer', creative });
  });

  it('goes home for an unknown id, with nothing to record', () => {
    expect(resolveAdClick('cr-missing', [creative])).toEqual({ url: '/', creative: null });
  });

  it('refuses a creative whose click URL is empty', () => {
    expect(resolveAdClick('cr-1', [{ ...creative, clickUrl: '  ' }])).toEqual({ url: '/', creative: null });
  });
});

describe('clickThroughHref', () => {
  it('carries the placement and the session so the count is attributable', () => {
    const href = clickThroughHref('cr-1', 'home_hero', 'sess-9');
    expect(href).toBe('/ad/click/cr-1?p=home_hero&s=sess-9');
  });

  it('escapes an id that would otherwise break the path', () => {
    expect(clickThroughHref('cr/1', 'blog_inline', 's')).toContain('/ad/click/cr%2F1');
  });
});
