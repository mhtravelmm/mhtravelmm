import { describe, expect, it, vi } from 'vitest';
import { AD_SERVE_CACHE_MS, clearAdServeCache, serveAdFor, toServedAd, type ServeRow } from './adServingApi';

const row: ServeRow = {
  creative_id: 'cr-1',
  campaign_id: 'camp-1',
  kind: 'image',
  media_url: '/images/blog/shwedagon-evening.webp',
  click_url: 'https://example.com/offer',
  alt_mm: 'ကြော်ငြာ',
  alt_en: 'An ad',
  alt_text: 'ကြော်ငြာ',
  advertiser_name: 'MH Partner',
};

describe('toServedAd', () => {
  it('maps the RPC row onto the shape the slot renders', () => {
    expect(toServedAd(row, 'home_hero')).toEqual({
      id: 'cr-1',
      campaignId: 'camp-1',
      placementKey: 'home_hero',
      type: 'image',
      mediaUrl: '/images/blog/shwedagon-evening.webp',
      clickThroughUrl: 'https://example.com/offer',
      advertiser: 'MH Partner',
      altMm: 'ကြော်ငြာ',
      altEn: 'An ad',
    });
  });

  it('treats any kind other than video as an image', () => {
    expect(toServedAd({ ...row, kind: 'gif' }, 'home_hero').type).toBe('image');
    expect(toServedAd({ ...row, kind: 'video' }, 'home_hero').type).toBe('video');
  });
});

describe('serveAdFor', () => {
  it('asks the RPC with the placement and the language', async () => {
    clearAdServeCache();
    const remote = vi.fn(async () => toServedAd(row, 'home_hero'));
    await serveAdFor('home_hero', 'en', new Date('2026-11-25T03:00:00Z'), remote);
    expect(remote).toHaveBeenCalledWith('home_hero', 'en');
  });

  it('serves the same answer inside the 60-second window', async () => {
    clearAdServeCache();
    const remote = vi.fn(async () => toServedAd(row, 'home_hero'));
    const at = new Date('2026-11-25T03:00:00Z');
    await serveAdFor('home_hero', 'mm', at, remote);
    await serveAdFor('home_hero', 'mm', new Date(at.getTime() + AD_SERVE_CACHE_MS - 1), remote);
    expect(remote).toHaveBeenCalledTimes(1);
  });

  it('asks again once the window has passed', async () => {
    clearAdServeCache();
    const remote = vi.fn(async () => toServedAd(row, 'home_hero'));
    const at = new Date('2026-11-25T03:00:00Z');
    await serveAdFor('home_hero', 'mm', at, remote);
    await serveAdFor('home_hero', 'mm', new Date(at.getTime() + AD_SERVE_CACHE_MS), remote);
    expect(remote).toHaveBeenCalledTimes(2);
  });

  it('caches per language, because the alt text differs', async () => {
    clearAdServeCache();
    const remote = vi.fn(async (_key: string, language: string) =>
      toServedAd({ ...row, alt_text: language === 'en' ? 'An ad' : 'ကြော်ငြာ' }, 'home_hero'),
    );
    const at = new Date('2026-11-25T03:00:00Z');
    await serveAdFor('home_hero', 'mm', at, remote);
    await serveAdFor('home_hero', 'en', at, remote);
    expect(remote).toHaveBeenCalledTimes(2);
  });

  it('keeps a null answer, so a collapsed slot is not re-asked on every render', async () => {
    clearAdServeCache();
    const remote = vi.fn(async () => null);
    const at = new Date('2026-11-25T03:00:00Z');
    expect(await serveAdFor('home_hero', 'mm', at, remote)).toBeNull();
    expect(await serveAdFor('home_hero', 'mm', at, remote)).toBeNull();
    expect(remote).toHaveBeenCalledTimes(1);
  });
});
