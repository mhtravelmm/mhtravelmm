import { recordAdminAudit } from './adminAudit';
import { pushFeedNotice } from './adminNotices';
import { translate } from './translations';
import { readCampaigns, writeCampaigns } from './adStore';
import { hasEnded, type AdCampaign, type CampaignStatus } from './adCampaigns';

/**
 * Plan §16B.7 `ad_campaign_window` (every minute) and §16A.6: Approved becomes
 * Live at `start_at`, Live becomes Ended at `end_at`. Both moves are guarded by
 * the status machine, so a second pass over the same campaign changes nothing
 * and a Paused campaign is never restarted by the clock.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function text(key: string, fallback: string): string {
  return translate(key, 'en') ?? fallback;
}

/**
 * Campaigns whose window opens now, including one that started in the past.
 * Only `Approved` is considered: a Paused campaign is a decision, so the clock
 * must not resume it behind the Ads Admin's back.
 */
export function dueToStart(campaigns: AdCampaign[], now: Date): AdCampaign[] {
  return campaigns.filter((campaign) => {
    if (campaign.status !== 'Approved') return false;
    const start = new Date(campaign.startAt).getTime();
    if (Number.isNaN(start)) return false;
    return start <= now.getTime() && !hasEnded(campaign, now);
  });
}

/** Live campaigns past `end_at`, plus an Approved one whose window closed unfilled. */
export function dueToEnd(campaigns: AdCampaign[], now: Date): AdCampaign[] {
  return campaigns.filter((campaign) => {
    if (campaign.status !== 'Live' && campaign.status !== 'Approved') return false;
    return hasEnded(campaign, now);
  });
}

/** Campaigns closing inside `days`, for the 3-day reminder in §16B.3. */
export function endingWithin(campaigns: AdCampaign[], now: Date, days = 3): AdCampaign[] {
  const horizon = now.getTime() + days * DAY_MS;
  return campaigns.filter((campaign) => {
    if (campaign.status !== 'Live' && campaign.status !== 'Approved') return false;
    const end = new Date(campaign.endAt).getTime();
    if (Number.isNaN(end)) return false;
    return end > now.getTime() && end <= horizon;
  });
}

function move(campaign: AdCampaign, status: CampaignStatus, now: Date): AdCampaign {
  return { ...campaign, status, updatedAt: now.toISOString() };
}

export type CampaignWindowRun = { started: number; ended: number };

/**
 * One pass of the job. Every change writes an audit row, because §16A.9 asks
 * for one per campaign change and the actor here is `system`.
 */
export function applyCampaignWindow(now = new Date()): CampaignWindowRun {
  const campaigns = readCampaigns();
  if (campaigns.length === 0) return { started: 0, ended: 0 };

  const started = dueToStart(campaigns, now);
  const ended = dueToEnd(campaigns, now);
  if (started.length === 0 && ended.length === 0) return { started: 0, ended: 0 };

  const next = campaigns.map((campaign) => {
    if (started.some((row) => row.id === campaign.id)) return move(campaign, 'Live', now);
    if (ended.some((row) => row.id === campaign.id)) return move(campaign, 'Ended', now);
    return campaign;
  });
  writeCampaigns(next);

  for (const campaign of started) {
    recordAdminAudit({
      actor: 'system',
      actorRole: 'system',
      action: 'published',
      objectType: 'ad',
      objectId: campaign.id,
      summary: `${campaign.name} · Live`,
      source: 'ads',
    }, now);
  }

  for (const campaign of ended) {
    recordAdminAudit({
      actor: 'system',
      actorRole: 'system',
      action: 'updated',
      objectType: 'ad',
      objectId: campaign.id,
      summary: `${campaign.name} · Ended`,
      source: 'ads',
    }, now);
    pushFeedNotice('campaign_ended', {
      title: text('ad_feed_ended_title', 'Campaign ended'),
      message: `${campaign.name} · ${campaign.advertiser}`,
      href: '/super-admin',
      at: now,
    });
  }

  return { started: started.length, ended: ended.length };
}

/** §16B.3: the 3-day warning, raised once per campaign per day by the caller. */
export function remindEndingCampaigns(now = new Date(), days = 3): number {
  const rows = endingWithin(readCampaigns(), now, days);
  for (const campaign of rows) {
    pushFeedNotice('campaign_ending', {
      title: text('ad_feed_ending_title', 'Campaign ends in 3 days'),
      message: `${campaign.name} · ${campaign.advertiser}`,
      href: '/super-admin',
      at: now,
    });
  }
  return rows.length;
}
